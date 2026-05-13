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

const HANGOUT_ICON: Record<string, string> = {
  "Crosstown Mall": "✦",
  "E.A.T.S. Snack Shop": "✸",
  "Reel Movies": "▶",
  "Woodland Park": "❦",
  "High Tide Beach": "☀",
  "Jim's Gym": "✚",
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

  const bg = COLOR_HEX[skin.cardColor] ?? COLOR_HEX.yellow;
  const icon = HANGOUT_ICON[skin.hangout] ?? "✦";

  // Sizes scale with card size — name in big stroked white text directly on the
  // colored card (no banner), photo set at an angle.
  const nameSize = size === "sm" ? 22 : size === "lg" ? 44 : 32;
  const phoneSize = size === "sm" ? 12 : size === "lg" ? 18 : 14;
  const strokeWidth = size === "sm" ? 2 : size === "lg" ? 4 : 3;
  const hangoutSize = size === "sm" ? 9 : size === "lg" ? 13 : 11;

  return (
    <motion.div
      initial={{ rotate: -1.5, scale: 0.95, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      whileHover={{ rotate: -1, scale: 1.02 }}
      className={`relative ${dims} aspect-[3/4] rounded-[6px] overflow-hidden ${className ?? ""}`}
      style={{ backgroundColor: bg, boxShadow: "6px 6px 0 #1c0030", border: "2px solid rgba(0,0,0,0.6)" }}
    >
      <div className="absolute inset-0 flex flex-col items-center" style={{ padding: "5% 6%" }}>
        {/* Hangout banner */}
        <div
          className="w-full bg-black text-white border border-black flex items-center justify-center gap-1.5 shrink-0"
          style={{ padding: "4px 6px" }}
        >
          <span aria-hidden className="leading-none" style={{ fontSize: hangoutSize - 1 }}>
            {icon}
          </span>
          <span
            className="font-black uppercase leading-none tracking-tight whitespace-nowrap"
            style={{ fontSize: hangoutSize }}
          >
            {skin.hangout}
          </span>
        </div>

        {/* Photo — angled, thick black border, no background banner */}
        <div className="relative flex-1 w-full flex items-center justify-center mt-2 mb-1">
          <div
            className="relative w-[88%] h-full overflow-hidden bg-white"
            style={{ border: "4px solid #000", transform: "rotate(-3deg)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={skin.photoDataUrl}
              alt={player.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {skin.isPlaceholder && (
              <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-white/40 animate-pulse pointer-events-none" />
            )}
          </div>
        </div>

        {/* NAME — big white text with thick black stroke, no background. */}
        <div className="w-full text-center mt-1 shrink-0" style={{ transform: "rotate(-1.5deg)" }}>
          <div
            className="font-black uppercase leading-none"
            style={{
              fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
              fontSize: nameSize,
              letterSpacing: "0.02em",
              color: "#FFFFFF",
              WebkitTextStroke: `${strokeWidth}px #000000`,
              paintOrder: "stroke fill",
            }}
          >
            {player.name}
          </div>
          <div
            className="font-black leading-none mt-1"
            style={{
              fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
              fontSize: phoneSize,
              letterSpacing: "0.04em",
              color: "#FFFFFF",
              WebkitTextStroke: `${Math.max(1.5, strokeWidth - 1)}px #000000`,
              paintOrder: "stroke fill",
            }}
          >
            {skin.phone}
          </div>
        </div>
      </div>

      {skin.isPlaceholder && (
        <div className="absolute top-1 right-1 dp-chip dp-chip-pink text-[9px] z-20 animate-pulse">
          90s-ifying…
        </div>
      )}
    </motion.div>
  );
}
