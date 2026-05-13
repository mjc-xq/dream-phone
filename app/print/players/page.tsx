"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayerCard } from "@/components/PlayerCard";
import type { Player } from "@/lib/game/types";

const KEY = "dp_print_players";

export default function PrintPlayersPage() {
  const [players, setPlayers] = useState<Player[] | null>(null);

  useEffect(() => {
    // Syncing one-shot from localStorage on mount. This is the standard
    // pattern for SSR-incompatible data sources; cascading renders aren't a
    // concern because we set state at most once per mount.
    if (typeof window === "undefined") return;
    let parsed: Player[] = [];
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) parsed = (JSON.parse(raw) as Player[]).filter((p) => p.card);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayers(parsed);
  }, []);

  return (
    <div className="print-root min-h-dvh bg-white text-black p-6">
      <div className="no-print mb-6 flex items-center justify-between flex-wrap gap-3">
        <Link href="/print" className="dp-btn dp-btn-purple">← Hub</Link>
        <h1 className="text-2xl sm:text-3xl font-black uppercase">Player Cards</h1>
        <button
          type="button"
          className="dp-btn dp-btn-pink"
          onClick={() => window.print()}
          disabled={!players || players.length === 0}
        >
          🖨 Print
        </button>
      </div>

      {!players && (
        <p className="no-print opacity-70 text-sm">
          Loading… If nothing appears, head back to the game and tap{" "}
          <strong>🖨 Print Player Cards</strong> from the Actions panel — that snapshot stays in
          your browser only for this device.
        </p>
      )}

      {players && players.length === 0 && (
        <p className="no-print opacity-70 text-sm">
          No player cards saved yet. Take photos in setup, then tap{" "}
          <strong>🖨 Print Player Cards</strong> from the Actions panel during the game.
        </p>
      )}

      {players && players.length > 0 && (
        <>
          <p className="no-print text-sm opacity-70 mb-6 max-w-2xl">
            One player card per page. Use your browser&apos;s print dialog → <strong>Save as PDF</strong>.
          </p>
          <div className="space-y-8">
            {players.map((p) => (
              <section key={p.id} className="print-card-page break-after-page flex justify-center">
                <div className="scale-[1.2] origin-top">
                  <PlayerCard player={p} size="lg" />
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <style>{`
        @media print {
          @page { size: letter portrait; margin: 0.5in; }
          .break-after-page { break-after: page; page-break-after: always; }
          .print-card-page { padding: 0.25in 0; }
        }
      `}</style>
    </div>
  );
}
