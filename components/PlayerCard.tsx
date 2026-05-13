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

// Small monochrome icon glyph next to the hangout banner — matches the
// decorative icons (sun, film strip, etc.) on the original boy cards.
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

  return (
    <motion.div
      initial={{ rotate: -1.5, scale: 0.95, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      whileHover={{ rotate: -1, scale: 1.02 }}
      className={`${dims} aspect-[3/4] rounded-[6px] overflow-hidden ${className ?? ""}`}
      style={{ backgroundColor: bg, boxShadow: "6px 6px 0 #1c0030", border: "2px solid rgba(0,0,0,0.6)" }}
    >
      {/* Inner padding region — matches the colored frame of the boy cards */}
      <div className="w-full h-full flex flex-col items-center" style={{ padding: "5% 6%" }}>
        {/* HANGOUT banner — solid black, white serif-ish caps with an icon */}
        <div
          className="w-full bg-black text-white border border-black flex items-center justify-center gap-1.5"
          style={{ padding: "4px 6px" }}
        >
          <span aria-hidden className="text-[10px] leading-none">
            {icon}
          </span>
          <span
            className="font-black uppercase leading-none tracking-tight whitespace-nowrap"
            style={{ fontSize: size === "sm" ? 9 : size === "lg" ? 13 : 11 }}
          >
            {skin.hangout}
          </span>
        </div>

        {/* PHOTO with thick black border + name banner at bottom of photo */}
        <div
          className="relative w-full flex-1 mt-1.5 overflow-hidden bg-white"
          style={{ border: "3px solid #000" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={skin.photoDataUrl}
            alt={player.name}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Subtle shimmer while Gemini is processing */}
          {skin.isPlaceholder && (
            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-white/40 animate-pulse pointer-events-none" />
          )}

          {/* NAME BANNER at the bottom of the photo */}
          <div className="absolute left-0 right-0 bottom-0 bg-black text-white text-center" style={{ padding: "3px 6px" }}>
            <span
              className="font-black uppercase tracking-tight leading-none"
              style={{
                fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
                fontSize: size === "sm" ? 16 : size === "lg" ? 28 : 22,
                letterSpacing: "0.02em",
              }}
            >
              {player.name}
            </span>
          </div>
        </div>

        {/* PHONE NUMBER below the photo, on the solid color */}
        <div
          className="mt-1.5 text-black font-black leading-none"
          style={{
            fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
            fontSize: size === "sm" ? 13 : size === "lg" ? 22 : 17,
            letterSpacing: "0.02em",
          }}
        >
          {skin.phone}
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
