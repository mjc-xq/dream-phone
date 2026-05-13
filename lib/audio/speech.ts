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

async function speakWeb(text: string, opts: { pitch?: number; rate?: number; volume?: number } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const voices = await ensureVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.pitch = opts.pitch ?? 1;
  u.rate = opts.rate ?? 1;
  u.volume = opts.volume ?? 1;
  const v = pickFallbackVoice(voices);
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
  return new Promise<void>((resolve) => {
    u.onend = () => resolve();
    u.onerror = () => resolve();
  });
}

export function cancelSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  for (const s of activeSources) {
    try { s.stop(); } catch {}
  }
  activeSources.clear();
}

let audioCtx: AudioContext | null = null;
const activeSources: Set<AudioBufferSourceNode> = new Set();

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
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
    const decoded = await c.decodeAudioData(arr.slice(0));
    audioCache.set(key, decoded);
    return decoded;
  } catch {
    return null;
  }
}

function playBuffer(buf: AudioBuffer, rate = 1, phoneFx = true): Promise<void> {
  const c = ctx();
  if (!c) return Promise.resolve();
  const src = c.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  let node: AudioNode = src;
  if (phoneFx) {
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 350;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3300;
    const peak = c.createBiquadFilter();
    peak.type = "peaking";
    peak.frequency.value = 1800;
    peak.Q.value = 1.2;
    peak.gain.value = 6;
    src.connect(hp);
    hp.connect(lp);
    lp.connect(peak);
    node = peak;
  }
  const gain = c.createGain();
  gain.gain.value = 0.95;
  node.connect(gain);
  gain.connect(c.destination);
  activeSources.add(src);
  src.start();
  return new Promise<void>((resolve) => {
    src.onended = () => {
      activeSources.delete(src);
      resolve();
    };
  });
}

export async function speakAsBoy(boyId: number, text: string, phoneFx = true): Promise<void> {
  const boy = BOYS[boyId];
  if (!boy) return speakWeb(text);
  const v = voiceForBoy(boy);
  const buf = await fetchTts(text, v.voiceId, v.stability, v.style, v.similarity);
  if (!buf) {
    return speakWeb(text, { pitch: 0.85 + (boyId % 7) * 0.05, rate: v.rate });
  }
  return playBuffer(buf, v.pitchPlayback * (v.rate ?? 1), phoneFx);
}

export async function speakNarrator(text: string, opts?: { rate?: number }): Promise<void> {
  return speakWeb(text, { pitch: 1, rate: opts?.rate ?? 1 });
}

export async function preloadBoy(boyId: number, lines: string[]): Promise<void> {
  const boy = BOYS[boyId];
  if (!boy) return;
  const v = voiceForBoy(boy);
  await Promise.all(lines.map((t) => fetchTts(t, v.voiceId, v.stability, v.style, v.similarity)));
}

export function playDtmf(digit: string, duration = 0.13) {
  const c = ctx();
  if (!c) return;
  const pairs: Record<string, [number, number]> = {
    "1": [697, 1209], "2": [697, 1336], "3": [697, 1477],
    "4": [770, 1209], "5": [770, 1336], "6": [770, 1477],
    "7": [852, 1209], "8": [852, 1336], "9": [852, 1477],
    "*": [941, 1209], "0": [941, 1336], "#": [941, 1477],
  };
  const pair = pairs[digit];
  if (!pair) return;
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
}

export function playRing() {
  const c = ctx();
  if (!c) return;
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
}

export function playClick() {
  const c = ctx();
  if (!c) return;
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
}

export function playWin() {
  const c = ctx();
  if (!c) return;
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
}

export function unlockAudio() {
  ctx();
}

export { speakWeb as speak };
