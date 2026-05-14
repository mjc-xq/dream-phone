"use client";

import Image from "next/image";
import type { GameMode } from "@/lib/game/types";
import { animalSkinFor, imageForBoy, type BoyCard } from "@/lib/game/cards";

const COLOR_HEX: Record<string, string> = {
  yellow: "#FFD94B",
  pink: "#FF6FB1",
  teal: "#3DD3D5",
  lime: "#A8F045",
  orange: "#FF9046",
  violet: "#B975FF",
  skyblue: "#5DC2FF",
};

// Each hangout's accent + decorative glyph, mirroring the small graphic
// each location has on the printed cards.
const HANGOUT_ACCENT: Record<string, { accent: string; icon: string }> = {
  "Crosstown Mall":      { accent: "#5DC2FF", icon: "☀" },
  "E.A.T.S. Snack Shop": { accent: "#FFD94B", icon: "🌭" },
  "Reel Movies":         { accent: "#B975FF", icon: "🎬" },
  "Woodland Park":       { accent: "#A8F045", icon: "🌲" },
  "High Tide Beach":     { accent: "#FF9046", icon: "🌊" },
  "Jim's Gym":           { accent: "#FF6FB1", icon: "🏋" },
};

// Stack used everywhere we want chunky display type that matches the printed
// cards. Impact is widely available; Haettenschweiler/Arial Black are
// reasonable Mac/Windows fallbacks.
const DISPLAY_STACK =
  'Impact, "Haettenschweiler", "Arial Narrow Bold", "Helvetica Neue Condensed", "Arial Black", sans-serif';

type Props = {
  boy: BoyCard;
  mode: GameMode;
  className?: string;
  /** Visual hint kept for backwards-compat. Sizing is otherwise driven by
   *  container queries so the card scales correctly at any width. */
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  sizes?: string;
};

export function CharacterCard({ boy, mode, className, priority, sizes }: Props) {
  const skin = animalSkinFor(boy, mode);

  if (!skin) {
    return (
      <div className={`relative w-full h-full bg-white ${className ?? ""}`}>
        <Image
          src={imageForBoy(boy)}
          alt={boy.name}
          fill
          sizes={sizes ?? "(max-width: 640px) 50vw, 260px"}
          priority={priority}
          className="object-contain"
        />
      </div>
    );
  }

  const bg = COLOR_HEX[skin.cardColor] ?? COLOR_HEX.yellow;
  const { accent, icon } = HANGOUT_ACCENT[boy.hangout] ?? { accent: "#5DC2FF", icon: "✦" };

  // Name scales with container width via cqw, but we also step the size
  // down for very long names so they don't overflow.
  const nameLen = Math.max(1, skin.name.length);
  const nameVw = nameLen <= 5 ? 18 : nameLen <= 7 ? 15 : nameLen <= 9 ? 12 : nameLen <= 11 ? 10 : 9;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
      style={{ background: bg, containerType: "inline-size" }}
    >
      <div
        className="absolute inset-0 flex flex-col items-center"
        style={{ padding: "4% 5% 3%" }}
      >
        {/* Hangout banner — black band with hangout-specific icon, a serif
            location label, and a thin colored accent rule. */}
        <div
          className="w-full bg-black text-white flex flex-col items-center justify-center shrink-0"
          style={{ padding: "2.5cqw 3cqw 2cqw", borderRadius: 2 }}
        >
          <span
            aria-hidden
            className="leading-none"
            style={{ fontSize: "7cqw", marginBottom: "0.6cqw" }}
          >
            {icon}
          </span>
          <span
            className="font-black uppercase leading-none whitespace-nowrap"
            style={{
              fontFamily: DISPLAY_STACK,
              fontSize: "6.2cqw",
              letterSpacing: "0.06em",
            }}
          >
            {boy.hangout}
          </span>
          <span
            className="block"
            style={{
              height: "1.2cqw",
              width: "65%",
              background: accent,
              marginTop: "1.6cqw",
              borderRadius: 1,
            }}
          />
        </div>

        {/* Upright photo with thin black border. Name sits in the bottom-left
            with a clean stroke (no gradient — the stroke alone gives
            readability against busy backgrounds, same as the printed cards). */}
        <div className="relative flex-1 w-full flex items-stretch justify-center mt-[2cqw] mb-[1.5cqw] min-h-0">
          <div
            className="relative bg-white"
            style={{
              width: "96%",
              height: "100%",
              border: "0.8cqw solid #000",
              overflow: "hidden",
            }}
          >
            <Image
              src={skin.image90s ?? skin.image}
              alt={skin.name}
              fill
              sizes={sizes ?? "260px"}
              priority={priority}
              className="object-cover"
            />
            <div
              className="absolute leading-none uppercase select-none"
              style={{
                bottom: "3.5cqw",
                left: "5cqw",
                fontFamily: DISPLAY_STACK,
                fontSize: `${nameVw}cqw`,
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: "0.01em",
                WebkitTextStroke: "0.7cqw #000",
                paintOrder: "stroke fill",
                textShadow: "0.4cqw 0.4cqw 0 rgba(0,0,0,0.35)",
              }}
            >
              {skin.name}
            </div>
          </div>
        </div>

        {/* Phone — big bold black below the photo */}
        <div
          className="w-full text-center leading-none shrink-0"
          style={{
            fontFamily: DISPLAY_STACK,
            fontSize: "10cqw",
            fontWeight: 900,
            color: "#000000",
            letterSpacing: "0.04em",
          }}
        >
          {boy.phone}
        </div>
      </div>
    </div>
  );
}
