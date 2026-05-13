"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Player } from "@/lib/game/types";
import { CARD_BACK_IMAGE } from "@/lib/game/cards";
import { PlayerCard } from "./PlayerCard";

type Props = {
  playerName: string;
  player?: Player;
  onReady: () => void;
};

export function Handoff({ playerName, player, onReady }: Props) {
  const [stage, setStage] = useState<"pass" | "draw">("pass");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-dp-ink flex items-center justify-center p-6"
      style={{
        backgroundImage: [
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 260 260'><g fill='none' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><path d='M20 50 Q35 30 50 50 T80 50' stroke='%23ffd400' opacity='0.45'/><path d='M200 80 Q215 60 230 80' stroke='%2300d4d0' opacity='0.45'/><circle cx='60' cy='130' r='5' fill='%23ff2d8a' opacity='0.5'/><polygon points='160,40 175,65 145,65' fill='%2300d4d0' opacity='0.45'/><rect x='40' y='200' width='12' height='12' transform='rotate(45 46 206)' fill='%23ff8a00' opacity='0.5'/></g></svg>\") 0 0 / 260px 260px",
          "radial-gradient(circle at 25% 20%, rgba(255,45,138,0.28), transparent 55%)",
          "radial-gradient(circle at 80% 80%, rgba(0,212,208,0.28), transparent 55%)",
        ].join(", "),
      }}
    >
      <AnimatePresence mode="wait">
        {stage === "pass" && (
          <motion.div
            key="pass"
            initial={{ y: 24, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -24, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative max-w-xl w-full text-center"
          >
            <motion.div
              className="dp-chip dp-chip-pink mb-3 mx-auto"
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              📞 Pass the Phone
            </motion.div>
            <motion.h1
              className="dp-title-stroke text-5xl sm:text-7xl leading-none mb-3"
              initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 14, delay: 0.15 }}
            >
              {playerName}
            </motion.h1>

            {player?.card && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center mb-4"
              >
                <PlayerCard player={player} size="md" />
              </motion.div>
            )}

            <motion.p
              className="text-base sm:text-xl opacity-90 mb-6"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 0.9 }}
              transition={{ delay: 0.45 }}
            >
              Hide the screen from everyone else. When <strong>{playerName}</strong> has the phone, tap below.
            </motion.p>
            <motion.button
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55, type: "spring", stiffness: 220 }}
              whileHover={{ scale: 1.05, rotate: -1.5 }}
              whileTap={{ scale: 0.94 }}
              type="button"
              className="dp-btn dp-btn-pink text-xl"
              onClick={() => setStage("draw")}
            >
              I&apos;m {playerName} — Let&apos;s Go ✨
            </motion.button>
          </motion.div>
        )}

        {stage === "draw" && (
          <motion.div
            key="draw"
            initial={{ y: 24, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -24, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative max-w-md w-full text-center"
          >
            <div className="dp-chip dp-chip-teal mb-3 mx-auto">Step 1 of 3 · Draw</div>
            <h2 className="dp-title-stroke text-4xl sm:text-5xl leading-tight mb-2">
              Tap the deck to draw a boy card!
            </h2>
            <p className="opacity-80 text-sm mb-5">
              The phone calls only that boy — every turn is one card, one call.
            </p>

            <motion.button
              type="button"
              onClick={onReady}
              whileHover={{ y: -3, scale: 1.03 }}
              whileTap={{ scale: 0.96, y: 1 }}
              className="relative inline-flex items-center justify-center"
              aria-label="Draw a card"
            >
              {/* Stack of card backs */}
              <DeckStack count={4} />
            </motion.button>

            <p className="opacity-70 text-xs mt-6">Tap the deck above to flip your card →</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DeckStack({ count }: { count: number }) {
  return (
    <span className="relative inline-block" style={{ width: 180, height: 240 }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute top-0 left-0 block"
          style={{
            width: 180,
            height: 240,
            transform: `translate(${-i * 4}px, ${-i * 4}px) rotate(${-1 - i}deg)`,
            zIndex: i,
            boxShadow: i === count - 1 ? "8px 8px 0 var(--dp-pink-hot)" : "0 0 0 transparent",
            borderRadius: 8,
            overflow: "hidden",
            border: "4px solid #1c0030",
          }}
          animate={i === count - 1 ? { y: [-2, 2, -2] } : undefined}
          transition={i === count - 1 ? { repeat: Infinity, duration: 1.6, ease: "easeInOut" } : undefined}
        >
          <Image src={CARD_BACK_IMAGE} alt="" fill sizes="180px" className="object-cover" />
        </motion.span>
      ))}
    </span>
  );
}
