"use client";

import { motion } from "framer-motion";

export type TurnStep = "drew" | "dial" | "talk" | "wrap";

type Props = {
  step: TurnStep;
};

const STEPS: Array<{ id: TurnStep; emoji: string; label: string }> = [
  { id: "drew", emoji: "🎴", label: "Drew" },
  { id: "dial", emoji: "📞", label: "Dial" },
  { id: "talk", emoji: "💬", label: "Talk" },
  { id: "wrap", emoji: "📓", label: "Notes" },
];

export function TurnSteps({ step }: Props) {
  const idx = STEPS.findIndex((s) => s.id === step);
  return (
    <ol className="flex items-stretch gap-1 sm:gap-2">
      {STEPS.map((s, i) => {
        const isDone = i < idx;
        const isCurrent = i === idx;
        return (
          <motion.li
            key={s.id}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`flex-1 px-2 py-1.5 rounded-md border-2 border-dp-ink text-center text-[10px] sm:text-[11px] font-black uppercase tracking-tight ${
              isCurrent
                ? "bg-dp-pink-hot text-white shadow-[3px_3px_0_var(--dp-ink)]"
                : isDone
                ? "bg-dp-mint/60 text-dp-ink line-through opacity-70"
                : "bg-dp-paper text-dp-ink opacity-60"
            }`}
          >
            <span className="text-sm sm:text-base block">{s.emoji}</span>
            <span>{i + 1}. {s.label}</span>
          </motion.li>
        );
      })}
    </ol>
  );
}
