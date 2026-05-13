"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Player } from "@/lib/game/types";

const KEY = "dp_print_players";

const COLOR_HEX: Record<string, string> = {
  yellow: "#FFD94B",
  pink: "#FF6FB1",
  teal: "#3DD3D5",
  lime: "#A8F045",
  orange: "#FF9046",
  violet: "#B975FF",
  skyblue: "#5DC2FF",
};

const HANGOUT_ICON: Record<string, string> = {
  "Crosstown Mall": "✦",
  "E.A.T.S. Snack Shop": "✸",
  "Reel Movies": "▶",
  "Woodland Park": "❦",
  "High Tide Beach": "☀",
  "Jim's Gym": "✚",
};

export default function PrintPlayersPage() {
  const [players, setPlayers] = useState<Player[] | null>(null);

  useEffect(() => {
    // Sync from localStorage on mount — SSR-incompatible data source.
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

      {!players && <p className="no-print opacity-70 text-sm">Loading…</p>}

      {players && players.length === 0 && (
        <p className="no-print opacity-70 text-sm">
          No player cards saved yet. Take photos in setup, then tap{" "}
          <strong>🖨 Print</strong> from the Actions panel during the game.
        </p>
      )}

      {players && players.length > 0 && (
        <>
          <p className="no-print text-sm opacity-70 mb-6 max-w-2xl">
            One card per page. Letter portrait, 0.5&quot; margins. Save as PDF from the print dialog.
          </p>

          <div className="print-cards-stack">
            {players.map((p) => (
              <section key={p.id} className="print-card-page">
                <PrintSheet player={p} />
              </section>
            ))}
          </div>
        </>
      )}

      <style>{`
        .print-cards-stack > * + * { margin-top: 32px; }
        @media print {
          @page { size: letter portrait; margin: 0.4in; }
          /* The page wrapper has p-6 on screen for layout; in print mode we
             need the sheet to use the full @page printable area, so strip
             the extra padding that the wrapper adds. */
          .print-root { padding: 0 !important; }
          .print-cards-stack > * + * {
            margin-top: 0 !important;
            break-before: page;
            page-break-before: always;
          }
          .print-card-page {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print-card-page * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

/** Full-page printable sheet for one player. Sized to Letter portrait minus
 *  margins so every element is guaranteed to fit on a single page. No
 *  rotations or overflow:hidden on text — Safari's print pipeline mishandles
 *  those. Name and phone live in stable bars above and below the photo. */
function PrintSheet({ player }: { player: Player }) {
  const skin = player.card;
  if (!skin) return null;
  const bg = COLOR_HEX[skin.cardColor] ?? COLOR_HEX.yellow;
  const icon = HANGOUT_ICON[skin.hangout] ?? "✦";
  // Step the name size down for longer names so it never clips. Tuned so a
  // 7" wide print bar fits names up to ~16 chars at 56pt and ~24 chars at 36pt.
  const nameLen = Math.max(1, player.name.length);
  const namePt = nameLen <= 8 ? 64 : nameLen <= 12 ? 56 : nameLen <= 16 ? 48 : nameLen <= 20 ? 40 : 32;

  return (
    <div
      style={{
        width: "7.5in",
        height: "10in",
        margin: "0 auto",
        position: "relative",
        backgroundColor: bg,
        border: "5px solid #1c0030",
        borderRadius: 12,
        boxSizing: "border-box",
        padding: "0.4in 0.4in",
        display: "flex",
        flexDirection: "column",
        gap: "0.2in",
      }}
    >
      {/* HANGOUT BANNER */}
      <div
        style={{
          background: "#000",
          color: "#fff",
          padding: "0.12in 0.18in",
          textAlign: "center",
          fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
          fontWeight: 900,
          fontSize: "20pt",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          borderRadius: 3,
          flex: "0 0 auto",
        }}
      >
        <span style={{ marginRight: 10 }} aria-hidden>
          {icon}
        </span>
        {skin.hangout}
      </div>

      {/* PHOTO — fills remaining vertical space */}
      <div
        style={{
          flex: "1 1 auto",
          width: "100%",
          minHeight: 0,
          border: "5px solid #000",
          background: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={skin.photoDataUrl}
          alt={player.name}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* NAME — big block name in a black strip; auto-fits via clamp */}
      <div
        style={{
          background: "#000",
          color: "#fff",
          padding: "0.16in 0.2in",
          textAlign: "center",
          fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
          fontWeight: 900,
          // Stepped scale by name length — clamp() with a bogus formula
          // produced sub-readable sizes for short names. Plain ladder works.
          fontSize: `${namePt}pt`,
          letterSpacing: "0.01em",
          textTransform: "uppercase",
          lineHeight: 1,
          borderRadius: 3,
          flex: "0 0 auto",
          overflow: "hidden",
          wordBreak: "break-word",
        }}
      >
        {player.name}
      </div>

      {/* PHONE — bold black on the colored card body */}
      <div
        style={{
          textAlign: "center",
          fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
          fontWeight: 900,
          fontSize: "28pt",
          color: "#000",
          letterSpacing: "0.04em",
          lineHeight: 1,
          flex: "0 0 auto",
        }}
      >
        {skin.phone}
      </div>
    </div>
  );
}
