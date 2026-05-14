"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BOYS, displayName } from "@/lib/game/cards";
import type { GameMode } from "@/lib/game/types";
import { BoyPortrait } from "./BoyPortrait";

export type SolveResult = {
  correct: boolean;
  locked: boolean;
  guessedName: string;
};

type Props = {
  /** Returns the engine result so the modal can render feedback inline. */
  onGuess: (boyId: number) => SolveResult;
  onClose: () => void;
  mode: GameMode;
  /** Pre-existing lock — opening Solve when you already guessed this turn. */
  alreadyGuessedThisTurn?: boolean;
};

type Stage =
  | { kind: "pick" }
  | { kind: "confirm"; boyId: number }
  | { kind: "result"; result: SolveResult };

export function SolveModal({ onGuess, onClose, mode, alreadyGuessedThisTurn }: Props) {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<Stage>(
    alreadyGuessedThisTurn
      ? { kind: "result", result: { correct: false, locked: true, guessedName: "" } }
      : { kind: "pick" },
  );

  const filter = search.trim().toLowerCase();
  const filtered = filter
    ? BOYS.filter(
        (b) =>
          displayName(b, mode).toLowerCase().includes(filter) ||
          b.phone.includes(filter),
      )
    : BOYS;

  const submit = (boyId: number) => {
    const r = onGuess(boyId);
    if (r.correct) {
      // GameOver page takes over — just close.
      onClose();
      return;
    }
    setStage({ kind: "result", result: r });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center sm:justify-center sm:p-4"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="bg-dp-paper text-dp-ink sm:rounded-3xl sm:border-4 sm:border-dp-ink sm:shadow-[10px_10px_0_var(--dp-yellow)] sm:max-w-3xl w-full sm:max-h-[90dvh] overflow-y-auto dp-scroll flex flex-col">
        <div className="bg-dp-yellow py-3 px-5 flex items-center justify-between border-b-4 border-dp-ink">
          <h2 className="text-2xl font-black uppercase tracking-wider">Who is the Crush?</h2>
          <button type="button" className="dp-btn dp-btn-purple" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        <AnimatePresence mode="wait">
          {stage.kind === "pick" && (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-5 space-y-3"
            >
              <p className="font-bold">
                Pick the boy you think is the crush. <span className="text-dp-magenta">Wrong guess locks your solve until next turn.</span>
              </p>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name or phone…"
                className="w-full px-4 py-2 rounded-full border-3 border-dp-ink bg-white text-dp-ink"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filtered.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setStage({ kind: "confirm", boyId: b.id })}
                    className="p-2 rounded-xl border-3 border-dp-ink shadow-[4px_4px_0_var(--dp-pink-hot)] bg-white hover:-translate-y-0.5 transition-transform text-left flex items-center gap-2"
                  >
                    <BoyPortrait boyId={b.id} size={44} mode={mode} />
                    <div>
                      <div className="font-black uppercase leading-tight">{displayName(b, mode)}</div>
                      <div className="text-xs opacity-70">{b.phone}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {stage.kind === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-5 space-y-4 text-center"
            >
              <p className="text-sm uppercase tracking-widest opacity-70 font-black">
                Final answer?
              </p>
              <div className="flex items-center justify-center gap-3">
                <BoyPortrait boyId={stage.boyId} size={80} mode={mode} />
                <div className="text-left">
                  <div className="text-2xl font-black uppercase">{displayName(BOYS[stage.boyId], mode)}</div>
                  <div className="text-sm font-mono">{BOYS[stage.boyId].phone}</div>
                </div>
              </div>
              <p className="text-sm">
                Lock in <strong>{displayName(BOYS[stage.boyId], mode)}</strong> as the crush? You only get one solve per turn.
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  className="dp-btn dp-btn-purple"
                  onClick={() => setStage({ kind: "pick" })}
                >
                  ← Pick someone else
                </button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  className="dp-btn dp-btn-pink text-lg"
                  onClick={() => submit(stage.boyId)}
                >
                  💘 Solve!
                </motion.button>
              </div>
            </motion.div>
          )}

          {stage.kind === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 sm:p-8 text-center space-y-4"
            >
              {stage.result.locked ? (
                <>
                  <div className="text-6xl">🔒</div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase">
                    Solve locked
                  </h3>
                  <p className="text-sm sm:text-base opacity-90">
                    You already guessed this turn. You&apos;ll get another solve next turn.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-6xl">💔</div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-dp-magenta">
                    Wrong!
                  </h3>
                  <p className="text-base sm:text-lg">
                    <strong>{stage.result.guessedName}</strong> isn&apos;t the crush.
                  </p>
                  <p className="text-sm opacity-80">
                    Your solve is locked until next turn. Keep dialing for more clues.
                  </p>
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="dp-btn dp-btn-pink text-lg"
                onClick={onClose}
              >
                Got it
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
