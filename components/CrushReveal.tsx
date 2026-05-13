"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { BOYS, displayImage, displayName } from "@/lib/game/cards";
import { playClick } from "@/lib/audio/speech";
import type { GameState } from "@/lib/game/types";
import { PlayerCard } from "./PlayerCard";

type Props = {
  state: GameState;
};

type Stage = "drumroll" | "spinning" | "revealed";

export function CrushReveal({ state }: Props) {
  const winner = state.players.find((p) => p.id === state.winner) ?? state.players[state.currentPlayerIdx];
  const crush = state.board[state.crushId];

  const [stage, setStage] = useState<Stage>("drumroll");
  const [shownIdx, setShownIdx] = useState(0);

  useEffect(() => {
    // Stage 1: drumroll for 1.2s, then start spinning
    const t1 = setTimeout(() => setStage("spinning"), 1200);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (stage !== "spinning") return;
    let cancelled = false;
    const sequence = async () => {
      // Spin through random boys, getting slower and slower, then land on the crush.
      const totalTicks = 18;
      for (let i = 0; i < totalTicks; i++) {
        if (cancelled) return;
        const pickFromAll = Math.floor(Math.random() * BOYS.length);
        setShownIdx(pickFromAll);
        try { playClick(); } catch {}
        const delay = 60 + Math.floor(Math.pow(i / totalTicks, 2.2) * 320);
        await new Promise((r) => setTimeout(r, delay));
      }
      if (cancelled) return;
      setShownIdx(crush.id);
      await new Promise((r) => setTimeout(r, 350));
      if (cancelled) return;
      setStage("revealed");
    };
    sequence();
    return () => {
      cancelled = true;
    };
  }, [stage, crush.id]);

  return (
    <div className="w-full flex flex-col items-center gap-5">
      {stage === "drumroll" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.06, 1], rotate: [-1, 1, -1] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            className="dp-title-stroke text-3xl sm:text-5xl"
          >
            And the crush is…
          </motion.div>
          <div className="mt-2 text-base sm:text-lg opacity-80 italic">
            🥁 drum roll, please…
          </div>
        </motion.div>
      )}

      {stage === "spinning" && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-dp-yellow"
          >
            …Spinning the deck…
          </motion.div>
          <SpinningCard boyId={shownIdx} mode={state.mode} />
        </>
      )}

      {stage === "revealed" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex flex-col items-center gap-4"
        >
          <motion.h1
            className="dp-title-stroke text-3xl sm:text-5xl text-center px-3"
            initial={{ scale: 0.4, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 12 }}
          >
            Your secret crush is {displayName(crush, state.mode)}!
          </motion.h1>

          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
            <motion.div
              initial={{ x: -40, opacity: 0, rotate: -6 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 220 }}
            >
              <PlayerCard player={winner} size="md" />
            </motion.div>

            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: [0, 1.4, 1], rotate: [-90, 8, 0] }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl sm:text-7xl drop-shadow-[3px_3px_0_rgba(0,0,0,0.4)]"
              aria-hidden
            >
              💘
            </motion.div>

            <motion.div
              initial={{ x: 40, opacity: 0, rotate: 6 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 220 }}
              className="relative w-44 sm:w-56 aspect-[3/4] bg-white rounded-md border-4 border-dp-ink overflow-hidden"
              style={{ boxShadow: "8px 8px 0 var(--dp-pink-hot)" }}
            >
              <Image
                src={displayImage(crush, state.mode)}
                alt={displayName(crush, state.mode)}
                fill
                priority
                sizes="220px"
                className="object-contain"
              />
            </motion.div>
          </div>

          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-sm sm:text-base opacity-90 text-center px-3"
          >
            <strong>{winner.name}</strong> guessed it — {displayName(crush, state.mode)} at{" "}
            <span className="font-mono">{crush.phone}</span>. Hangs out at{" "}
            <strong>{crush.hangout}</strong>, into{" "}
            {[crush.sport, crush.food].filter(Boolean).join(" + ") || "the good life"}, wears{" "}
            <strong>{crush.clothing}</strong>.
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}

function SpinningCard({ boyId, mode }: { boyId: number; mode: "boys" | "animals" }) {
  const boy = BOYS[boyId];
  return (
    <motion.div
      key={boyId}
      initial={{ y: 14, rotate: -4, opacity: 0.6, scale: 0.9 }}
      animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 480, damping: 28 }}
      className="relative w-44 sm:w-56 aspect-[3/4] bg-white rounded-md border-4 border-dp-ink overflow-hidden"
      style={{ boxShadow: "8px 8px 0 var(--dp-pink-hot)" }}
    >
      <Image
        src={displayImage(boy, mode)}
        alt=""
        fill
        sizes="220px"
        className="object-contain"
        priority
      />
    </motion.div>
  );
}
