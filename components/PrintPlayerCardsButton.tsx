"use client";

import { useRef } from "react";
import type { GameState } from "@/lib/game/types";
import { PlayerCard } from "./PlayerCard";

type Props = {
  state: GameState;
};

export function PrintPlayerCardsButton({ state }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const ready = state.players.some((p) => p.card && !p.card.isPlaceholder);
  if (!ready) return null;

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  return (
    <>
      <button
        type="button"
        onClick={handlePrint}
        className="dp-btn dp-btn-teal text-xs py-1.5 px-3"
      >
        🖨 Print Player Cards
      </button>

      <div
        ref={printRef}
        className="print-player-cards-only fixed inset-0 z-[100] bg-white text-black p-8 hidden"
        aria-hidden="true"
      >
        <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto place-items-center">
          {state.players
            .filter((p) => p.card)
            .map((p) => (
              <div key={p.id} className="m-auto">
                <PlayerCard player={p} size="lg" />
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
