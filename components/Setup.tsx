"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { unlockAudio } from "@/lib/audio/speech";
import { WebcamCapture } from "./WebcamCapture";

export type PlayerDraft = {
  name: string;
  rawPhotoDataUrl?: string;
};

type Props = {
  onStart: (numPlayers: number, drafts: PlayerDraft[]) => void;
};

type Step =
  | { kind: "intro" }
  | { kind: "count" }
  | { kind: "name"; playerIdx: number }
  | { kind: "photo"; playerIdx: number }
  | { kind: "review" };

const stepVariants = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.97 },
};

export function Setup({ onStart }: Props) {
  const [step, setStep] = useState<Step>({ kind: "intro" });
  const [numPlayers, setNumPlayers] = useState(2);
  const [drafts, setDrafts] = useState<PlayerDraft[]>(() =>
    Array.from({ length: 4 }, () => ({ name: "" })),
  );

  const setDraft = (i: number, patch: Partial<PlayerDraft>) =>
    setDrafts((cur) => cur.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const finalName = (i: number) => drafts[i].name.trim() || `Player ${i + 1}`;

  const advanceFromName = (i: number) =>
    setStep({ kind: "photo", playerIdx: i });

  const advanceFromPhoto = (i: number) => {
    if (i + 1 < numPlayers) setStep({ kind: "name", playerIdx: i + 1 });
    else setStep({ kind: "review" });
  };

  const submit = () => {
    const playable: PlayerDraft[] = Array.from({ length: numPlayers }).map((_, i) => ({
      name: finalName(i),
      rawPhotoDataUrl: drafts[i].rawPhotoDataUrl,
    }));
    onStart(numPlayers, playable);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="dp-confetti relative w-full max-w-3xl">
        <motion.header
          className="text-center mb-4 relative"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mb-3 relative w-full max-w-md aspect-[16/9] rounded-2xl overflow-hidden border-4 border-dp-ink shadow-[8px_8px_0_var(--dp-pink-hot)]"
          >
            <Image src="/assets/cover.jpg" alt="Dream Phone" fill priority className="object-cover" />
          </motion.div>
          <motion.p
            className="italic opacity-80 mt-2"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            Who&apos;s your secret crush? Call the boys, collect clues, solve the mystery.
          </motion.p>
        </motion.header>

        <div className="relative">
          <AnimatePresence mode="wait">
            {step.kind === "intro" && (
              <motion.div
                key="intro"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="dp-card-hot p-6 dp-rotate-3"
              >
                <h2 className="text-2xl font-black uppercase mb-2">How to Play</h2>
                <ul className="space-y-2 text-sm sm:text-base">
                  <li>✨ One of the 24 boys is your secret crush, chosen at random.</li>
                  <li>📞 On your turn, draw a card and dial the boy on the Dream Phone.</li>
                  <li>👂 He&apos;ll spill a clue — what your crush is <em>not</em> into.</li>
                  <li>📓 Cross clues off your Clue Card to narrow it down.</li>
                  <li>🃏 Multiplayer: each player gets one Speakerphone, one Share-a-Secret, and one Mom Says Hang Up — use them on the current dialer.</li>
                  <li>💘 First to press Solve and dial the crush wins.</li>
                </ul>
                <div className="mt-5 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: -1 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="dp-btn dp-btn-teal"
                    onClick={() => {
                      unlockAudio();
                      setStep({ kind: "count" });
                    }}
                  >
                    Let&apos;s Play →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step.kind === "count" && (
              <motion.div
                key="count"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="dp-card-teal p-6 dp-rotate-2"
              >
                <h2 className="text-2xl font-black uppercase mb-3">How many players?</h2>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((n) => (
                    <motion.button
                      key={n}
                      whileHover={{ y: -3, scale: 1.04 }}
                      whileTap={{ y: 2, scale: 0.95 }}
                      animate={numPlayers === n ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                      type="button"
                      onClick={() => setNumPlayers(n)}
                      className={`dp-key ${numPlayers === n ? "dp-key-pink" : ""}`}
                    >
                      {n}
                    </motion.button>
                  ))}
                </div>
                <div className="mt-5 flex justify-between">
                  <button type="button" className="dp-btn dp-btn-purple" onClick={() => setStep({ kind: "intro" })}>
                    ← Back
                  </button>
                  <button
                    type="button"
                    className="dp-btn dp-btn-pink"
                    onClick={() => setStep({ kind: "name", playerIdx: 0 })}
                  >
                    Next →
                  </button>
                </div>
              </motion.div>
            )}

            {step.kind === "name" && (
              <motion.div
                key={`name-${step.playerIdx}`}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="dp-card p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="dp-chip dp-chip-pink">
                    P{step.playerIdx + 1} of {numPlayers}
                  </span>
                  <span className="text-[11px] uppercase opacity-60">Step 1 of 2</span>
                </div>
                <h2 className="text-2xl font-black uppercase mb-1 text-dp-magenta">What&apos;s your name?</h2>
                <p className="text-xs opacity-80 mb-4">
                  Next, you&apos;ll take a photo — it becomes your 90s yearbook player card.
                </p>
                <input
                  autoFocus
                  value={drafts[step.playerIdx].name}
                  onChange={(e) => setDraft(step.playerIdx, { name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") advanceFromName(step.playerIdx);
                  }}
                  placeholder={`Player ${step.playerIdx + 1} name`}
                  className="w-full px-4 py-3 rounded-full border-3 border-dp-ink bg-white text-dp-ink text-lg"
                />
                <div className="mt-5 flex justify-between">
                  <button
                    type="button"
                    className="dp-btn dp-btn-purple"
                    onClick={() =>
                      step.playerIdx === 0
                        ? setStep({ kind: "count" })
                        : setStep({ kind: "photo", playerIdx: step.playerIdx - 1 })
                    }
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    className="dp-btn dp-btn-pink"
                    onClick={() => advanceFromName(step.playerIdx)}
                  >
                    📸 Photo →
                  </button>
                </div>
              </motion.div>
            )}

            {step.kind === "review" && (
              <motion.div
                key="review"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="dp-card p-5"
              >
                <h2 className="text-xl font-black uppercase text-dp-magenta mb-3">Ready?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: numPlayers }).map((_, i) => {
                    const photo = drafts[i].rawPhotoDataUrl;
                    return (
                      <div key={i} className="border-3 border-dp-ink rounded-md bg-white p-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="dp-chip dp-chip-teal text-[10px]">P{i + 1}</span>
                          <button
                            type="button"
                            className="dp-chip dp-chip-pink text-[10px] py-0.5 px-1.5"
                            onClick={() => setStep({ kind: "photo", playerIdx: i })}
                            aria-label={`Retake photo for player ${i + 1}`}
                          >
                            ↻ Retake
                          </button>
                        </div>
                        <div className="relative w-full aspect-[3/4] rounded overflow-hidden border-2 border-dp-ink bg-dp-paper">
                          {photo ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-dp-ink/60 text-3xl">
                              📷
                            </div>
                          )}
                        </div>
                        <div className="font-bold text-sm text-dp-ink truncate mt-1">{finalName(i)}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 flex justify-between">
                  <button
                    type="button"
                    className="dp-btn dp-btn-purple"
                    onClick={() => setStep({ kind: "photo", playerIdx: numPlayers - 1 })}
                  >
                    ← Back
                  </button>
                  <button type="button" className="dp-btn dp-btn-pink text-lg px-6" onClick={submit}>
                    Start Game ✨
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <a
            href="/print"
            target="_blank"
            rel="noopener noreferrer"
            className="dp-btn dp-btn-teal text-xs py-1.5 px-3"
          >
            🖨 Print Cards / PDF
          </a>
        </div>
        <footer className="text-center text-xs opacity-60 mt-3 font-black uppercase tracking-widest">
          Cockafellow Games
        </footer>
      </div>

      {/* Fullscreen per-player capture for the current photo step */}
      <AnimatePresence>
        {step.kind === "photo" && (
          <motion.div
            key={`photo-${step.playerIdx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dp-ink overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b-4 border-dp-pink-hot bg-dp-ink">
              <div className="flex items-center gap-3 min-w-0">
                <span className="dp-chip dp-chip-pink shrink-0">
                  P{step.playerIdx + 1} of {numPlayers}
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-dp-cream truncate">
                  {finalName(step.playerIdx)}
                </h2>
              </div>
              <button
                type="button"
                className="dp-btn dp-btn-purple text-sm py-1.5 px-3 shrink-0"
                onClick={() => setStep({ kind: "name", playerIdx: step.playerIdx })}
              >
                ← Name
              </button>
            </div>
            <div className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-6">
              <div className="w-full max-w-md">
                <WebcamCapture
                  key={`cap-${step.playerIdx}`}
                  onCapture={(dataUrl) => {
                    setDraft(step.playerIdx, { rawPhotoDataUrl: dataUrl });
                    advanceFromPhoto(step.playerIdx);
                  }}
                  onCancel={() => advanceFromPhoto(step.playerIdx)}
                />
              </div>
            </div>
            <div className="bg-dp-pink-hot/10 px-4 py-3 text-center text-xs text-dp-cream flex flex-wrap items-center justify-center gap-3">
              <span className="opacity-80">
                Tap <strong>📸 Snap!</strong> when ready — or
              </span>
              <button
                type="button"
                className="dp-btn dp-btn-teal text-sm py-2 px-4"
                onClick={() => advanceFromPhoto(step.playerIdx)}
              >
                Skip photo →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
