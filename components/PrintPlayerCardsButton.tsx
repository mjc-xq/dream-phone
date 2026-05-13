"use client";

import type { GameState } from "@/lib/game/types";

const STORAGE_KEY = "dp_print_players";

type Props = {
  state: GameState;
};

function snapshot(state: GameState) {
  const playersWithCards = state.players.filter((p) => p.card);
  if (playersWithCards.length === 0) return false;
  if (typeof window === "undefined") return false;
  try {
    const data = playersWithCards.map((p) => ({
      id: p.id,
      name: p.name,
      card: p.card,
      pvpHand: [],
      collectedClues: [],
      struckClues: [],
      markedBoys: [],
      guessedThisTurn: false,
    }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function PrintPlayerCardsButton({ state }: Props) {
  const playersWithCards = state.players.filter((p) => p.card);
  const ready = playersWithCards.length > 0;
  if (!ready) return null;

  const open = (href: string) => () => {
    snapshot(state);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={open("/print/players")}
        className="dp-btn dp-btn-teal text-xs py-1.5 px-3"
      >
        🖨 Player Cards
      </button>
      <button
        type="button"
        onClick={open("/print/notepad")}
        className="dp-btn dp-btn-mint text-xs py-1.5 px-3"
      >
        🖨 Notepads
      </button>
    </div>
  );
}
