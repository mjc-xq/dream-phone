"use client";

import { motion } from "framer-motion";
import { PVP_DESCRIPTIONS, PVP_LABELS, type PvpType } from "@/lib/game/cards";
import type { GameState } from "@/lib/game/types";

type Props = {
  state: GameState;
  onPlay: (ownerPlayerId: number, type: PvpType) => void;
};

const ICON: Record<PvpType, string> = {
  hangup: "📵",
  share_secret: "🤐",
  speakerphone: "📢",
};

export function OpponentPvpPanel({ state, onPlay }: Props) {
  if (state.numPlayers === 1) return null;
  const currentId = state.players[state.currentPlayerIdx].id;
  const opponents = state.players.filter((p) => p.id !== currentId);
  const pending = state.pending;
  const playedThisRound = new Set(state.pvpPlayedThisRound);

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="dp-card p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="dp-chip dp-chip-pink">Opponents — Play a Card?</div>
        <span className="text-xs opacity-70">Before they dial</span>
      </div>
      {(pending.momHangUp || pending.speakerphone || pending.shareSecret) && (
        <div className="text-xs text-dp-magenta font-bold mb-2 flex flex-wrap gap-1">
          {pending.momHangUp && <span className="dp-chip dp-chip-pink">📵 Mom Hung Up</span>}
          {pending.speakerphone && <span className="dp-chip dp-chip-teal">📢 Speakerphone armed</span>}
          {pending.shareSecret && <span className="dp-chip">🤐 Share a Secret armed</span>}
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-2">
        {opponents.map((p) => {
          const played = playedThisRound.has(p.id);
          return (
            <div key={p.id} className="border-2 border-dp-ink rounded-md p-2 bg-white">
              <div className="flex items-center justify-between mb-1">
                <div className="font-black uppercase text-sm">{p.name}</div>
                {played && <span className="dp-chip dp-chip-pink text-[9px]">Already played</span>}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(["hangup", "speakerphone", "share_secret"] as PvpType[]).map((t) => {
                  const has = p.pvpHand.some((c) => c.type === t);
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!has || played}
                      title={PVP_DESCRIPTIONS[t]}
                      onClick={() => onPlay(p.id, t)}
                      className={`text-[10px] py-1.5 rounded-md border-2 border-dp-ink font-bold ${
                        !has || played
                          ? "bg-zinc-200 opacity-50"
                          : t === "hangup"
                          ? "bg-dp-pink-hot text-white hover:scale-105"
                          : t === "speakerphone"
                          ? "bg-dp-teal hover:scale-105"
                          : "bg-dp-yellow hover:scale-105"
                      }`}
                    >
                      <div>{ICON[t]}</div>
                      <div className="leading-tight">{PVP_LABELS[t].split(" ")[0]}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
