"use client";

import type { GameState } from "@/lib/game/types";

const STORAGE_KEY = "dp_print_players";

type Props = {
  state: GameState;
  /** Optional compact mode — renders just an icon-ish button. */
  compact?: boolean;
};

function saveSnapshot(state: GameState) {
  if (typeof window === "undefined") return;
  try {
    const data = state.players
      .filter((p) => p.card)
      .map((p) => ({
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
  } catch {
    // ignore
  }
}

export function PrintPlayerCardsButton({ state, compact }: Props) {
  const ready = state.players.some((p) => p.card);
  if (!ready && !compact) return null;

  const open = () => {
    saveSnapshot(state);
    if (typeof window !== "undefined") {
      window.open("/print", "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      type="button"
      onClick={open}
      className={`dp-btn dp-btn-teal ${compact ? "text-xs py-1.5 px-3" : ""}`}
      title="Print cards, notepads, board, and the crush guide"
    >
      🖨 Print / PDF
    </button>
  );
}
