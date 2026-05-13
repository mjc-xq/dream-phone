"use client";

import type { GameState } from "@/lib/game/types";

const STORAGE_KEY = "dp_print_players";

type Props = {
  state: GameState;
};

export function PrintPlayerCardsButton({ state }: Props) {
  const playersWithCards = state.players.filter((p) => p.card);
  const ready = playersWithCards.length > 0;
  if (!ready) return null;

  const openPrint = () => {
    if (typeof window === "undefined") return;
    try {
      const snapshot = playersWithCards.map((p) => ({
        id: p.id,
        name: p.name,
        card: p.card,
        // engine-required fields kept minimal — only what PlayerCard reads.
        pvpHand: [],
        collectedClues: [],
        struckClues: [],
        markedBoys: [],
        guessedThisTurn: false,
      }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // localStorage can throw in private mode — keep going; the page will
      // show the empty-state helper.
    }
    window.open("/print/players", "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={openPrint}
      className="dp-btn dp-btn-teal text-xs py-1.5 px-3"
    >
      🖨 Print Player Cards
    </button>
  );
}
