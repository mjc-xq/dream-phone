"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BOYS, imageForBoy } from "@/lib/game/cards";
import type { GameState } from "@/lib/game/types";

type Props = {
  state: GameState;
};

export function BoyGallery({ state }: Props) {
  const player = state.players[state.currentPlayerIdx];
  const heard = new Set(player.collectedClues);
  const marked = new Set(player.markedBoys);
  const drawnId = state.drawnBoyId;

  return (
    <div className="dp-card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="dp-chip dp-chip-pink">All 24 Boys</div>
        <span className="text-[10px] opacity-60 uppercase">Drawn highlighted</span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
        {BOYS.map((b) => {
          const isDrawn = drawnId === b.id;
          const wasHeard = heard.has(b.id);
          const wasMarked = marked.has(b.id);
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: b.id * 0.01 }}
              className={`relative w-full aspect-[3/4] border-2 rounded-sm overflow-hidden bg-white ${
                isDrawn
                  ? "border-dp-pink-hot ring-4 ring-dp-yellow"
                  : "border-dp-ink"
              } ${wasMarked ? "opacity-40" : ""}`}
            >
              <Image
                src={imageForBoy(b)}
                alt={b.name}
                fill
                sizes="120px"
                className="object-contain"
              />
              {wasHeard && !wasMarked && (
                <span className="absolute top-0.5 left-0.5 dp-chip text-[8px] py-0 px-1">👂</span>
              )}
              {wasMarked && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-3xl">
                  ✕
                </span>
              )}
              {isDrawn && (
                <span className="absolute bottom-0 left-0 right-0 bg-dp-pink-hot text-white text-[9px] font-black uppercase text-center py-0.5">
                  Drawn
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
