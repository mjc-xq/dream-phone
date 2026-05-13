"use client";

import { voiceForBoy } from "@/lib/game/cards";
import { BOYS } from "@/lib/game/cards";

let cachedVoices: SpeechSynthesisVoice[] | null = null;

function ensureVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined") return Promise.resolve([]);
  if (cachedVoices && cachedVoices.length > 0) return Promise.resolve(cachedVoices);
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const grab = () => {
      const v = synth.getVoices();
      if (v.length > 0) {
        cachedVoices = v;
        resolve(v);
        return true;
      }
      return false;
    };
    if (grab()) return;
    synth.addEventListener("voiceschanged", () => grab());
    setTimeout(() => {
      const v = synth.getVoices();
      cachedVoices = v;
      resolve(v);
    }, 600);
  });
}

function pickFallbackVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    voices.find((v) => /en[-_]?(US|GB|AU)/.test(v.lang) && /male|daniel|fred|alex|david|aaron/i.test(v.name)) ??
    voices.find((v) => v.lang?.startsWith("en")) ??
    voices[0]
  );
}

async function speakWeb(
  text: string,
  opts: { pitch?: number; rate?: number; volume?: number; signal?: AbortSignal } = {},
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (opts.signal?.aborted) return;
  const voices = await ensureVoices();
  if (opts.signal?.aborted) return;
  const u = new SpeechSynthesisUtterance(text);
  u.pitch = opts.pitch ?? 1;
  u.rate = opts.rate ?? 1;
  u.volume = opts.volume ?? 1;
  const v = pickFallbackVoice(voices);
  if (v) u.voice = v;
  // iOS Safari sometimes has a stuck queue after backgrounding.
  // A pause/resume kick before speak() helps clear the wedge.
  try {
    window.speechSynthesis.resume();
  } catch {}
  window.speechSynthesis.speak(u);
  return new Promise<void>((resolve) => {
    const finish = () => {
      if (opts.signal) opts.signal.removeEventListener("abort", onAbort);
      resolve();
    };
    const onAbort = () => {
      try { window.speechSynthesis.cancel(); } catch {}
      finish();
    };
    u.onend = finish;
    u.onerror = finish;
    if (opts.signal) {
      if (opts.signal.aborted) onAbort();
      else opts.signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

export function cancelSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try { window.speechSynthesis.cancel(); } catch {}
  }
  for (const s of activeSources) {
    try { s.stop(0); } catch {}
    try { s.disconnect(); } catch {}
  }
  activeSources.clear();
  for (const n of activeNodes) {
    try { n.disconnect(); } catch {}
  }
  activeNodes.clear();
}

let audioCtx: AudioContext | null = null;
const activeSources: Set<AudioBufferSourceNode> = new Set();
// Auxiliary nodes (filters, gain) created per playback so we can fully tear
// down the audio graph on session end / unload.
const activeNodes: Set<AudioNode> = new Set();
let recoveryWired = false;

/* iOS silent-switch bypass:
 * iOS Safari mutes Web Audio when the hardware silent switch is on, but it
 * does NOT mute an HTMLAudioElement that's already in "playing" state.
 * Trick: keep a hidden Audio element looping a sub-audible WAV. Once that's
 * playing, subsequent Web Audio plays through even with silent switched on.
 *
 * IMPORTANT: this element is also what tells iOS "this tab is playing media",
 * which shows up in Control Center / lock screen. We MUST stop it the moment
 * we no longer need audio output — otherwise iOS thinks the tab is still
 * playing after it's closed. */
let silentLoop: HTMLAudioElement | null = null;
let silentLoopUrl: string | null = null;
// We only want the silent loop running while a call/audio output is expected.
// During Setup / Handoff / PostCall / GameOver / idle, it must be paused so
// iOS doesn't keep the media session alive.
let silentLoopWanted = false;

function silentWavObjectUrl(): string {
  const sampleRate = 8000;
  const seconds = 1;
  const numSamples = sampleRate * seconds;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const setStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  setStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  setStr(8, "WAVE");
  setStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  setStr(36, "data");
  view.setUint32(40, numSamples * 2, true);
  // Encode tiny non-zero dither so the buffer isn't fully zero — some iOS
  // builds skip "true silence" frames and won't establish the media session.
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, (i & 1) ? 1 : -1, true);
  }
  const blob = new Blob([buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

function ensureSilentLoop() {
  if (typeof window === "undefined") return;
  if (!silentLoopWanted) return;
  if (silentLoop) {
    if (silentLoop.paused) silentLoop.play().catch(() => {});
    return;
  }
  const a = new Audio();
  silentLoopUrl = silentWavObjectUrl();
  a.src = silentLoopUrl;
  a.loop = true;
  a.volume = 0.001;
  a.preload = "auto";
  a.setAttribute("playsinline", "");
  a.muted = false; // explicit
  silentLoop = a;
  a.play().catch(() => {
    // Will succeed on next gesture via wireAudioRecovery's listeners.
  });
}

function stopSilentLoop() {
  if (!silentLoop) return;
  try { silentLoop.pause(); } catch {}
  try { silentLoop.removeAttribute("src"); silentLoop.load(); } catch {}
  if (silentLoopUrl) {
    try { URL.revokeObjectURL(silentLoopUrl); } catch {}
    silentLoopUrl = null;
  }
  silentLoop = null;
}
// iOS Safari extends AudioContextState with "interrupted".
type ExtendedAudioState = AudioContextState | "interrupted";

function isUsable(c: AudioContext | null): c is AudioContext {
  if (!c) return false;
  const s = c.state as ExtendedAudioState;
  return s !== "closed";
}

function kickContext(c: AudioContext): Promise<void> {
  const s = c.state as ExtendedAudioState;
  if (s === "suspended" || s === "interrupted") {
    return c.resume().catch(() => {});
  }
  return Promise.resolve();
}

function createContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const c = new Ctor();
  c.onstatechange = () => {
    // If the context closed unexpectedly, drop our reference so the next
    // call to ctx() rebuilds it on the next user gesture.
    if (!audioCtx) return;
    const s = audioCtx.state as ExtendedAudioState;
    if (s === "closed") {
      audioCtx = null;
      activeSources.clear();
      activeNodes.clear();
      return;
    }
    if (s === "interrupted" || s === "suspended") {
      // Try a non-blocking resume. iOS often needs a user gesture for this
      // to actually succeed, but it's harmless to try.
      kickContext(audioCtx);
    }
  };
  return c;
}

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx || (audioCtx.state as ExtendedAudioState) === "closed") {
    audioCtx = createContext();
    if (!audioCtx) return null;
    wireAudioRecovery();
  }
  if (isUsable(audioCtx)) {
    const s = audioCtx.state as ExtendedAudioState;
    if (s === "suspended" || s === "interrupted") {
      audioCtx.resume().catch(() => {});
    }
  }
  return audioCtx;
}

/**
 * Synchronous, fire-and-forget audio teardown.
 *
 * On iOS Safari, page unload events (pagehide especially) may not give us
 * enough time for promises to resolve. We must:
 *   - stop every active AudioBufferSourceNode immediately
 *   - disconnect every aux node we created
 *   - stop & release the silent HTMLAudioElement (this is what was keeping
 *     the lock-screen / Control Center media indicator alive)
 *   - close() the AudioContext (NOT just suspend — close releases the
 *     audio session; suspend leaves it claimed)
 *
 * We intentionally do NOT await any returned promise. We drop the reference
 * synchronously so any subsequent access rebuilds a fresh context.
 */
function teardownAudioSync() {
  silentLoopWanted = false;
  try { cancelSpeech(); } catch {}
  try { stopSilentLoop(); } catch {}
  const c = audioCtx;
  audioCtx = null;
  if (c) {
    try {
      // close() implicitly stops everything. Fire and forget — don't await.
      const s = c.state as ExtendedAudioState;
      if (s !== "closed") c.close().catch(() => {});
    } catch {}
  }
}

/**
 * Public: end the audio session for the current call.
 *
 * Call this when the CallScreen unmounts or the user hits Hang Up so iOS
 * stops thinking media is playing. Re-armed on the next call via
 * beginAudioSession() / unlockAudio().
 */
export function endAudioSession() {
  teardownAudioSync();
}

/**
 * Public: mark that we want audio output (a call is starting). Idempotent.
 *
 * The silent loop will only be (re)armed once this has been set; teardown /
 * endAudioSession() clears it. This keeps the iOS media session limited to
 * the time a call is actually in progress.
 */
export function beginAudioSession() {
  silentLoopWanted = true;
  // ctx() lazily builds the AudioContext + wires recovery.
  const c = ctx();
  if (c) kickContext(c);
  ensureSilentLoop();
}

function wireUnloadCleanup() {
  if (typeof window === "undefined") return;
  // pagehide is the spec-compliant unload event and is the only one iOS
  // Safari fires reliably. beforeunload is kept as a belt-and-braces extra,
  // but we don't rely on it. Both must be synchronous.
  const onPageHide = (e: PageTransitionEvent) => {
    // If the page is going into bfcache (persisted=true), iOS may restore it.
    // Still tear down — pageshow(persisted=true) will rebuild via gesture.
    void e;
    teardownAudioSync();
  };
  const onVisibilityHidden = () => {
    if (document.visibilityState === "hidden") {
      // Aggressive: when the tab is hidden, close the audio session. On iOS
      // this is what actually releases the lock-screen media indicator. If
      // the user returns, a gesture / pageshow handler will rebuild.
      teardownAudioSync();
    }
  };
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("beforeunload", () => teardownAudioSync());
  document.addEventListener("visibilitychange", onVisibilityHidden);
}

function wireAudioRecovery() {
  if (recoveryWired || typeof window === "undefined") return;
  recoveryWired = true;
  wireUnloadCleanup();
  const tryResume = () => {
    // If the context closed (rare, but possible after bfcache), rebuild it.
    if (audioCtx && (audioCtx.state as ExtendedAudioState) === "closed") {
      audioCtx = null;
    }
    if (!audioCtx) {
      // Don't auto-recreate without a user gesture; ctx() will do it on demand.
      // But for pageshow / visibilitychange we can recreate eagerly because
      // these often follow a gesture closely on iOS.
      audioCtx = createContext();
    }
    if (audioCtx) kickContext(audioCtx);
    // Only re-arm the silent loop if a call is actively in progress. We
    // never want to keep an "iOS playing media" indicator alive when we
    // don't need audio output.
    if (silentLoopWanted) ensureSilentLoop();
    // iOS Safari sometimes "freezes" speechSynthesis after a background trip.
    // Pause/resume is a known kick that unsticks it.
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } catch {}
    }
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tryResume();
  });
  window.addEventListener("focus", tryResume);
  window.addEventListener("pageshow", (e) => {
    // bfcache restore: context may be in a weird/closed state.
    const persisted = (e as PageTransitionEvent).persisted;
    if (persisted) {
      // We tore down on pagehide; drop any stale reference so a real user
      // gesture will rebuild cleanly. Don't auto-arm the silent loop here.
      audioCtx = null;
    }
    tryResume();
  });
  // Aggressive unlock: every user gesture tries to resume a stuck context.
  // Capture phase so we run before app handlers stop propagation.
  const onUserGesture = () => {
    if (audioCtx && (audioCtx.state as ExtendedAudioState) === "closed") {
      audioCtx = null;
    }
    if (!audioCtx) {
      audioCtx = createContext();
    }
    if (audioCtx) kickContext(audioCtx);
    if (silentLoopWanted) ensureSilentLoop();
  };
  window.addEventListener("touchstart", onUserGesture, { passive: true, capture: true });
  window.addEventListener("touchend", onUserGesture, { passive: true, capture: true });
  window.addEventListener("pointerdown", onUserGesture, { capture: true });
  window.addEventListener("click", onUserGesture, { capture: true });
}

const audioCache = new Map<string, AudioBuffer>();

async function fetchTts(text: string, voiceId: string, stability: number, style: number, similarity: number): Promise<AudioBuffer | null> {
  const c = ctx();
  if (!c) return null;
  const key = `${voiceId}::${stability}::${style}::${similarity}::${text}`;
  const hit = audioCache.get(key);
  if (hit) return hit;
  try {
    const r = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId, stability, style, similarity }),
    });
    if (!r.ok) return null;
    const arr = await r.arrayBuffer();
    // decodeAudioData is bound to this context; if the context later gets
    // recreated, callers will re-decode from the original ArrayBuffer is not
    // available, so we just rely on the cache being valid as long as the
    // context isn't closed (we never call close()).
    const decoded = await c.decodeAudioData(arr.slice(0));
    audioCache.set(key, decoded);
    return decoded;
  } catch {
    return null;
  }
}

function playBuffer(
  buf: AudioBuffer,
  rate = 1,
  phoneFx = true,
  signal?: AbortSignal,
): Promise<boolean> {
  const c = ctx();
  if (!c) return Promise.resolve(false);
  if (signal?.aborted) return Promise.resolve(false);
  // If still suspended/interrupted, try one more resume before we commit.
  const startState = c.state as ExtendedAudioState;
  const ensureRunning = startState === "running" ? Promise.resolve() : kickContext(c);
  return ensureRunning.then(() => {
    if (!isUsable(audioCtx)) return false;
    if (signal?.aborted) return false;
    const live = audioCtx;
    if ((live.state as ExtendedAudioState) !== "running") {
      // Could not unlock — caller should fall back.
      return false;
    }
    try {
      const src = live.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate;
      let node: AudioNode = src;
      const aux: AudioNode[] = [];
      if (phoneFx) {
        const hp = live.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 350;
        const lp = live.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 3300;
        const peak = live.createBiquadFilter();
        peak.type = "peaking";
        peak.frequency.value = 1800;
        peak.Q.value = 1.2;
        peak.gain.value = 6;
        src.connect(hp);
        hp.connect(lp);
        lp.connect(peak);
        node = peak;
        aux.push(hp, lp, peak);
      }
      const gain = live.createGain();
      gain.gain.value = 0.95;
      node.connect(gain);
      gain.connect(live.destination);
      aux.push(gain);
      for (const n of aux) activeNodes.add(n);
      activeSources.add(src);
      src.start();
      const cleanup = () => {
        try { src.disconnect(); } catch {}
        for (const n of aux) {
          try { n.disconnect(); } catch {}
          activeNodes.delete(n);
        }
        activeSources.delete(src);
        if (signal) signal.removeEventListener("abort", onAbort);
      };
      const onAbort = () => {
        try { src.stop(0); } catch {}
        cleanup();
      };
      if (signal) {
        if (signal.aborted) onAbort();
        else signal.addEventListener("abort", onAbort, { once: true });
      }
      return new Promise<boolean>((resolve) => {
        src.onended = () => {
          cleanup();
          resolve(true);
        };
      });
    } catch {
      return false;
    }
  });
}

export async function speakAsBoy(
  boyId: number,
  text: string,
  phoneFx = true,
  signal?: AbortSignal,
): Promise<void> {
  const boy = BOYS[boyId];
  if (!boy) return speakWeb(text, { signal });
  const v = voiceForBoy(boy);
  const buf = await fetchTts(text, v.voiceId, v.stability, v.style, v.similarity);
  if (signal?.aborted) return;
  if (!buf) {
    return speakWeb(text, { pitch: 0.85 + (boyId % 7) * 0.05, rate: v.rate, signal });
  }
  const played = await playBuffer(buf, v.pitchPlayback * (v.rate ?? 1), phoneFx, signal);
  if (!played && !signal?.aborted) {
    // Buffer decode succeeded but playback didn't (likely context interrupted
    // or could not resume). Fall back to Web Speech rather than going silent.
    return speakWeb(text, { pitch: 0.85 + (boyId % 7) * 0.05, rate: v.rate, signal });
  }
}

export async function speakNarrator(
  text: string,
  opts?: { rate?: number; signal?: AbortSignal },
): Promise<void> {
  return speakWeb(text, { pitch: 1, rate: opts?.rate ?? 1, signal: opts?.signal });
}

export async function preloadBoy(boyId: number, lines: string[]): Promise<void> {
  const boy = BOYS[boyId];
  if (!boy) return;
  const v = voiceForBoy(boy);
  await Promise.all(lines.map((t) => fetchTts(t, v.voiceId, v.stability, v.style, v.similarity)));
}

export function playDtmf(digit: string, duration = 0.13) {
  const c = ctx();
  if (!c || (c.state as ExtendedAudioState) !== "running") return;
  const pairs: Record<string, [number, number]> = {
    "1": [697, 1209], "2": [697, 1336], "3": [697, 1477],
    "4": [770, 1209], "5": [770, 1336], "6": [770, 1477],
    "7": [852, 1209], "8": [852, 1336], "9": [852, 1477],
    "*": [941, 1209], "0": [941, 1336], "#": [941, 1477],
  };
  const pair = pairs[digit];
  if (!pair) return;
  try {
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, c.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    gain.connect(c.destination);
    for (const f of pair) {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(gain);
      o.start();
      o.stop(c.currentTime + duration);
    }
  } catch {}
}

export function playRing() {
  const c = ctx();
  if (!c || (c.state as ExtendedAudioState) !== "running") return;
  try {
    const start = c.currentTime;
    const gain = c.createGain();
    gain.connect(c.destination);
    const ringPattern = [0, 0.35];
    for (const t0 of ringPattern) {
      gain.gain.setValueAtTime(0.0001, start + t0);
      gain.gain.exponentialRampToValueAtTime(0.18, start + t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + t0 + 0.32);
    }
    const oA = c.createOscillator();
    oA.type = "sine";
    oA.frequency.value = 480;
    const oB = c.createOscillator();
    oB.type = "sine";
    oB.frequency.value = 440;
    oA.connect(gain);
    oB.connect(gain);
    oA.start(start);
    oB.start(start);
    oA.stop(start + 0.8);
    oB.stop(start + 0.8);
  } catch {}
}

export function playClick() {
  const c = ctx();
  if (!c || (c.state as ExtendedAudioState) !== "running") return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "square";
    o.frequency.value = 1200;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, c.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.05);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.06);
  } catch {}
}

export function playWin() {
  const c = ctx();
  if (!c || (c.state as ExtendedAudioState) !== "running") return;
  try {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    let t = c.currentTime;
    for (const f of notes) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g);
      g.connect(c.destination);
      o.start(t);
      o.stop(t + 0.25);
      t += 0.18;
    }
  } catch {}
}

export function unlockAudio() {
  // Called from a user gesture (Setup / Handoff buttons). Build the context
  // if needed and force a resume. On iOS this is the only reliable moment
  // to transition from "suspended"/"interrupted" -> "running".
  //
  // NOTE: this no longer auto-starts the silent loop. The loop is what makes
  // iOS think a tab is "playing media" (which lingers on the lock screen
  // after close), so we only want it running during an actual call. Use
  // beginAudioSession() to arm it; endAudioSession() to release it.
  const c = ctx();
  if (!c) return;
  // Fire and forget — resume must be called synchronously within the gesture
  // for iOS to honor it. We don't await.
  kickContext(c);
  // Also play a near-silent buffer to fully arm the audio graph on iOS.
  try {
    const buf = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
  } catch {}
  // If we're already mid-session (e.g. a call is in progress and the user
  // gesture is a hang-up), keep the loop alive. Otherwise stay silent.
  if (silentLoopWanted) ensureSilentLoop();
}

export { speakWeb as speak };
