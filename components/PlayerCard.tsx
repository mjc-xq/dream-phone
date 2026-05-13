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

  const nameSize = size === "sm" ? 22 : size === "lg" ? 44 : 32;
  const phoneSize = size === "sm" ? 16 : size === "lg" ? 32 : 22;
  const hangoutSize = size === "sm" ? 9 : size === "lg" ? 13 : 11;
  // Crisp black "ink stroke" around the white name — matches the look of
  // the boy-card name lettering instead of using a black banner behind it.
  const nameShadow = [
    "2px 2px 0 #000",
    "-2px -2px 0 #000",
    "2px -2px 0 #000",
    "-2px 2px 0 #000",
    "2px 0 0 #000",
    "-2px 0 0 #000",
    "0 2px 0 #000",
    "0 -2px 0 #000",
  ].join(", ");

  return (
    <motion.div
      initial={{ rotate: -1, scale: 0.96, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      whileHover={{ rotate: -0.75, scale: 1.02 }}
      className={`relative ${dims} aspect-[3/4] rounded-[6px] overflow-hidden ${className ?? ""}`}
      style={{ backgroundColor: bg, boxShadow: "6px 6px 0 #1c0030", border: "2px solid rgba(0,0,0,0.6)" }}
    >
      <div className="absolute inset-0 flex flex-col items-center" style={{ padding: "5% 6%" }}>
        {/* Hangout banner — black bar with icon + label */}
        <div
          className="w-full bg-black text-white border border-black flex items-center justify-center gap-1.5 shrink-0"
          style={{ padding: "4px 6px" }}
        >
          <span aria-hidden className="leading-none" style={{ fontSize: hangoutSize - 1 }}>
            {icon}
          </span>
          <span
            className="font-black uppercase leading-none tracking-tight whitespace-nowrap"
            style={{ fontSize: hangoutSize, letterSpacing: "0.04em" }}
          >
            {skin.hangout}
          </span>
        </div>

        {/* Photo with thick black border + name OVERLAID at the bottom-left */}
        <div className="relative flex-1 w-full flex items-stretch justify-center mt-2 mb-1.5">
          <div
            className="relative w-full h-full overflow-hidden bg-white"
            style={{ border: "3px solid #000" }}
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
            {/* Bottom shadow gradient — keeps the white name readable
                even when the photo is light at the bottom */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{
                height: "45%",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 70%, transparent 100%)",
              }}
            />
            {/* NAME — overlaid on the bottom-left of the photo, big white block
                letters with a hard black ink stroke (matches the boy cards). */}
            <div
              className="absolute left-0 right-0 leading-none uppercase"
              style={{
                bottom: "4%",
                paddingLeft: "5%",
                paddingRight: "5%",
                fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
                fontSize: nameSize,
                fontWeight: 900,
                color: "#FFFFFF",
                textShadow: nameShadow,
                letterSpacing: "0.01em",
                textAlign: "left",
              }}
            >
              {player.name}
            </div>
          </div>
        </div>

        {/* Phone number — big BOLD BLACK on the colored card, like the boys */}
        <div
          className="w-full text-center leading-none shrink-0"
          style={{
            fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
            fontSize: phoneSize,
            fontWeight: 900,
            color: "#000000",
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
