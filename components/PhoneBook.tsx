"use client";

import { motion } from "framer-motion";
import { BOYS, type BoyCard, displayName } from "@/lib/game/cards";
import type { GameMode } from "@/lib/game/types";
import type { GameState } from "@/lib/game/types";
import { BoyPortrait } from "./BoyPortrait";

type Props = {
  state: GameState;
  onClose: () => void;
};

const HANGOUTS = [
  "Crosstown Mall",
  "E.A.T.S. Snack Shop",
  "Reel Movies",
  "Woodland Park",
  "High Tide Beach",
  "Jim's Gym",
] as const;

export function PhoneBook({ state, onClose }: Props) {
  const player = state.players[state.currentPlayerIdx];
  const heardIds = new Set(player.collectedClues);
  const markedIds = new Set(player.markedBoys);
  const struckClues = new Set(player.struckClues);
  const drawnId = state.drawnBoyId;
  // Boys you've already called this game and the clue each one gave you.
  const heardLog = player.collectedClues.map((id) => ({
    boy: state.board[id],
    clue: state.board[id].clueReveal,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-stretch sm:items-center sm:justify-center sm:p-3 md:p-4"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 230, damping: 22 }}
        className="bg-dp-paper text-dp-ink sm:rounded-3xl sm:border-4 sm:border-dp-ink sm:shadow-[10px_10px_0_var(--dp-pink-hot)] sm:max-w-5xl w-full sm:max-h-[92dvh] overflow-hidden flex flex-col"
      >
        <div className="bg-dp-yellow py-3 px-5 flex items-center justify-between border-b-4 border-dp-ink">
          <h2 className="text-2xl font-black uppercase tracking-wider">📖 Phone Book</h2>
          <button type="button" className="dp-btn dp-btn-purple" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        <div className="px-4 py-2 bg-dp-paper border-b-2 border-dp-ink text-xs flex flex-wrap gap-2 items-center">
          <span className="font-black uppercase tracking-widest opacity-70">Legend:</span>
          <span className="dp-chip dp-chip-pink text-[10px]">Drawn</span>
          <span className="dp-chip text-[10px]">👂 Heard</span>
          <span className="font-bold text-dp-magenta">strike</span>
          <span className="opacity-70">= you ruled it out on your clue card</span>
        </div>

        <div className="p-4 overflow-y-auto dp-scroll space-y-5">
          {heardLog.length > 0 && (
            <section className="bg-dp-mint/20 border-3 border-dp-ink rounded-md p-3">
              <div className="text-sm font-black uppercase tracking-wider text-dp-magenta border-b-2 border-dp-ink pb-1 mb-2">
                📝 Calls you&apos;ve made
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm">
                {heardLog.map(({ boy, clue }) => (
                  <li key={boy.id} className="flex items-center gap-2">
                    <BoyPortrait boyId={boy.id} size={28} mode={state.mode} />
                    <span>
                      <strong>{displayName(boy, state.mode)}</strong> ({boy.phone}) — your crush is{" "}
                      <span className="text-dp-magenta font-bold">not</span> into{" "}
                      <em>{clue}</em>.
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {HANGOUTS.map((h) => {
            const boys = BOYS.filter((b) => b.hangout === h);
            return (
              <section key={h}>
                <div className="text-sm font-black uppercase tracking-wider text-dp-magenta border-b-2 border-dp-ink pb-1 mb-2">
                  {h}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {boys.map((b) => (
                    <BoyRow
                      key={b.id}
                      boy={b}
                      mode={state.mode}
                      heard={heardIds.has(b.id)}
                      marked={markedIds.has(b.id)}
                      isDrawn={drawnId === b.id}
                      struckClues={struckClues}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="px-5 py-2 text-[11px] text-center opacity-70 border-t-2 border-dp-ink">
          Close this and strike clues on your 📓 Clue Card / Notes panel.
        </div>
      </motion.div>
    </motion.div>
  );
}

function BoyRow({
  boy,
  mode,
  heard,
  marked,
  isDrawn,
  struckClues,
}: {
  boy: BoyCard;
  mode: GameMode;
  heard: boolean;
  marked: boolean;
  isDrawn: boolean;
  struckClues: Set<string>;
}) {
  const attrs: Array<{ label: string; value: string; emoji: string }> = [
    { label: "Hangout", value: boy.hangout, emoji: "📍" },
  ];
  if (boy.sport) attrs.push({ label: "Sport", value: boy.sport, emoji: "🏅" });
  if (boy.food) attrs.push({ label: "Food", value: boy.food, emoji: "🍕" });
  attrs.push({ label: "Wears", value: boy.clothing, emoji: "👕" });

  return (
    <div
      className={`flex items-stretch gap-2 p-2 rounded-md border-2 border-dp-ink ${
        marked ? "bg-dp-pink-hot/15 opacity-70" : isDrawn ? "bg-dp-yellow/40" : "bg-white"
      }`}
    >
      <BoyPortrait boyId={boy.id} size={48} mode={mode} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1.5">
          <div className={`font-black truncate ${marked ? "line-through" : ""}`}>{displayName(boy, mode)}</div>
          <div className="text-[11px] font-mono opacity-80 shrink-0">{boy.phone}</div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {attrs.map((a) => {
            const isStruck = struckClues.has(a.value);
            return (
              <span
                key={a.label}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${
                  isStruck
                    ? "border-dp-magenta bg-dp-pink-hot/20 text-dp-magenta line-through font-bold"
                    : "border-dp-ink bg-dp-paper text-dp-ink"
                }`}
                title={`${a.label}: ${a.value}${isStruck ? " — you've ruled this out" : ""}`}
              >
                <span>{a.emoji}</span>
                <span className="truncate" style={{ maxWidth: 90 }}>{a.value}</span>
              </span>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {isDrawn && <span className="dp-chip dp-chip-pink text-[9px]">Drawn now</span>}
          {heard && <span className="dp-chip text-[9px]">👂 Called</span>}
          {marked && <span className="dp-chip dp-chip-purple text-[9px]">✕ Ruled out</span>}
        </div>
      </div>
    </div>
  );
}
