"use client";

import { useState } from "react";
import { BOYS } from "@/lib/game/cards";
import { BoyPortrait } from "./BoyPortrait";

type Props = {
  onGuess: (boyId: number) => void;
  onClose: () => void;
};

export function SolveModal({ onGuess, onClose }: Props) {
  const [search, setSearch] = useState("");
  const filter = search.trim().toLowerCase();
  const filtered = filter
    ? BOYS.filter((b) => b.name.toLowerCase().includes(filter) || b.phone.includes(filter))
    : BOYS;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center sm:justify-center sm:p-4"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="bg-dp-paper text-dp-ink sm:rounded-3xl sm:border-4 sm:border-dp-ink sm:shadow-[10px_10px_0_var(--dp-yellow)] sm:max-w-3xl w-full sm:max-h-[90dvh] overflow-y-auto dp-scroll dp-zoom flex flex-col">
        <div className="bg-dp-yellow py-3 px-5 flex items-center justify-between border-b-4 border-dp-ink">
          <h2 className="text-2xl font-black uppercase tracking-wider">Who is the Crush?</h2>
          <button type="button" className="dp-btn dp-btn-purple" onClick={onClose}>✕ Cancel</button>
        </div>
        <div className="p-5 space-y-3">
          <p className="font-bold">Pick the boy you think is the crush. Wrong guess = your guess is locked this turn.</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name or phone…"
            className="w-full px-4 py-2 rounded-full border-3 border-dp-ink bg-white text-dp-ink"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onGuess(b.id)}
                className="p-2 rounded-xl border-3 border-dp-ink shadow-[4px_4px_0_var(--dp-pink-hot)] bg-white hover:-translate-y-0.5 transition-transform text-left flex items-center gap-2"
              >
                <BoyPortrait boyId={b.id} size={44} />
                <div>
                  <div className="font-black uppercase leading-tight">{b.name}</div>
                  <div className="text-xs opacity-70">{b.phone}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
