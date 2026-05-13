"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { GameState, LogEntry, Player } from "@/lib/game/types";
import { cancelSpeech, playRing, speakAsBoy, speakNarrator } from "@/lib/audio/speech";
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

    async function run() {
      // Two rings — snappier than 3 (~1.4s total)
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
            await speakAsBoy(e.boyId, e.text, true);
          } else {
            await speakNarrator(e.text);
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
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canHangUp = phase === "done";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-dp-ink flex flex-col"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        backgroundImage:
          "radial-gradient(circle at 30% 20%, rgba(255,45,138,0.25), transparent 60%), radial-gradient(circle at 75% 85%, rgba(0,212,208,0.22), transparent 60%)",
      }}
    >
      {/* Top status bar */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <motion.div
          animate={phase === "ringing" ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
          transition={phase === "ringing" ? { repeat: Infinity, duration: 0.8 } : {}}
          className="dp-chip dp-chip-pink"
        >
          {phase === "ringing" ? "📞 Ringing…" : phase === "done" ? "✓ Call ended" : "🟢 Live"}
        </motion.div>
        <button
          type="button"
          onClick={onDone}
          disabled={!canHangUp}
          className={`dp-btn ${canHangUp ? "dp-btn-pink" : "dp-btn-purple"} text-sm py-1.5 px-3 ${canHangUp ? "" : "opacity-50"}`}
        >
          ☎ Hang Up
        </button>
      </div>

      {/* CARDS — the hero */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-3 pb-2 relative">
        <div className="w-full max-w-3xl grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
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
              <PlayerCard player={player} size="md" />
            </motion.div>
          </motion.div>

          {/* CONNECTOR */}
          <div className="flex flex-col items-center gap-1 px-1">
            <motion.div
              animate={phase === "ringing" ? { rotate: [-15, 15, -15], scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={phase === "ringing" ? { repeat: Infinity, duration: 0.5 } : {}}
              className="text-4xl sm:text-6xl drop-shadow-[3px_3px_0_rgba(255,255,255,0.15)]"
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
                className="relative w-40 sm:w-52 aspect-[3/4] bg-white rounded-md border-4 border-dp-ink overflow-hidden"
                style={{ boxShadow: "8px 8px 0 var(--dp-pink-hot)" }}
              >
                <Image
                  src={imageForBoy(featuredBoy)}
                  alt={featuredBoy.name}
                  fill
                  sizes="220px"
                  className="object-contain"
                />
                {/* speaking aura */}
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
              <div className="w-40 sm:w-52 aspect-[3/4] bg-dp-paper rounded-md border-4 border-dp-ink" />
            )}
          </motion.div>
        </div>
      </div>

      {/* SPEECH AREA */}
      <div className="px-3 sm:px-4 pb-3">
        <div className="max-w-3xl mx-auto bg-dp-paper/95 text-dp-ink rounded-2xl border-4 border-dp-ink p-3 sm:p-4 min-h-[110px]">
          {phase === "ringing" ? (
            <p className="text-center text-dp-magenta font-black uppercase tracking-widest text-sm">
              Ringing {featuredBoy?.phone ?? "…"}
            </p>
          ) : (
            <div className="space-y-2 max-h-[28dvh] overflow-y-auto dp-scroll">
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
        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto flex justify-center mt-3"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="dp-btn dp-btn-pink text-lg px-8"
              onClick={onDone}
            >
              ☎ Hang Up & Pass Phone
            </motion.button>
          </motion.div>
        )}
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
