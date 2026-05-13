"use client";

import { motion } from "framer-motion";
import type { Player } from "@/lib/game/types";
import { PlayerCard } from "./PlayerCard";

type Props = {
  playerName: string;
  player?: Player;
  onReady: () => void;
};

export function Handoff({ playerName, player, onReady }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-dp-ink flex items-center justify-center p-6"
    >
      <div className="dp-confetti relative max-w-xl w-full text-center">
        <motion.div
          className="dp-chip dp-chip-pink mb-3 mx-auto"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          📞 Pass the Phone
        </motion.div>
        <motion.h1
          className="dp-title-stroke text-5xl sm:text-7xl leading-none mb-3"
          initial={{ scale: 0.4, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 14, delay: 0.15 }}
        >
          {playerName}
        </motion.h1>

        {player?.card && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex justify-center mb-4"
          >
            <PlayerCard player={player} size="md" />
          </motion.div>
        )}

        <motion.p
          className="text-lg sm:text-xl opacity-90 mb-6"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 0.9 }}
          transition={{ delay: 0.5 }}
        >
          Hide the screen from everyone else. When you tap below, you&apos;ll draw a card.
        </motion.p>
        <motion.button
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65, type: "spring", stiffness: 220 }}
          whileHover={{ scale: 1.06, rotate: -1.5 }}
          whileTap={{ scale: 0.94 }}
          type="button"
          className="dp-btn dp-btn-pink text-xl"
          onClick={onReady}
        >
          📞 I&apos;m Ready — Draw
        </motion.button>
      </div>
    </motion.div>
  );
}
