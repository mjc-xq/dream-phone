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

// Per-hangout decorative accent + emoji glyph, mirroring the unique graphic
// each location has on the printed cards (sun for the mall, hot-dog for
// EATS, etc.). The accent color sits as a thin rule under the banner text.
const HANGOUT_ACCENT: Record<string, { accent: string; icon: string }> = {
  "Crosstown Mall":      { accent: "#5DC2FF", icon: "☀" },
  "E.A.T.S. Snack Shop": { accent: "#FFD94B", icon: "🌭" },
  "Reel Movies":         { accent: "#B975FF", icon: "🎬" },
  "Woodland Park":       { accent: "#A8F045", icon: "🌲" },
  "High Tide Beach":     { accent: "#FF9046", icon: "🌊" },
  "Jim's Gym":           { accent: "#FF6FB1", icon: "🏋" },
};

type Props = {
  boy: BoyCard;
  mode: GameMode;
  className?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  sizes?: string;
};

/** Renders ONE character card. Boy slots show the printed card art. Animal
 *  slots in Animals Mode render a stylized card that mirrors the printed
 *  layout: solid colored body, a black hangout banner at top with the
 *  location name and a small icon, an upright bordered photo filling the
 *  center, the name overlaid bottom-left on the photo in stroked white
 *  block letters, and the phone number in big bold black below the photo. */
export function CharacterCard({ boy, mode, className, size = "md", priority, sizes }: Props) {
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

  const nameLen = Math.max(1, skin.name.length);
  const baseName = size === "lg" ? 40 : size === "sm" ? 17 : 26;
  const nameSize =
    nameLen <= 5 ? baseName
    : nameLen <= 7 ? baseName - 6
    : nameLen <= 10 ? baseName - 12
    : baseName - 16;
  const phoneSize = size === "lg" ? 26 : size === "sm" ? 12 : 17;
  const hangoutSize = size === "lg" ? 14 : size === "sm" ? 9 : 11;
  const iconSize = size === "lg" ? 16 : size === "sm" ? 10 : 13;

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
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
      style={{ background: bg }}
    >
      <div className="absolute inset-0 flex flex-col items-center" style={{ padding: "5% 6% 3%" }}>
        {/* Hangout banner — black band, hangout-specific icon + serif label,
            with a colored rule for the per-location accent */}
        <div
          className="w-full bg-black text-white flex flex-col items-center justify-center shrink-0"
          style={{ padding: "4px 6px 3px", borderRadius: 2 }}
        >
          <span aria-hidden className="leading-none" style={{ fontSize: iconSize, marginBottom: 1 }}>
            {icon}
          </span>
          <span
            className="font-black uppercase leading-none whitespace-nowrap"
            style={{
              fontFamily: '"Georgia", "Times New Roman", serif',
              fontSize: hangoutSize,
              letterSpacing: "0.06em",
            }}
          >
            {boy.hangout}
          </span>
          <span
            className="block"
            style={{
              height: 2,
              width: "70%",
              background: accent,
              marginTop: 3,
              borderRadius: 1,
            }}
          />
        </div>

        {/* Upright bordered photo + name overlay (no rotation — matches the
            printed cards). The photo fills the available middle band. */}
        <div className="relative flex-1 w-full flex items-stretch justify-center mt-1.5 mb-1.5 min-h-0">
          <div
            className="relative bg-white"
            style={{
              width: "94%",
              height: "100%",
              border: "2px solid #000",
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
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{
                height: "32%",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.05) 80%, transparent 100%)",
              }}
            />
            <div
              className="absolute leading-none uppercase"
              style={{
                bottom: "5%",
                left: "6%",
                fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
                fontSize: nameSize,
                fontWeight: 900,
                color: "#FFFFFF",
                textShadow: nameShadow,
                letterSpacing: "0.01em",
              }}
            >
              {skin.name}
            </div>
          </div>
        </div>

        {/* Phone — big bold black, sitting below the photo on the card body */}
        <div
          className="w-full text-center leading-none shrink-0"
          style={{
            fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
            fontSize: phoneSize,
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
