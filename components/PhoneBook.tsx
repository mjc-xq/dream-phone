"use client";

import { motion } from "framer-motion";
import { BOYS } from "@/lib/game/cards";
import type { GameState } from "@/lib/game/types";
import { BoyPortrait } from "./BoyPortrait";

type Props = {
  state: GameState;
  onClose: () => void;
};

const HANGOUTS = [
  "Crosstown Mall",
  "E.A.T.S. Snack Shop",
  "Reel Movies",
  "Woodland Park",
  "High Tide Beach",
  "Jim's Gym",
] as const;

export function PhoneBook({ state, onClose }: Props) {
  const player = state.players[state.currentPlayerIdx];
  const heardIds = new Set(player.collectedClues);
  const markedIds = new Set(player.markedBoys);
  const drawnId = state.drawnBoyId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-stretch sm:items-center sm:justify-center sm:p-3 md:p-4"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 230, damping: 22 }}
        className="bg-dp-paper text-dp-ink sm:rounded-3xl sm:border-4 sm:border-dp-ink sm:shadow-[10px_10px_0_var(--dp-pink-hot)] sm:max-w-5xl w-full sm:max-h-[92dvh] overflow-hidden flex flex-col"
      >
        <div className="bg-dp-yellow py-3 px-5 flex items-center justify-between border-b-4 border-dp-ink">
          <h2 className="text-2xl font-black uppercase tracking-wider">📖 Phone Book</h2>
          <button type="button" className="dp-btn dp-btn-purple" onClick={onClose}>
            ✕ Close
          </button>
        </div>
        <div className="p-4 overflow-y-auto dp-scroll space-y-4">
          {HANGOUTS.map((h) => {
            const boys = BOYS.filter((b) => b.hangout === h);
            return (
              <section key={h}>
                <div className="text-sm font-black uppercase tracking-wider text-dp-magenta border-b-2 border-dp-ink pb-1 mb-2">
                  {h}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {boys.map((b) => {
                    const heard = heardIds.has(b.id);
                    const marked = markedIds.has(b.id);
                    const isDrawn = drawnId === b.id;
                    return (
                      <div
                        key={b.id}
                        className={`flex items-center gap-2 p-2 rounded-md border-2 border-dp-ink ${
                          marked ? "bg-dp-pink-hot/15 line-through" : isDrawn ? "bg-dp-yellow/40" : "bg-white"
                        }`}
                      >
                        <BoyPortrait boyId={b.id} size={40} />
                        <div className="min-w-0 flex-1">
                          <div className="font-black truncate">{b.name}</div>
                          <div className="text-xs font-mono opacity-80">{b.phone}</div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {isDrawn && <span className="dp-chip dp-chip-pink text-[9px]">Drawn</span>}
                            {heard && <span className="dp-chip text-[9px]">Heard</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        <div className="px-5 py-2 text-[11px] text-center opacity-70 border-t-2 border-dp-ink">
          The crush could be any of the 24. Cross names off in your clue card.
        </div>
      </motion.div>
    </motion.div>
  );
}
