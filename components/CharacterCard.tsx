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

const HANGOUT_ACCENT: Record<string, { accent: string; icon: string }> = {
  "Crosstown Mall":      { accent: "#5DC2FF", icon: "☀" },
  "E.A.T.S. Snack Shop": { accent: "#FFD94B", icon: "🌭" },
  "Reel Movies":         { accent: "#B975FF", icon: "🎬" },
  "Woodland Park":       { accent: "#A8F045", icon: "🌲" },
  "High Tide Beach":     { accent: "#FF9046", icon: "🌊" },
  "Jim's Gym":           { accent: "#FF6FB1", icon: "🏋" },
};

// Heavy black sans-serif stack. Helvetica Neue Black is the closest free
// stand-in for the original's chunky condensed-but-rounded lettering;
// Arial Black is a wider fallback that's available everywhere.
const DISPLAY_STACK =
  '"Helvetica Neue", "Arial Black", "Helvetica", sans-serif';

// Measured from the printed boy cards (sample: 5 cards, all consistent).
// Photo frame center is at the geometric center of the card. Width and
// height are pre-rotation; rotation is applied at center.
const PHOTO_W_PCT = 60.3;      // photo width as % of card width
const PHOTO_H_PCT = 52.1;      // photo height as % of card height
const PHOTO_TILT_DEG = -6.5;   // CCW rotation, matches measured tilt
const BANNER_TOP_PCT = 4;
const BANNER_HEIGHT_PCT = 12;
const BANNER_WIDTH_PCT = 80;
const PHONE_BOTTOM_PCT = 4;
const PHONE_HEIGHT_PCT = 8;

type Props = {
  boy: BoyCard;
  mode: GameMode;
  className?: string;
  /** Kept for backwards-compat; sizing is now container-query driven. */
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

  // Step name down for very long animal names so they don't blow past the
  // photo's bottom-left margin.
  const nameLen = Math.max(1, skin.name.length);
  const nameCqw = nameLen <= 5 ? 17 : nameLen <= 7 ? 14 : nameLen <= 9 ? 11 : nameLen <= 11 ? 9 : 8;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
      style={{ background: bg, containerType: "inline-size" }}
    >
      {/* Banner — black band centered at top, with a per-hangout icon, a
          serif location label, and an accent rule. */}
      <div
        className="absolute bg-black text-white flex flex-col items-center justify-center"
        style={{
          top: `${BANNER_TOP_PCT}%`,
          left: `${(100 - BANNER_WIDTH_PCT) / 2}%`,
          width: `${BANNER_WIDTH_PCT}%`,
          height: `${BANNER_HEIGHT_PCT}%`,
          borderRadius: 2,
          paddingTop: "1cqw",
          paddingBottom: "1cqw",
        }}
      >
        <span aria-hidden className="leading-none" style={{ fontSize: "5.5cqw" }}>
          {icon}
        </span>
        <span
          className="font-black uppercase leading-none whitespace-nowrap"
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: "5.5cqw",
            letterSpacing: "0.06em",
            marginTop: "1cqw",
          }}
        >
          {boy.hangout}
        </span>
        <span
          style={{
            display: "block",
            height: "1cqw",
            width: "65%",
            background: accent,
            marginTop: "1.2cqw",
            borderRadius: 1,
          }}
        />
      </div>

      {/* Photo frame — tilted -6.5°, centered at (50%, 50%) of card, sized
          to the measured 60.3% × 52.1% of the card. Name sits inside it
          (and tilts with it). */}
      <div
        className="absolute bg-white"
        style={{
          left: "50%",
          top: "50%",
          width: `${PHOTO_W_PCT}%`,
          height: `${PHOTO_H_PCT}%`,
          transform: `translate(-50%, -50%) rotate(${PHOTO_TILT_DEG}deg)`,
          border: "0.6cqw solid #000",
          overflow: "hidden",
          boxShadow: "0.6cqw 0.6cqw 0 rgba(0,0,0,0.18)",
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
            bottom: "5%",
            left: "5%",
            fontFamily: DISPLAY_STACK,
            fontSize: `${nameCqw}cqw`,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: "0.01em",
            WebkitTextStroke: "0.55cqw #000",
            paintOrder: "stroke fill",
          }}
        >
          {skin.name}
        </div>
      </div>

      {/* Phone — big bold black centered below the photo */}
      <div
        className="absolute w-full text-center leading-none"
        style={{
          bottom: `${PHONE_BOTTOM_PCT}%`,
          left: 0,
          height: `${PHONE_HEIGHT_PCT}%`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: DISPLAY_STACK,
          fontSize: "9cqw",
          fontWeight: 900,
          color: "#000000",
          letterSpacing: "0.04em",
        }}
      >
        {boy.phone}
      </div>
    </div>
  );
}
