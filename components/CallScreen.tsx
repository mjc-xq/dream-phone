"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameState, LogEntry } from "@/lib/game/types";
import { cancelSpeech, playRing, speakAsBoy, speakNarrator } from "@/lib/audio/speech";
import { BoyPortrait } from "./BoyPortrait";

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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      for (let r = 0; r < 3; r++) {
        if (cancelled) return;
        playRing();
        await wait(700);
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
          await wait(900);
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 230, damping: 22 }}
        className="bg-dp-paper text-dp-ink rounded-3xl border-4 border-dp-ink shadow-[10px_10px_0_var(--dp-pink-hot)] max-w-2xl w-full p-5 sm:p-6 max-h-[92dvh] overflow-y-auto dp-scroll"
      >
        <AnimatePresence mode="wait">
          {phase === "ringing" && (
            <motion.div
              key="ringing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-6"
            >
              <motion.div
                animate={{ rotate: [-8, 8, -6, 6, -4, 4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                className="text-7xl inline-block"
              >
                📞
              </motion.div>
              <div className="text-3xl font-black uppercase tracking-widest mt-4">Ring… Ring… Ring…</div>
              <p className="opacity-70 mt-2">
                {featuredBoy ? `Calling ${featuredBoy.name} at ${featuredBoy.phone}…` : "Calling now…"}
              </p>
            </motion.div>
          )}
          {phase !== "ringing" && (
            <motion.div
              key="talking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                {featuredBoy && (
                  <motion.div
                    animate={speakingId ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={speakingId ? { duration: 0.5, repeat: Infinity } : {}}
                  >
                    <BoyPortrait boyId={featuredBoy.id} size={64} rounded="rounded-full" />
                  </motion.div>
                )}
                <div className="flex-1">
                  <div className="dp-chip dp-chip-pink">Live Call</div>
                  {featuredBoy && (
                    <div className="mt-1 text-sm">
                      <span className="font-black">{featuredBoy.name}</span> ·{" "}
                      <span className="opacity-70">{featuredBoy.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              {visibleIds.map((id) => {
                const e = logsById.get(id);
                if (!e) return null;
                return <CallLine key={id} entry={e} speaking={speakingId === id} />;
              })}
              {phase === "done" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-2 flex justify-end"
                >
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    className="dp-btn dp-btn-pink"
                    onClick={onDone}
                  >
                    Hang Up
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function CallLine({ entry, speaking }: { entry: LogEntry; speaking: boolean }) {
  const base = "px-3 py-2 rounded-2xl border-2 border-dp-ink";
  const className =
    entry.tone === "boy"
      ? `text-lg italic bg-dp-cyan/30 ${base}`
      : entry.tone === "loud"
      ? `text-xl font-black uppercase bg-dp-yellow ${base}`
      : entry.tone === "quiet"
      ? `text-base bg-dp-pink-hot text-white ${base}`
      : "text-sm opacity-80";

  return (
    <motion.p
      initial={{ opacity: 0, x: -16, scale: 0.95 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: speaking ? [1, 1.02, 1] : 1,
      }}
      transition={{ type: "spring", stiffness: 240, damping: 22, scale: speaking ? { duration: 0.5, repeat: Infinity } : {} }}
      className={className}
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
