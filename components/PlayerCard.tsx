"use client";

import { motion } from "framer-motion";
import type { Player } from "@/lib/game/types";

const COLOR_HEX: Record<string, string> = {
  yellow: "#FFD94B",
  pink: "#FF6FB1",
  teal: "#3DD3D5",
  lime: "#A8F045",
  orange: "#FF9046",
  violet: "#B975FF",
  skyblue: "#5DC2FF",
};

const HANGOUT_BANNER_COLOR: Record<string, { bg: string; fg: string }> = {
  "Crosstown Mall": { bg: "#3DD3D5", fg: "#1c0030" },
  "E.A.T.S. Snack Shop": { bg: "#FFD400", fg: "#1c0030" },
  "Reel Movies": { bg: "#8a2be2", fg: "#fff" },
  "Woodland Park": { bg: "#5cffb7", fg: "#1c0030" },
  "High Tide Beach": { bg: "#25e5ff", fg: "#1c0030" },
  "Jim's Gym": { bg: "#ff8a00", fg: "#1c0030" },
};

type Props = {
  player: Player;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function PlayerCard({ player, size = "md", className }: Props) {
  const skin = player.card;
  const dims = size === "sm" ? "w-36" : size === "lg" ? "w-72" : "w-56";

  if (!skin) {
    return (
      <div
        className={`${dims} aspect-[3/4] rounded-md border-4 border-dp-ink bg-dp-paper flex items-center justify-center text-dp-ink text-4xl font-black ${className ?? ""}`}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>
    );
  }

  const bg = COLOR_HEX[skin.cardColor] ?? "#FFD94B";
  const banner = HANGOUT_BANNER_COLOR[skin.hangout] ?? { bg: "#3DD3D5", fg: "#1c0030" };

  return (
    <motion.div
      initial={{ rotate: -2, scale: 0.95, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      whileHover={{ rotate: -1, scale: 1.02 }}
      className={`${dims} relative aspect-[3/4] rounded-md border-4 border-dp-ink overflow-hidden ${className ?? ""}`}
      style={{ backgroundColor: bg, boxShadow: "8px 8px 0 #1c0030" }}
    >
      {/* Hangout banner — angled */}
      <div
        className="absolute left-1 right-1 top-1 px-2 py-1 text-[12px] font-black uppercase tracking-wider text-center border-2 border-dp-ink z-10"
        style={{ background: banner.bg, color: banner.fg, transform: "rotate(-2deg)" }}
      >
        {skin.hangout}
      </div>

      {/* Photo at slight angle */}
      <div className="absolute inset-x-0 top-10 bottom-14 flex items-center justify-center px-3">
        <div
          className="relative w-[78%] h-[88%] border-4 border-dp-ink overflow-hidden bg-white"
          style={{ transform: "rotate(-3deg)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={skin.photoDataUrl}
            alt={player.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {skin.isPlaceholder && (
            <div className="absolute inset-0 bg-gradient-to-tr from-white/50 via-transparent to-white/50 animate-pulse" />
          )}
        </div>
      </div>

      {/* Name + phone banner — white, thick black stroke, bold black caps, angled */}
      <div
        className="absolute left-1 right-1 bottom-1 mx-auto py-1 px-2 text-center border-2 border-dp-ink bg-white text-dp-ink"
        style={{ transform: "rotate(-1.5deg)" }}
      >
        <div className="text-lg uppercase leading-none font-black tracking-tight">
          {player.name}
        </div>
        <div className="text-[11px] font-mono font-bold mt-0.5">{skin.phone}</div>
      </div>

      {skin.isPlaceholder && (
        <div className="absolute top-1 right-1 dp-chip dp-chip-pink text-[9px] z-20 animate-pulse">
          90s-ifying…
        </div>
      )}
    </motion.div>
  );
}
