"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { GameState, LogEntry, Player } from "@/lib/game/types";
import {
  beginAudioSession,
  cancelSpeech,
  endAudioSession,
  playRing,
  speakAsBoy,
  speakNarrator,
} from "@/lib/audio/speech";
import { imageForBoy } from "@/lib/game/cards";
import { PlayerCard } from "./PlayerCard";

type Props = {
  state: GameState;
  callLogIds: string[];
  onDone: () => void;
};

export function CallScreen({ state, callLogIds, onDone }: Props) {
  const [phase, setPhase] = useState<"ringing" | "talking" | "done">("ringing");
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const logsById = new Map(state.log.map((e) => [e.id, e]));
  const entries = callLogIds.map((id) => logsById.get(id)).filter(Boolean) as LogEntry[];
  const featuredBoyId = entries.find((e) => e.boyId !== undefined)?.boyId;
  const featuredBoy = featuredBoyId !== undefined ? state.board[featuredBoyId] : null;
  const player: Player = state.players[state.currentPlayerIdx];

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    // Arm the iOS silent-switch bypass for the duration of this call. The
    // unmount cleanup tears it down so the lock-screen media indicator
    // doesn't linger after the call ends or the tab closes.
    beginAudioSession();

    async function run() {
      for (let r = 0; r < 2; r++) {
        if (cancelled) return;
        playRing();
        await wait(620);
      }
      if (cancelled) return;
      setPhase("talking");

      for (const e of entries) {
        if (cancelled) return;
        setVisibleIds((cur) => (cur.includes(e.id) ? cur : [...cur, e.id]));
        if (e.speak) {
          setSpeakingId(e.id);
          if (e.boyId !== undefined) {
            await speakAsBoy(e.boyId, e.text, true, ac.signal);
          } else {
            await speakNarrator(e.text, { signal: ac.signal });
          }
          setSpeakingId(null);
        } else {
          await wait(700);
        }
      }
      if (cancelled) return;
      setPhase("done");
    }
    run();
    return () => {
      cancelled = true;
      ac.abort();
      cancelSpeech();
      // Release the iOS media session as soon as the call screen unmounts so
      // closing the tab doesn't leave a stale "playing" indicator behind.
      endAudioSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canHangUp = phase === "done";
  // Players in the dark / half-distracted shouldn't be stuck waiting for TTS.
  // Hang-up is always allowed; while ringing/talking it cancels speech early.

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-dp-ink flex flex-col"
      style={{
        backgroundImage: [
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 280'><g fill='none' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><path d='M30 60 Q45 40 60 60 T90 60' stroke='%23ffd400' opacity='0.45'/><path d='M210 90 Q225 70 240 90 T270 90' stroke='%2300d4d0' opacity='0.45'/><circle cx='80' cy='150' r='5' fill='%23ff2d8a' opacity='0.5'/><polygon points='180,40 195,65 165,65' fill='%2300d4d0' opacity='0.45'/><rect x='40' y='220' width='12' height='12' transform='rotate(45 46 226)' fill='%23ff8a00' opacity='0.5'/><path d='M220 230 L235 220 L240 235 L225 240 Z' fill='none' stroke='%238a2be2' opacity='0.5'/><circle cx='200' cy='200' r='4' fill='%235cffb7' opacity='0.5'/></g></svg>\") 0 0 / 280px 280px",
          "radial-gradient(circle at 30% 20%, rgba(255,45,138,0.30), transparent 55%)",
          "radial-gradient(circle at 75% 85%, rgba(0,212,208,0.30), transparent 55%)",
          "radial-gradient(circle at 90% 10%, rgba(255,212,0,0.18), transparent 50%)",
        ].join(", "),
      }}
    >
      {/* Top: status + hang up. Respects safe-area top. */}
      <div
        className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
      >
        <motion.div
          animate={phase === "ringing" ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
          transition={phase === "ringing" ? { repeat: Infinity, duration: 0.8 } : {}}
          className="dp-chip dp-chip-pink"
        >
          {phase === "ringing" ? "📞 Ringing…" : phase === "done" ? "✓ Call ended" : "🟢 Live"}
        </motion.div>
        <button
          type="button"
          onClick={() => {
            cancelSpeech();
            onDone();
          }}
          className={`dp-btn ${canHangUp ? "dp-btn-pink" : "dp-btn-purple"} text-sm py-1.5 px-3`}
        >
          {canHangUp ? "☎ Hang Up" : "Skip"}
        </button>
      </div>

      {/* CARDS — pinned near the top */}
      <div className="px-3 sm:px-4 pb-2 shrink-0">
        <div className="max-w-3xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          {/* PLAYER side */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="text-[10px] uppercase font-black tracking-widest text-dp-cream/70 mb-1">
              {player.name}
            </div>
            <motion.div
              animate={phase === "ringing" ? { rotate: [-2, 2, -2] } : { rotate: 0 }}
              transition={phase === "ringing" ? { repeat: Infinity, duration: 0.6 } : {}}
            >
              <PlayerCard player={player} size="sm" />
            </motion.div>
          </motion.div>

          {/* CONNECTOR */}
          <div className="flex flex-col items-center gap-1 px-1">
            <motion.div
              animate={phase === "ringing" ? { rotate: [-15, 15, -15], scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={phase === "ringing" ? { repeat: Infinity, duration: 0.5 } : {}}
              className="text-3xl sm:text-5xl drop-shadow-[3px_3px_0_rgba(255,255,255,0.15)]"
            >
              📞
            </motion.div>
            <Wave active={phase === "talking" && speakingId !== null} />
          </div>

          {/* BOY side */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="text-[10px] uppercase font-black tracking-widest text-dp-cream/70 mb-1">
              {featuredBoy?.name ?? "—"}
            </div>
            {featuredBoy ? (
              <motion.div
                animate={
                  phase === "ringing"
                    ? { rotate: [3, -3, 3] }
                    : speakingId
                    ? { scale: [1, 1.03, 1] }
                    : { scale: 1 }
                }
                transition={
                  phase === "ringing"
                    ? { repeat: Infinity, duration: 0.6 }
                    : speakingId
                    ? { repeat: Infinity, duration: 0.55 }
                    : {}
                }
                className="relative w-32 sm:w-44 aspect-[3/4] bg-white rounded-md border-4 border-dp-ink overflow-hidden"
                style={{ boxShadow: "6px 6px 0 var(--dp-pink-hot)" }}
              >
                <Image
                  src={imageForBoy(featuredBoy)}
                  alt={featuredBoy.name}
                  fill
                  sizes="180px"
                  className="object-contain"
                />
                {speakingId && (
                  <motion.div
                    aria-hidden
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1.15, opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="absolute inset-0 rounded-md border-4 border-dp-yellow pointer-events-none"
                  />
                )}
              </motion.div>
            ) : (
              <div className="w-32 sm:w-44 aspect-[3/4] bg-dp-paper rounded-md border-4 border-dp-ink" />
            )}
          </motion.div>
        </div>
      </div>

      {/* MIDDLE: text bubbles fill the remaining space */}
      <div className="flex-1 min-h-0 px-3 sm:px-4 pb-3 overflow-y-auto dp-scroll">
        <div className="max-w-3xl mx-auto">
          {phase === "ringing" ? (
            <div className="bg-dp-paper/95 text-dp-ink rounded-2xl border-4 border-dp-ink p-4 text-center">
              <p className="text-dp-magenta font-black uppercase tracking-widest text-sm">
                Ringing {featuredBoy?.phone ?? "…"}
              </p>
            </div>
          ) : (
            <div className="bg-dp-paper/95 text-dp-ink rounded-2xl border-4 border-dp-ink p-3 sm:p-4 space-y-2">
              <AnimatePresence initial={false}>
                {visibleIds.map((id) => {
                  const e = logsById.get(id);
                  if (!e) return null;
                  return <SpeechLine key={id} entry={e} speaking={speakingId === id} />;
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER: hang-up CTA pinned to the bottom (safe-area) */}
      <div
        className="px-3 sm:px-4 pt-2 pb-3 shrink-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => {
            if (!canHangUp) cancelSpeech();
            onDone();
          }}
          className={`w-full max-w-3xl mx-auto block dp-btn ${
            canHangUp ? "dp-btn-pink" : "dp-btn-teal"
          } text-lg py-4`}
        >
          {canHangUp
            ? "☎ Hang Up & Take Notes"
            : phase === "ringing"
            ? "📞 Ringing… (tap to skip)"
            : "🟢 Listening… (tap to skip)"}
        </motion.button>
      </div>
    </motion.div>
  );
}

function Wave({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="w-0.5 bg-dp-yellow rounded"
          animate={active ? { height: ["20%", "100%", "30%"] } : { height: "20%" }}
          transition={active ? { repeat: Infinity, duration: 0.6 + i * 0.05, delay: i * 0.05 } : {}}
        />
      ))}
    </div>
  );
}

function SpeechLine({ entry, speaking }: { entry: LogEntry; speaking: boolean }) {
  const base = "px-3 py-2 rounded-2xl border-2 border-dp-ink";
  const cls =
    entry.tone === "boy"
      ? `text-base sm:text-lg italic bg-dp-cyan/40 ${base}`
      : entry.tone === "loud"
      ? `text-lg sm:text-xl font-black uppercase bg-dp-yellow ${base}`
      : entry.tone === "quiet"
      ? `text-sm sm:text-base bg-dp-pink-hot text-white ${base}`
      : "text-xs opacity-80";

  return (
    <motion.p
      initial={{ opacity: 0, x: -10, scale: 0.96 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: speaking ? [1, 1.02, 1] : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 240,
        damping: 22,
        scale: speaking ? { duration: 0.5, repeat: Infinity } : {},
      }}
      className={cls}
    >
      {entry.tone === "boy" && "🗣️ "}
      {entry.tone === "loud" && "📣 "}
      {entry.tone === "quiet" && (
        <>
          🤫 <em>(Whispered to you:)</em>{" "}
        </>
      )}
      {entry.text}
    </motion.p>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
