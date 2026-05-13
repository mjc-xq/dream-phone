"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BOYS } from "@/lib/game/cards";
import { getUniqueValues } from "@/lib/game/engine";
import { PlayerCard } from "@/components/PlayerCard";
import type { Player } from "@/lib/game/types";

const STORAGE_KEY = "dp_print_players";

const HANGOUTS = [
  "Crosstown Mall",
  "E.A.T.S. Snack Shop",
  "Reel Movies",
  "Woodland Park",
  "High Tide Beach",
  "Jim's Gym",
] as const;

export default function PrintNotepadPage() {
  const u = getUniqueValues();
  const [players, setPlayers] = useState<Player[] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let parsed: Player[] = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) parsed = (JSON.parse(raw) as Player[]).filter((p) => p.card);
    } catch {
      // ignore — fall through to blank notepad
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayers(parsed);
  }, []);

  // SSR + before-mount: render a single blank notepad. After mount, render
  // one notepad per player with their card at top, or fall back to blank.
  const sheets =
    players && players.length > 0
      ? players
      : ([null] as Array<Player | null>);

  return (
    <div className="print-root min-h-dvh bg-white text-black p-6">
      <div className="no-print mb-6 flex items-center justify-between flex-wrap gap-3">
        <Link href="/print" className="dp-btn dp-btn-purple">← Hub</Link>
        <h1 className="text-2xl sm:text-3xl font-black uppercase">Clue Card / Notepad</h1>
        <button type="button" className="dp-btn dp-btn-pink" onClick={() => window.print()}>
          🖨 Print
        </button>
      </div>

      {players && players.length > 0 ? (
        <p className="no-print text-sm opacity-70 mb-6 max-w-2xl">
          Personalized for {players.length} player{players.length === 1 ? "" : "s"} — each gets one
          notepad sheet with their player card printed at the top. Landscape Letter / A4.
        </p>
      ) : (
        <p className="no-print text-sm opacity-70 mb-6 max-w-2xl">
          Blank notepad (1 sheet). To get a personalized sheet per player with their player card,
          head back to the game and tap <strong>🖨 Print Notepads</strong> in the Actions panel.
        </p>
      )}

      <div className="notepad-stack space-y-8">
        {sheets.map((p, i) => (
          <NotepadSheet key={p ? `p${p.id}` : `blank${i}`} player={p} unique={u} />
        ))}
      </div>

      <style>{`
        .notepad-sheet { max-width: 1080px; }
        .notepad-sheet + .notepad-sheet { margin-top: 32px; }
        @media print {
          @page { size: letter landscape; margin: 0.35in; }
          .print-root { padding: 0 !important; }
          .notepad-stack > * + * { break-before: page; page-break-before: always; }
          .notepad-sheet {
            max-width: none !important;
            width: 100% !important;
            border: none !important;
            padding: 0 !important;
            font-size: 10pt;
            page-break-inside: avoid;
          }
          .notepad-sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

function NotepadSheet({
  player,
  unique,
}: {
  player: Player | null;
  unique: { hangouts: string[]; sports: string[]; foods: string[]; clothing: string[] };
}) {
  return (
    <section className="notepad-sheet mx-auto bg-white text-black border-2 border-black p-4">
      <header className="border-b-4 border-black pb-2 mb-3 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {player?.card && (
            <div className="shrink-0">
              {/* Compact 110px player card next to the heading */}
              <div style={{ width: 110 }}>
                <PlayerCard player={player} size="sm" />
              </div>
            </div>
          )}
          <div className="min-w-0">
            <div
              className="text-3xl sm:text-4xl font-black tracking-tight uppercase leading-none"
              style={{ fontFamily: '"Georgia", "Times New Roman", serif', letterSpacing: "-0.02em" }}
            >
              Dream Phone <span className="text-base align-top">TM</span>
            </div>
            <div className="text-[11px] uppercase tracking-widest opacity-70 mt-1">
              Player Clue Card · cross things off as you rule them out
            </div>
          </div>
        </div>
        <div className="text-[11px] uppercase tracking-widest shrink-0 text-right">
          {player ? (
            <>
              <div>Player: <strong>{player.name}</strong></div>
              {player.card?.phone && <div className="mt-1">Number: {player.card.phone}</div>}
            </>
          ) : (
            <>
              <div>Player: ______________________</div>
              <div className="mt-1">Date: ______________________</div>
            </>
          )}
        </div>
      </header>

      <div
        className="grid gap-4 grid-cols-3"
        style={{ fontFamily: '"Trebuchet MS", "Arial", sans-serif' }}
      >
        {/* Column 1 — Called */}
        <div className="min-w-0">
          <Section title="Called">
            <ul
              className="grid grid-cols-2 gap-x-3 gap-y-0.5"
              style={{ listStyle: "none", padding: 0, margin: 0 }}
            >
              {BOYS.map((b) => (
                <li key={b.id} className="flex items-center gap-1.5 leading-tight break-inside-avoid">
                  <span
                    className="inline-block border-2 border-black shrink-0"
                    style={{ width: 11, height: 11 }}
                  />
                  <span className="font-bold text-[13px] truncate">{b.name}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* Column 2 — Clue lists */}
        <div className="min-w-0 space-y-2.5">
          <Section title="Hang-Out Clues">
            <ClueList items={unique.hangouts} />
          </Section>
          <Section title="Sports Clues">
            <ClueList items={unique.sports} />
          </Section>
          <Section title="Food Clues">
            <ClueList items={unique.foods} />
          </Section>
          <Section title="Clothing Clues">
            <ClueList items={unique.clothing} />
          </Section>
        </div>

        {/* Column 3 — Secret Admirer */}
        <div className="min-w-0">
          <Section title="Secret Admirer?">
            <div className="space-y-1.5">
              {HANGOUTS.map((h) => {
                const boys = BOYS.filter((b) => b.hangout === h);
                return (
                  <div key={h} className="border border-black p-1.5 break-inside-avoid">
                    <div
                      className="text-[10px] font-black uppercase mb-1 pb-0.5 border-b border-black leading-tight"
                      style={{
                        fontFamily: '"Georgia", serif',
                        wordBreak: "break-word",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {h}
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="space-y-0.5">
                      {boys.map((b) => (
                        <li key={b.id} className="flex items-center gap-1 leading-tight">
                          <span
                            className="inline-block border-2 border-black shrink-0"
                            style={{ width: 10, height: 10 }}
                          />
                          <span className="font-bold text-[12px] truncate">{b.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      </div>

      <footer className="border-t-2 border-black mt-4 pt-2 flex items-center justify-between text-[10px] uppercase tracking-widest">
        <span>Cockafellow Games</span>
        <span>One sheet per player · pencil recommended</span>
      </footer>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="break-inside-avoid">
      <div
        className="border-b-2 border-black mb-1 pb-0.5 text-base font-black uppercase tracking-wider leading-none"
        style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function ClueList({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="space-y-0.5">
      {items.map((v) => (
        <li key={v} className="flex items-center gap-1.5 leading-tight">
          <span
            className="inline-block border-2 border-black shrink-0"
            style={{ width: 11, height: 11 }}
          />
          <span className="text-[12px] truncate">{v}</span>
        </li>
      ))}
    </ul>
  );
}
