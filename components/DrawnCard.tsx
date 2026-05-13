"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { imageForBoy } from "@/lib/game/cards";
import type { BoardCard } from "@/lib/game/types";

type Props = {
  card: BoardCard;
  className?: string;
  size?: "md" | "lg";
};

export function DrawnCard({ card, className, size = "md" }: Props) {
  const w = size === "lg" ? "max-w-[320px]" : "max-w-[260px]";
  return (
    <motion.div
      key={card.id}
      initial={{ y: -30, rotate: -8, opacity: 0, scale: 0.85 }}
      animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={`${w} w-full mx-auto bg-white rounded-md border-4 border-dp-ink overflow-hidden ${className ?? ""}`}
      style={{ boxShadow: "10px 10px 0 var(--dp-pink-hot)" }}
    >
      <div className="relative w-full aspect-[3/4]">
        <Image
          src={imageForBoy(card)}
          alt={`${card.name} card`}
          fill
          priority
          sizes="320px"
          className="object-contain"
        />
      </div>
    </motion.div>
  );
}
