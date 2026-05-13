"use client";

import { motion, AnimatePresence } from "framer-motion";

export type TurnStep = "drew" | "dial" | "talk" | "wrap";

type Props = {
  step: TurnStep;
  /** When true, render the larger wizard layout with the current-step instruction. */
  verbose?: boolean;
};

const STEPS: Array<{ id: TurnStep; emoji: string; label: string; instruction: string }> = [
  {
    id: "drew",
    emoji: "🎴",
    label: "Drew",
    instruction: "You drew a boy card. Read his name + phone number, then make the call.",
  },
  {
    id: "dial",
    emoji: "📞",
    label: "Dial",
    instruction: "Tap the big pink Call button to dial the boy. You can only dial the boy you drew.",
  },
  {
    id: "talk",
    emoji: "💬",
    label: "Talk",
    instruction: "Listen for the clue — what's your crush NOT into? Then hang up.",
  },
  {
    id: "wrap",
    emoji: "📓",
    label: "Notes",
    instruction:
      "Mark the clue on your clue card, optionally sabotage the next player with a PvP card, then hand off the phone.",
  },
];

export function TurnSteps({ step, verbose }: Props) {
  const idx = STEPS.findIndex((s) => s.id === step);
  const current = STEPS[Math.max(0, idx)];

  return (
    <div className="space-y-1.5">
      <ol className="flex items-stretch gap-1 sm:gap-2">
        {STEPS.map((s, i) => {
          const isDone = i < idx;
          const isCurrent = i === idx;
          return (
            <motion.li
              key={s.id}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`flex-1 px-2 py-1.5 rounded-md border-2 border-dp-ink text-center text-[10px] sm:text-[11px] font-black uppercase tracking-tight ${
                isCurrent
                  ? "bg-dp-pink-hot text-white shadow-[3px_3px_0_var(--dp-ink)]"
                  : isDone
                  ? "bg-dp-mint/60 text-dp-ink line-through opacity-70"
                  : "bg-dp-paper text-dp-ink opacity-60"
              }`}
            >
              <span className="text-sm sm:text-base block leading-none">{s.emoji}</span>
              <span className="leading-none mt-0.5 block">
                {i + 1}. {s.label}
              </span>
            </motion.li>
          );
        })}
      </ol>

      {verbose && (
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ y: -4, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 4, opacity: 0 }}
            className="dp-card px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{current.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-widest opacity-70 font-black">
                  Step {idx + 1} of {STEPS.length} · {current.label}
                </div>
                <div className="text-sm font-bold text-dp-ink leading-snug">
                  {current.instruction}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
