"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BOYS, displayName, type BoyCard } from "@/lib/game/cards";
import type { GameState } from "@/lib/game/types";
import { CharacterCard } from "./CharacterCard";

type Props = {
  state: GameState;
};

export function BoyGallery({ state }: Props) {
  const player = state.players[state.currentPlayerIdx];
  const heard = new Set(player.collectedClues);
  const marked = new Set(player.markedBoys);
  const drawnId = state.drawnBoyId;
  const [zoomId, setZoomId] = useState<number | null>(null);
  const zoomed = zoomId !== null ? BOYS.find((b) => b.id === zoomId) ?? null : null;

  const goPrev = () => {
    if (zoomId === null) return;
    setZoomId((id) => (id === null ? null : (id - 1 + BOYS.length) % BOYS.length));
  };
  const goNext = () => {
    if (zoomId === null) return;
    setZoomId((id) => (id === null ? null : (id + 1) % BOYS.length));
  };

  return (
    <div className="dp-card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="dp-chip dp-chip-pink">All 24 Boys</div>
        <span className="text-[10px] opacity-60 uppercase">Tap to zoom</span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
        {BOYS.map((b) => {
          const isDrawn = drawnId === b.id;
          const wasHeard = heard.has(b.id);
          const wasMarked = marked.has(b.id);
          return (
            <motion.button
              key={b.id}
              type="button"
              onClick={() => setZoomId(b.id)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: b.id * 0.01 }}
              whileHover={{ y: -2, scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              className={`relative w-full aspect-[3/4] border-2 rounded-sm overflow-hidden bg-white cursor-pointer ${
                isDrawn ? "border-dp-pink-hot ring-4 ring-dp-yellow" : "border-dp-ink"
              } ${wasMarked ? "opacity-40" : ""}`}
              aria-label={`Open ${b.name}'s card`}
            >
              <CharacterCard boy={b} mode={state.mode} size="sm" sizes="120px" />
              {wasHeard && !wasMarked && (
                <span className="absolute top-0.5 left-0.5 dp-chip text-[8px] py-0 px-1">👂</span>
              )}
              {wasMarked && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-3xl">
                  ✕
                </span>
              )}
              {isDrawn && (
                <span className="absolute bottom-0 left-0 right-0 bg-dp-pink-hot text-white text-[9px] font-black uppercase text-center py-0.5">
                  Drawn
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {zoomed && (
          <Lightbox
            key={zoomed.id}
            boy={zoomed}
            mode={state.mode}
            wasHeard={heard.has(zoomed.id)}
            wasMarked={marked.has(zoomed.id)}
            isDrawn={drawnId === zoomed.id}
            onClose={() => setZoomId(null)}
            onPrev={goPrev}
            onNext={goNext}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Lightbox({
  boy,
  mode,
  wasHeard,
  wasMarked,
  isDrawn,
  onClose,
  onPrev,
  onNext,
}: {
  boy: BoyCard;
  mode: import("@/lib/game/types").GameMode;
  wasHeard: boolean;
  wasMarked: boolean;
  isDrawn: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 sm:p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="dp-chip dp-chip-pink">{displayName(boy, mode)}</span>
          <span className="dp-chip">{boy.phone}</span>
          {isDrawn && <span className="dp-chip dp-chip-teal">Drawn</span>}
          {wasHeard && <span className="dp-chip">👂 Heard</span>}
          {wasMarked && <span className="dp-chip dp-chip-purple">✕ Crossed off</span>}
        </div>
        <button
          type="button"
          className="dp-btn dp-btn-purple text-sm py-1.5 px-3"
          onClick={onClose}
        >
          ✕ Close
        </button>
      </div>

      {/* Card hero */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
        <motion.div
          key={boy.id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
          className="relative w-full max-w-md sm:max-w-lg aspect-[3/4] bg-white rounded-xl border-4 border-dp-ink overflow-hidden"
          style={{ boxShadow: "10px 10px 0 var(--dp-pink-hot)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <CharacterCard
            boy={boy}
            mode={mode}
            size="lg"
            priority
            sizes="(max-width: 640px) 90vw, 512px"
          />
        </motion.div>
      </div>

      {/* Prev/Next */}
      <div
        className="flex items-center justify-between gap-3 px-3 sm:px-6 pb-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="dp-btn dp-btn-teal flex-1 max-w-[180px]"
          onClick={onPrev}
        >
          ← Prev
        </button>
        <button
          type="button"
          className="dp-btn dp-btn-pink flex-1 max-w-[180px]"
          onClick={onNext}
        >
          Next →
        </button>
      </div>
    </motion.div>
  );
}
