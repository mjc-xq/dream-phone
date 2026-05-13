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

function AttrRow({
  icon,
  value,
  fontSize,
  serif,
}: {
  icon: string;
  value: string;
  fontSize: number;
  serif?: boolean;
}) {
  return (
    <div
      className="border-2 border-black bg-white text-center font-black uppercase"
      style={{
        fontFamily: serif ? '"Georgia", serif' : '"Trebuchet MS", sans-serif',
        fontSize: `${fontSize}pt`,
        letterSpacing: "0.02em",
        lineHeight: 1.1,
        padding: "2px 4px",
        // wrap long labels rather than overflow
        wordBreak: "break-word",
        overflowWrap: "break-word",
      }}
    >
      <span style={{ marginRight: 4 }} aria-hidden>
        {icon}
      </span>
      {value}
    </div>
  );
}

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
    // Each boy has hangout + (sport OR food) + clothing = 3 rows max.
    // Step the name size down for longer names so the header doesn't clip.
    const nameLen = Math.max(1, b.name.length);
    const namePt = nameLen <= 5 ? 16 : nameLen <= 7 ? 14 : 12;
    // Step badge font down when the hangout label is long ("E.A.T.S. Snack Shop")
    const hangoutLen = b.hangout.length;
    const badgePt = hangoutLen > 14 ? 7 : 8;
    return (
      <div
        className="relative w-full h-full border-2 border-black flex flex-col"
        style={{ background: tone, color: "#1c0030", overflow: "hidden" }}
      >
        {/* Header: name + phone, tightly packed */}
        <div
          className="text-center border-b-2 border-black"
          style={{ background: "#000", color: "#fff", padding: "2px 4px" }}
        >
          <div
            className="font-black uppercase"
            style={{
              fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
              fontSize: `${namePt}pt`,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {b.name}
          </div>
          <div
            className="font-mono"
            style={{ fontSize: "8pt", letterSpacing: "0.04em", lineHeight: 1.1, marginTop: 1 }}
          >
            {b.phone}
          </div>
        </div>
        {/* Body: 3 attribute rows */}
        <div
          className="flex-1 flex flex-col"
          style={{ padding: 3, gap: 3, fontFamily: '"Trebuchet MS", sans-serif', minHeight: 0 }}
        >
          <AttrRow icon="📍" value={b.hangout} fontSize={badgePt} serif />
          {b.sport && <AttrRow icon="🏅" value={b.sport} fontSize={badgePt} />}
          {b.food && <AttrRow icon="🍕" value={b.food} fontSize={badgePt} />}
          <AttrRow icon="👕" value={b.clothing} fontSize={badgePt} />
        </div>
      </div>
    );
  }
  if (card.kind === "pvp") {
    const info = PVP_INFO[card.type];
    return (
      <div
        className="relative w-full h-full border-2 border-black bg-[#FFD94B] text-[#1c0030] flex flex-col"
        style={{ overflow: "hidden" }}
      >
        <div
          className="border-b-2 border-black bg-black text-white text-center"
          style={{ padding: "2px 4px" }}
        >
          <div
            className="font-black uppercase"
            style={{
              fontFamily: '"Trebuchet MS", "Arial Black", sans-serif',
              fontSize: "12pt",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            ⚡ PvP CARD
          </div>
        </div>
        <div className="flex-1 flex flex-col" style={{ padding: 4, gap: 4, minHeight: 0 }}>
          <div
            className="px-1.5 py-1 border-2 border-black bg-white text-center font-black uppercase"
            style={{ fontFamily: '"Georgia", serif', fontSize: "9pt", lineHeight: 1.1 }}
          >
            {info.name}
          </div>
          <div
            className="px-1.5 py-1 border-2 border-black bg-white/90 text-center"
            style={{ fontSize: "7pt", lineHeight: 1.2 }}
          >
            {info.effect}
          </div>
          <div
            className="mt-auto text-center uppercase tracking-widest opacity-70 font-black"
            style={{ fontSize: "6pt" }}
          >
            Cockafellow Games
          </div>
        </div>
      </div>
    );
  }
  return null;
}
