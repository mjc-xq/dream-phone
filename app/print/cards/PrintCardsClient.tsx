"use client";

import { useState } from "react";
import { BOYS, type BoyCard, imageForBoy, imageForPvp } from "@/lib/game/cards";

type Mode = "front" | "duplex";

const HANGOUT_TONE: Record<string, string> = {
  "Crosstown Mall": "#FF6FB1",
  "E.A.T.S. Snack Shop": "#FFD94B",
  "Reel Movies": "#B975FF",
  "Woodland Park": "#A8F045",
  "High Tide Beach": "#5DC2FF",
  "Jim's Gym": "#FF9046",
};

type AnyCard =
  | { kind: "boy"; boy: BoyCard }
  | { kind: "pvp"; type: "hangup" | "share_secret" | "speakerphone"; label: string }
  | { kind: "back" };

const PVP_INFO: Record<string, { name: string; effect: string }> = {
  hangup: { name: "Mom Says Hang Up!", effect: "Target boy is discarded. Loses dial + clue." },
  share_secret: { name: "Share a Secret", effect: "Hear the clue too. Card transfers to dialer." },
  speakerphone: { name: "Speakerphone", effect: "Whole table hears the clue. Card removed." },
};

export function PrintCardsClient() {
  const [mode, setMode] = useState<Mode>("front");

  // Build the deck: 24 boys + 3 PvP + 1 card-back.
  const deck: AnyCard[] = [
    ...BOYS.map((b) => ({ kind: "boy" as const, boy: b })),
    { kind: "pvp" as const, type: "hangup", label: "Mom Says Hang Up!" },
    { kind: "pvp" as const, type: "share_secret", label: "Share a Secret" },
    { kind: "pvp" as const, type: "speakerphone", label: "Speakerphone" },
  ];

  // 9 cards per page, 3x3 grid.
  const perPage = 9;
  const pages: AnyCard[][] = [];
  for (let i = 0; i < deck.length; i += perPage) pages.push(deck.slice(i, i + perPage));

  return (
    <>
      <div className="no-print mb-4 flex items-center gap-2 flex-wrap">
        <span className="text-sm font-black uppercase tracking-widest opacity-70">Print mode:</span>
        <button
          type="button"
          className={`dp-btn ${mode === "front" ? "dp-btn-pink" : ""} text-sm py-1.5 px-3`}
          onClick={() => setMode("front")}
        >
          Fronts only
        </button>
        <button
          type="button"
          className={`dp-btn ${mode === "duplex" ? "dp-btn-pink" : ""} text-sm py-1.5 px-3`}
          onClick={() => setMode("duplex")}
        >
          Double-sided (info on back)
        </button>
        <button
          type="button"
          className="dp-btn dp-btn-pink ml-auto"
          onClick={() => window.print()}
        >
          🖨 Print
        </button>
      </div>

      {mode === "duplex" && (
        <p className="no-print text-xs opacity-70 mb-6 max-w-2xl">
          Set your printer to <strong>double-sided</strong>, &ldquo;Flip on long edge&rdquo;. Fronts
          and backs are aligned so each card&apos;s info prints behind its face.
        </p>
      )}
      {mode === "front" && (
        <p className="no-print text-xs opacity-70 mb-6 max-w-2xl">
          Letter portrait, 3 × 3 cards per page. Cut along the edges.
        </p>
      )}

      <div className="cards-pages space-y-8">
        {pages.map((page, pi) => (
          <div key={`p-${pi}`} className="card-page-pair">
            <CardPage page={page} side="front" />
            {mode === "duplex" && <CardPage page={page} side="back" />}
          </div>
        ))}
      </div>

      <style>{`
        .card-page { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .card-page .card-slot { aspect-ratio: 3 / 4; }
        @media print {
          @page { size: letter portrait; margin: 0.35in; }
          /* Drop the screen-mode wrapper padding (p-6) so the 3×3 grid uses
             the full printable area — otherwise cards print tiny. */
          .print-root { padding: 0 !important; }
          .no-print { display: none !important; }
          .cards-pages > * + * { margin-top: 0; }
          .card-page-pair > * + * { break-before: page; page-break-before: always; }
          .card-page-pair { break-after: page; page-break-after: always; }
          .card-page { gap: 0.05in !important; }
          .card-page .card-slot { break-inside: avoid; page-break-inside: avoid; }
          .card-page * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  );
}

function CardPage({ page, side }: { page: AnyCard[]; side: "front" | "back" }) {
  // For long-edge duplex flip, mirror columns on the back so each back lines
  // up behind its corresponding front. The page is 3 cols, so col 0 <-> col 2.
  const ordered =
    side === "back"
      ? page.map((c, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const backCol = 2 - col;
          const backIdx = row * 3 + backCol;
          return page[backIdx] ?? c;
        })
      : page;

  return (
    <div className="card-page bg-white">
      {Array.from({ length: 9 }).map((_, i) => {
        const card = ordered[i];
        return (
          <div key={i} className="card-slot">
            {card ? side === "front" ? <FrontSlot card={card} /> : <BackSlot card={card} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function FrontSlot({ card }: { card: AnyCard }) {
  if (card.kind === "boy") {
    return (
      <div className="relative w-full h-full border-2 border-black overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageForBoy(card.boy)}
          alt={card.boy.name}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>
    );
  }
  if (card.kind === "pvp") {
    return (
      <div className="relative w-full h-full border-2 border-black overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageForPvp(card.type)}
          alt={card.label}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>
    );
  }
  return null;
}

function BackSlot({ card }: { card: AnyCard }) {
  if (card.kind === "boy") {
    const b = card.boy;
    const tone = HANGOUT_TONE[b.hangout] ?? "#FFD94B";
    return (
      <div
        className="relative w-full h-full border-2 border-black overflow-hidden flex flex-col"
        style={{ background: tone, color: "#1c0030" }}
      >
        <div
          className="text-center px-2 py-2 border-b-2 border-black"
          style={{ background: "#000", color: "#fff" }}
        >
          <div
            className="font-black uppercase leading-tight"
            style={{
              fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
              fontSize: "20pt",
              letterSpacing: "0.02em",
            }}
          >
            {b.name}
          </div>
          <div className="font-mono text-[10pt]" style={{ letterSpacing: "0.04em" }}>
            {b.phone}
          </div>
        </div>
        <div className="flex-1 p-2 grid gap-1.5 text-[9pt]" style={{ fontFamily: '"Trebuchet MS", sans-serif' }}>
          <div
            className="px-2 py-1 border-2 border-black bg-white text-center font-black uppercase"
            style={{ fontFamily: '"Georgia", serif', letterSpacing: "0.03em" }}
          >
            📍 {b.hangout}
          </div>
          {b.sport && (
            <div className="px-2 py-1 border-2 border-black bg-white/80 text-center font-black uppercase">
              🏅 {b.sport}
            </div>
          )}
          {b.food && (
            <div className="px-2 py-1 border-2 border-black bg-white/80 text-center font-black uppercase">
              🍕 {b.food}
            </div>
          )}
          <div className="px-2 py-1 border-2 border-black bg-white/80 text-center font-black uppercase">
            👕 {b.clothing}
          </div>
        </div>
      </div>
    );
  }
  if (card.kind === "pvp") {
    const info = PVP_INFO[card.type];
    return (
      <div className="relative w-full h-full border-2 border-black overflow-hidden bg-[#FFD94B] text-[#1c0030] flex flex-col">
        <div className="px-2 py-2 border-b-2 border-black bg-black text-white text-center">
          <div
            className="font-black uppercase leading-tight"
            style={{
              fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
              fontSize: "16pt",
              letterSpacing: "0.02em",
            }}
          >
            ⚡ PvP CARD
          </div>
        </div>
        <div className="flex-1 p-2 flex flex-col gap-2 text-[10pt]">
          <div
            className="px-2 py-1 border-2 border-black bg-white text-center font-black uppercase"
            style={{ fontFamily: '"Georgia", serif' }}
          >
            {info.name}
          </div>
          <div className="px-2 py-1 border-2 border-black bg-white/90 text-center">
            {info.effect}
          </div>
          <div className="mt-auto text-center text-[8pt] uppercase tracking-widest opacity-70 font-black">
            Cockafellow Games
          </div>
        </div>
      </div>
    );
  }
  return null;
}
