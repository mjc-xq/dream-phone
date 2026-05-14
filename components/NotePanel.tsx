"use client";

import { motion } from "framer-motion";
import { BOYS, displayName } from "@/lib/game/cards";
import { getUniqueValues, heardFor } from "@/lib/game/engine";
import type { GameState } from "@/lib/game/types";

type Props = {
  state: GameState;
  onToggleClue: (clue: string) => void;
  onToggleBoy: (boyId: number) => void;
};

const HANGOUT_ORDER = [
  "Crosstown Mall",
  "E.A.T.S. Snack Shop",
  "Reel Movies",
  "Woodland Park",
  "High Tide Beach",
  "Jim's Gym",
] as const;

const HANGOUT_COLOR: Record<string, string> = {
  "Crosstown Mall": "bg-dp-pink-hot/15 border-dp-pink-hot text-dp-magenta",
  "E.A.T.S. Snack Shop": "bg-dp-yellow/30 border-dp-orange text-dp-ink",
  "Reel Movies": "bg-dp-purple/15 border-dp-purple text-dp-purple",
  "Woodland Park": "bg-dp-mint/30 border-emerald-700 text-emerald-900",
  "High Tide Beach": "bg-dp-cyan/25 border-sky-700 text-sky-900",
  "Jim's Gym": "bg-dp-orange/20 border-dp-orange text-amber-800",
};

export function NotePanel({ state, onToggleClue, onToggleBoy }: Props) {
  const u = getUniqueValues();
  const player = state.players[state.currentPlayerIdx];
  const struck = new Set(player.struckClues);
  const marked = new Set(player.markedBoys);
  const heard = heardFor(state, state.currentPlayerIdx);
  const heardClues = new Set(heard.map((h) => h.clue));

  const clueButton = (v: string) => {
    const isStruck = struck.has(v);
    const wasHeard = heardClues.has(v);
    return (
      <button
        key={v}
        type="button"
        onClick={() => onToggleClue(v)}
        className={`text-left px-2 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
          isStruck
            ? "line-through text-dp-magenta bg-dp-pink-hot/15"
            : wasHeard
            ? "bg-dp-yellow/35 text-dp-ink font-bold"
            : "text-dp-ink hover:bg-dp-ink/5"
        }`}
      >
        {v}
        {wasHeard && !isStruck ? " 👂" : ""}
      </button>
    );
  };

  const boyButton = (id: number, name: string) => {
    const isMarked = marked.has(id);
    return (
      <button
        key={id}
        type="button"
        onClick={() => onToggleBoy(id)}
        className={`text-left px-2 py-0.5 rounded text-xs sm:text-sm font-bold transition-colors ${
          isMarked ? "line-through text-dp-magenta bg-dp-pink-hot/15" : "text-dp-ink hover:bg-dp-ink/5"
        }`}
      >
        {name}
      </button>
    );
  };

  return (
    <motion.aside
      initial={{ x: 10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="bg-dp-paper text-dp-ink border-4 border-dp-ink rounded-md p-4 shadow-[8px_8px_0_var(--dp-ink)]"
    >
      <div className="flex items-baseline justify-between mb-3 pb-2 border-b-4 border-double border-dp-ink">
        <div>
          <div className="text-xl sm:text-2xl font-black uppercase tracking-tight">Dream Phone</div>
          <div className="text-xs opacity-70 italic">{player.name}&apos;s clue card</div>
        </div>
        <span className="text-[10px] opacity-60 uppercase">Tap to strike</span>
      </div>

      <div className="space-y-4">
        <section>
          <div className="text-[11px] font-black uppercase tracking-wider text-dp-magenta border-b-2 border-dp-ink pb-0.5 mb-1.5">
            Called
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-2 gap-y-0.5">
            {BOYS.map((b) => boyButton(b.id, displayName(b, state.mode)))}
          </div>
        </section>

        <section>
          <div className="text-[11px] font-black uppercase tracking-wider text-dp-magenta border-b-2 border-dp-ink pb-0.5 mb-1.5">
            Hang-Out Clues
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">{u.hangouts.map(clueButton)}</div>
        </section>

        <section>
          <div className="text-[11px] font-black uppercase tracking-wider text-dp-magenta border-b-2 border-dp-ink pb-0.5 mb-1.5">
            Sports Clues
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">{u.sports.map(clueButton)}</div>
        </section>

        <section>
          <div className="text-[11px] font-black uppercase tracking-wider text-dp-magenta border-b-2 border-dp-ink pb-0.5 mb-1.5">
            Food Clues
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">{u.foods.map(clueButton)}</div>
        </section>

        <section>
          <div className="text-[11px] font-black uppercase tracking-wider text-dp-magenta border-b-2 border-dp-ink pb-0.5 mb-1.5">
            Clothing Clues
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">{u.clothing.map(clueButton)}</div>
        </section>

        <section>
          <div className="text-[11px] font-black uppercase tracking-wider text-dp-magenta border-b-2 border-dp-ink pb-0.5 mb-1.5">
            Secret Admirer?
          </div>
          <div className="space-y-1.5">
            {HANGOUT_ORDER.map((h) => {
              const boys = BOYS.filter((b) => b.hangout === h);
              const color = HANGOUT_COLOR[h] ?? "bg-dp-ink/5";
              return (
                <div key={h} className={`px-2 py-1 border-2 rounded-md ${color}`}>
                  <div className="text-[10px] font-black uppercase">{h}</div>
                  <div className="grid grid-cols-2 gap-x-2">
                    {boys.map((b) => boyButton(b.id, displayName(b, state.mode)))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {heard.length > 0 && (
          <section className="border-t-2 border-dashed border-dp-ink pt-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-dp-magenta mb-1.5">
              What you heard
            </div>
            <ul className="space-y-0.5 text-xs">
              {heard.map((h, i) => (
                <li key={`${h.boyId}-${i}`}>
                  📞 <strong>{displayName(state.board[h.boyId], state.mode)}</strong>: <em>not {h.clue}</em>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </motion.aside>
  );
}
