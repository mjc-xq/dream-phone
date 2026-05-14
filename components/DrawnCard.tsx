"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CARD_BACK_IMAGE } from "@/lib/game/cards";
import type { BoardCard, GameMode } from "@/lib/game/types";
import { CharacterCard } from "./CharacterCard";

type Props = {
  card: BoardCard;
  className?: string;
  size?: "md" | "lg";
  deckSize?: number;
  mode?: GameMode;
};

export function DrawnCard({ card, className, size = "md", deckSize = 12, mode = "boys" }: Props) {
  const cardW = size === "lg" ? "w-[260px]" : "w-[220px]";
  // Build a stack of up to 4 visible card backs behind the drawn card
  const stackCount = Math.min(4, Math.max(1, Math.ceil(deckSize / 6)));

  return (
    <div className={`relative w-full flex items-start justify-center gap-4 sm:gap-6 ${className ?? ""}`}>
      {/* Deck pile on the left */}
      <div className="relative shrink-0">
        <div className={`${cardW} aspect-[3/4]`} style={{ visibility: "hidden" }} />
        {Array.from({ length: stackCount }).map((_, i) => {
          const offset = i * 3;
          return (
            <motion.div
              key={`back-${i}`}
              initial={false}
              animate={{ y: -offset, x: -offset, rotate: -2 - i * 1.5 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className={`absolute top-0 left-0 ${cardW} aspect-[3/4] rounded-md border-4 border-dp-ink overflow-hidden`}
              style={{
                boxShadow: i === stackCount - 1 ? "6px 6px 0 var(--dp-purple)" : "0 0 0 transparent",
                zIndex: i,
              }}
            >
              <Image
                src={CARD_BACK_IMAGE}
                alt=""
                fill
                sizes="260px"
                className="object-cover"
              />
            </motion.div>
          );
        })}
        <div className="absolute -bottom-7 left-0 right-0 text-center text-[10px] uppercase font-black tracking-widest text-dp-yellow">
          Draw pile ({deckSize})
        </div>
      </div>

      {/* Drawn card */}
      <motion.div
        key={card.id}
        initial={{ x: -180, y: -8, rotate: -14, scale: 0.7, opacity: 0 }}
        animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.15 }}
        className={`${cardW} relative bg-white rounded-md border-4 border-dp-ink overflow-hidden shrink-0`}
        style={{ boxShadow: "10px 10px 0 var(--dp-pink-hot)" }}
      >
        <div className="relative w-full aspect-[3/4]">
          <CharacterCard boy={card} mode={mode} size={size === "lg" ? "lg" : "md"} priority sizes="260px" />
        </div>
      </motion.div>
    </div>
  );
}
