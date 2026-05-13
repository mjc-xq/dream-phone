"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { GameState } from "@/lib/game/types";
import { PVP_LABELS, imageForPvp } from "@/lib/game/cards";

const EFFECT_TEXT = {
  hangup: "When you dial, Mom hangs up the phone — you LOSE this turn entirely. The card is then removed from the game.",
  speakerphone:
    "When you dial, the phone is on speaker — every player will hear your clue. You can still strike it on your clue card, but so can they.",
  shareSecret:
    "When you dial, the player who armed this card also hears your clue, AND the Share-a-Secret card transfers to your hand.",
} as const;

type Props = {
  state: GameState;
};

export function AffectingTurn({ state }: Props) {
  const p = state.pending;
  const active: Array<{ key: "hangup" | "speakerphone" | "share_secret"; from: number }> = [];
  if (p.momHangUp) active.push({ key: "hangup", from: p.momHangUp.ownerPlayerId });
  if (p.speakerphone) active.push({ key: "speakerphone", from: p.speakerphone.ownerPlayerId });
  if (p.shareSecret) active.push({ key: "share_secret", from: p.shareSecret.ownerPlayerId });

  if (active.length === 0) return null;

  return (
    <motion.div
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="dp-card p-3 border-3 border-dp-magenta"
      style={{ boxShadow: "6px 6px 0 var(--dp-pink-hot)" }}
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="dp-chip dp-chip-pink">⚠ Affecting Your Turn</div>
        <span className="text-[11px] opacity-70 uppercase font-black">Read before dialing!</span>
      </div>
      <div className="space-y-2">
        {active.map((a) => {
          const fromName = state.players.find((pl) => pl.id === a.from)?.name ?? "Someone";
          const text =
            a.key === "hangup"
              ? EFFECT_TEXT.hangup
              : a.key === "speakerphone"
              ? EFFECT_TEXT.speakerphone
              : EFFECT_TEXT.shareSecret;
          const pvpType = a.key === "hangup" ? "hangup" : a.key === "speakerphone" ? "speakerphone" : "share_secret";
          return (
            <div key={a.key} className="flex items-stretch gap-2 bg-white border-2 border-dp-ink rounded-md p-2">
              <div className="relative w-14 aspect-[3/4] shrink-0 border-2 border-dp-ink overflow-hidden bg-white">
                <Image src={imageForPvp(pvpType)} alt={PVP_LABELS[pvpType]} fill sizes="60px" className="object-contain" />
              </div>
              <div className="text-xs sm:text-sm text-dp-ink flex-1">
                <div className="font-black uppercase">
                  {PVP_LABELS[pvpType]} <span className="opacity-60 text-[10px] font-normal">— from {fromName}</span>
                </div>
                <div className="opacity-90 leading-snug mt-0.5">{text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
