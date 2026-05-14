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

const HANGOUT_ICON: Record<string, string> = {
  "Crosstown Mall": "✦",
  "E.A.T.S. Snack Shop": "✸",
  "Reel Movies": "▶",
  "Woodland Park": "❦",
  "High Tide Beach": "☀",
  "Jim's Gym": "✚",
};

type Props = {
  boy: BoyCard;
  mode: GameMode;
  className?: string;
  /** When true, fills the parent — useful for grid slots. Default true. */
  fill?: boolean;
  /** Visual scale hint for name/phone fonts. */
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  sizes?: string;
};

/** Renders ONE character card. In Boys Mode (or for non-animal slots in
 *  Animals Mode) this is the original printed boy card image. In Animals
 *  Mode for an animal slot, it's a stylized card with a colored body, an
 *  angled photo, the animal's name overlaid in stroked white block letters,
 *  and the phone number below — same composition as the player cards. */
export function CharacterCard({ boy, mode, className, size = "md", priority, sizes }: Props) {
  const skin = animalSkinFor(boy, mode);

  // Non-animal slot: original boy card art.
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
  const icon = HANGOUT_ICON[boy.hangout] ?? "✦";
  // Step-down font sizing keeps longer animal names from overflowing.
  const nameLen = Math.max(1, skin.name.length);
  const baseName = size === "lg" ? 36 : size === "sm" ? 16 : 24;
  const nameSize =
    nameLen <= 6 ? baseName : nameLen <= 9 ? baseName - 4 : baseName - 8;
  const phoneSize = size === "lg" ? 22 : size === "sm" ? 11 : 15;
  const hangoutSize = size === "lg" ? 13 : size === "sm" ? 9 : 11;
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
      {/* Padded inner frame so the colored body shows around the photo */}
      <div className="absolute inset-0 flex flex-col items-center" style={{ padding: "5% 6%" }}>
        {/* Hangout banner */}
        <div
          className="w-full bg-black text-white border border-black flex items-center justify-center gap-1.5 shrink-0"
          style={{ padding: "3px 6px" }}
        >
          <span aria-hidden className="leading-none" style={{ fontSize: hangoutSize - 1 }}>
            {icon}
          </span>
          <span
            className="font-black uppercase leading-none tracking-tight whitespace-nowrap"
            style={{ fontSize: hangoutSize, letterSpacing: "0.04em" }}
          >
            {boy.hangout}
          </span>
        </div>

        {/* Angled photo + name overlay */}
        <div className="relative flex-1 w-full flex items-stretch justify-center mt-2 mb-1.5 min-h-0">
          <div
            className="relative bg-white"
            style={{
              width: "88%",
              height: "100%",
              border: "3px solid #000",
              transform: "rotate(-3.5deg)",
              transformOrigin: "center",
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
            {/* Darken bottom for name readability */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{
                height: "40%",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 80%, transparent 100%)",
              }}
            />
            {/* Name overlay */}
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
              {skin.name}
            </div>
          </div>
        </div>

        {/* Phone number */}
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
          {boy.phone}
        </div>
      </div>
    </div>
  );
}
