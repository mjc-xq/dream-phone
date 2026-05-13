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

const stepVariants = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.96 },
};

export function Setup({ onStart }: Props) {
  const [step, setStep] = useState<"intro" | "count" | "names" | "photos">("intro");
  const [numPlayers, setNumPlayers] = useState(2);
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const [photos, setPhotos] = useState<Array<string | undefined>>([undefined, undefined, undefined, undefined]);
  // Index of player currently in the fullscreen capture modal, or null when none.
  const [activeCapture, setActiveCapture] = useState<number | null>(null);

  const finalNames = (n: number) =>
    names.slice(0, n).map((nm, i) => nm.trim() || `Player ${i + 1}`);

  const launchCaptureFor = (i: number) => setActiveCapture(i);

  const handleCaptured = (dataUrl: string) => {
    if (activeCapture === null) return;
    const idx = activeCapture;
    setPhotos((cur) => cur.map((p, i) => (i === idx ? dataUrl : p)));
    // Auto-advance to next player who has no photo
    let next = idx + 1;
    while (next < numPlayers && photos[next]) next++;
    if (next < numPlayers) setActiveCapture(next);
    else setActiveCapture(null);
  };

  const startCaptureChain = () => {
    const firstMissing = photos.findIndex((p, i) => i < numPlayers && !p);
    if (firstMissing >= 0) setActiveCapture(firstMissing);
  };

  const submit = () => {
    const drafts: PlayerDraft[] = Array.from({ length: numPlayers }).map((_, i) => ({
      name: finalNames(numPlayers)[i],
      rawPhotoDataUrl: photos[i],
    }));
    onStart(numPlayers, drafts);
  };

  const playerNameFor = (i: number) => names[i].trim() || `Player ${i + 1}`;

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
            {step === "intro" && (
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
                      setStep("count");
                    }}
                  >
                    Let&apos;s Play →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === "count" && (
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
                  <button type="button" className="dp-btn dp-btn-purple" onClick={() => setStep("intro")}>
                    ← Back
                  </button>
                  <button type="button" className="dp-btn dp-btn-pink" onClick={() => setStep("names")}>
                    Next →
                  </button>
                </div>
              </motion.div>
            )}

            {step === "names" && (
              <motion.div
                key="names"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="dp-card p-6 dp-rotate-3"
              >
                <h2 className="text-2xl font-black uppercase mb-3 text-dp-magenta">Name your players</h2>
                <div className="space-y-3">
                  {Array.from({ length: numPlayers }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="dp-chip dp-chip-teal">P{i + 1}</span>
                      <input
                        autoFocus={i === 0}
                        value={names[i]}
                        onChange={(e) =>
                          setNames((cur) => cur.map((n, idx) => (idx === i ? e.target.value : n)))
                        }
                        placeholder={`Player ${i + 1} name`}
                        className="flex-1 px-4 py-2 rounded-full border-3 border-dp-ink bg-white text-dp-ink"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex justify-between">
                  <button type="button" className="dp-btn dp-btn-purple" onClick={() => setStep("count")}>
                    ← Back
                  </button>
                  <button type="button" className="dp-btn dp-btn-pink" onClick={() => setStep("photos")}>
                    Photos →
                  </button>
                </div>
              </motion.div>
            )}

            {step === "photos" && (
              <motion.div
                key="photos"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="dp-card p-5"
              >
                <h2 className="text-xl font-black uppercase text-dp-magenta">90s Yearbook Photos</h2>
                <p className="text-xs opacity-80 mt-1 mb-4">
                  We&apos;ll 90s-ify each one in the background. Game can start any time.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: numPlayers }).map((_, i) => {
                    const photo = photos[i];
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => launchCaptureFor(i)}
                        className="text-left border-3 border-dp-ink rounded-md bg-white p-2 hover:-translate-y-0.5 transition-transform"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="dp-chip dp-chip-teal text-[10px]">P{i + 1}</span>
                          {photo && <span className="text-[10px] opacity-70">tap to retake</span>}
                        </div>
                        <div className="relative w-full aspect-[3/4] rounded overflow-hidden border-2 border-dp-ink bg-dp-paper">
                          {photo ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-dp-ink/60">
                              <span className="text-4xl">📷</span>
                              <span className="text-[10px] font-bold mt-1">TAP TO SNAP</span>
                            </div>
                          )}
                        </div>
                        <div className="font-bold text-sm text-dp-ink truncate mt-1">{playerNameFor(i)}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-col sm:flex-row justify-between gap-2">
                  <button type="button" className="dp-btn dp-btn-purple" onClick={() => setStep("names")}>
                    ← Back
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="dp-btn dp-btn-teal"
                      onClick={startCaptureChain}
                      disabled={photos.slice(0, numPlayers).every(Boolean)}
                    >
                      📸 Snap All
                    </button>
                    <button type="button" className="dp-btn dp-btn-pink text-lg px-6" onClick={submit}>
                      Start Game ✨
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="text-center text-xs opacity-50 mt-6">
          A fan-made tribute to the 1991 board game. Not affiliated with the rights holders.
        </footer>
      </div>

      {/* Fullscreen per-player capture overlay */}
      <AnimatePresence>
        {activeCapture !== null && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dp-ink overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-4 border-dp-pink-hot bg-dp-ink">
              <div className="flex items-center gap-3 min-w-0">
                <span className="dp-chip dp-chip-pink shrink-0">
                  P{activeCapture + 1} of {numPlayers}
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-dp-cream truncate">
                  {playerNameFor(activeCapture)}
                </h2>
              </div>
              <button
                type="button"
                className="dp-btn dp-btn-purple text-sm py-1.5 px-3 shrink-0"
                onClick={() => setActiveCapture(null)}
              >
                ✕ Done
              </button>
            </div>

            {/* Capture canvas — fills viewport */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-6">
              <div className="w-full max-w-md">
                <WebcamCapture
                  key={activeCapture}
                  onCapture={handleCaptured}
                  onCancel={() => setActiveCapture(null)}
                />
              </div>
            </div>

            {/* Footer guidance */}
            <div className="bg-dp-pink-hot/10 px-4 py-2 text-center text-[11px] text-dp-cream/80">
              Tap <strong>📸 Snap!</strong> when ready. We&apos;ll process the photo in the background while you keep playing.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
