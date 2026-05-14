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

// Arial Black is the heaviest standard sans available on Mac/Windows — closer
// to the printed card's beefy lettering than Helvetica or Trebuchet.
const DISPLAY_STACK = '"Arial Black", "Helvetica Neue", "Helvetica", sans-serif';

// Measured from the printed boy cards (5-card sample, all consistent).
const PHOTO_W_PCT = 60.3;
const PHOTO_H_PCT = 52.1;
const PHOTO_TILT_DEG = -6.5;
const BANNER_TOP_PCT = 4;
const BANNER_HEIGHT_PCT = 12;
const BANNER_WIDTH_PCT = 80;

type Props = {
  boy: BoyCard;
  mode: GameMode;
  className?: string;
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

  // Name lettering: smaller than before, with a slightly bigger first cap.
  const nameLen = Math.max(1, skin.name.length);
  const nameBaseCqw =
    nameLen <= 5 ? 13 : nameLen <= 7 ? 11 : nameLen <= 9 ? 9 : nameLen <= 11 ? 7.5 : 6.5;
  const firstLetter = skin.name.charAt(0);
  const restLetters = skin.name.slice(1);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
      style={{ background: bg, containerType: "inline-size" }}
    >
      {/* Banner */}
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

      {/* Photo frame — tilted -6.5°, centered, with a heavier black border */}
      <div
        className="absolute bg-white"
        style={{
          left: "50%",
          top: "50%",
          width: `${PHOTO_W_PCT}%`,
          height: `${PHOTO_H_PCT}%`,
          transform: `translate(-50%, -50%) rotate(${PHOTO_TILT_DEG}deg)`,
          border: "1.2cqw solid #000",
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
          className="absolute leading-none uppercase select-none whitespace-nowrap"
          style={{
            bottom: "4%",
            left: "5%",
            fontFamily: DISPLAY_STACK,
            fontSize: `${nameBaseCqw}cqw`,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: "0.02em",
            WebkitTextStroke: "0.5cqw #000",
            paintOrder: "stroke fill",
          }}
        >
          <span style={{ fontSize: "1.2em" }}>{firstLetter}</span>
          {restLetters}
        </div>
      </div>

      {/* Phone — tilted to match the photo, sitting just below the photo
          frame on the colored card body. Heavier stroke gives it the
          chunky printed-card weight. */}
      <div
        className="absolute leading-none uppercase select-none whitespace-nowrap"
        style={{
          top: "82%",
          left: "50%",
          transform: `translateX(-50%) rotate(${PHOTO_TILT_DEG}deg)`,
          transformOrigin: "center",
          fontFamily: DISPLAY_STACK,
          fontSize: "12cqw",
          fontWeight: 900,
          color: "#000000",
          letterSpacing: "0.04em",
          WebkitTextStroke: "0.35cqw #000",
          paintOrder: "stroke fill",
        }}
      >
        {boy.phone}
      </div>
    </div>
  );
}
