"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameState, LogEntry, Player } from "@/lib/game/types";
import { cancelSpeech, playRing, speakAsBoy, speakNarrator } from "@/lib/audio/speech";
import { BoyPortrait } from "./BoyPortrait";
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

  const playerSpeaking = phase === "talking" && speakingId === null ? false : speakingId !== null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-stretch sm:items-center sm:justify-center sm:p-4 overflow-y-auto dp-scroll"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 230, damping: 22 }}
        className="bg-dp-paper text-dp-ink sm:rounded-3xl sm:border-4 sm:border-dp-ink sm:shadow-[10px_10px_0_var(--dp-pink-hot)] sm:max-w-3xl w-full p-4 sm:p-6 sm:max-h-[92dvh] overflow-y-auto dp-scroll flex flex-col"
      >
        {/* Card-vs-card hero — the big highlight */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 mb-4">
          <motion.div
            animate={
              phase === "ringing"
                ? { y: [-2, 2, -2], rotate: [-1, 1, -1] }
                : speakingId === null
                ? { scale: [1, 1.05, 1] }
                : { scale: 1 }
            }
            transition={
              phase === "ringing"
                ? { repeat: Infinity, duration: 0.6 }
                : speakingId === null
                ? { repeat: Infinity, duration: 1.1 }
                : {}
            }
            className="flex justify-end"
          >
            <PlayerCard player={player} size="sm" />
          </motion.div>

          <motion.div
            animate={{ x: [-4, 4, -4] }}
            transition={{ repeat: phase === "ringing" ? Infinity : 0, duration: 0.5 }}
            className="text-3xl sm:text-5xl"
          >
            {phase === "ringing" ? "📞" : phase === "done" ? "✨" : "💬"}
          </motion.div>

          <motion.div
            animate={
              phase === "talking" && playerSpeaking
                ? { scale: [1, 1.04, 1] }
                : phase === "ringing"
                ? { rotate: [-2, 2, -2] }
                : { scale: 1 }
            }
            transition={
              phase === "talking" && playerSpeaking
                ? { repeat: Infinity, duration: 0.7 }
                : phase === "ringing"
                ? { repeat: Infinity, duration: 0.6 }
                : {}
            }
            className="flex justify-start"
          >
            {featuredBoy ? (
              <BoyCardStill boyId={featuredBoy.id} name={featuredBoy.name} />
            ) : (
              <div className="w-36 aspect-[3/4] rounded-md border-4 border-dp-ink bg-dp-paper" />
            )}
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {phase === "ringing" && (
            <motion.div
              key="ringing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-center py-2"
            >
              <div className="text-2xl sm:text-3xl font-black uppercase tracking-widest">Ring… Ring… Ring…</div>
              <p className="opacity-70 mt-2 text-sm">
                {featuredBoy ? `${player.name} is calling ${featuredBoy.name} at ${featuredBoy.phone}…` : "Calling now…"}
              </p>
            </motion.div>
          )}

          {phase !== "ringing" && (
            <motion.div
              key="talking"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="dp-chip dp-chip-pink mx-auto block w-fit">Live Call</div>
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

function BoyCardStill({ boyId, name }: { boyId: number; name: string }) {
  return (
    <div className="w-36 sm:w-44 rounded-md border-4 border-dp-ink overflow-hidden bg-white" style={{ boxShadow: "6px 6px 0 var(--dp-pink-hot)" }}>
      <div className="relative w-full aspect-[3/4]">
        <BoyPortrait boyId={boyId} size={300} className="!w-full !h-full !border-0" rounded="" />
        <span className="sr-only">{name}</span>
      </div>
    </div>
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
