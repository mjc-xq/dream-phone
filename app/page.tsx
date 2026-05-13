"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Setup, type PlayerDraft } from "@/components/Setup";
import { Handoff } from "@/components/Handoff";
import { DrawnCard } from "@/components/DrawnCard";
import { NotePanel } from "@/components/NotePanel";
import { PhoneBook } from "@/components/PhoneBook";
import { SolveModal } from "@/components/SolveModal";
import { CallScreen } from "@/components/CallScreen";
import { Confetti } from "@/components/Confetti";
import { PlayerCard } from "@/components/PlayerCard";
import { BoyGallery } from "@/components/BoyGallery";
import { TurnSteps, type TurnStep } from "@/components/TurnSteps";
import { PostCall } from "@/components/PostCall";
import { AffectingTurn } from "@/components/AffectingTurn";
import { PrintPlayerCardsButton } from "@/components/PrintPlayerCardsButton";
import { CrushReveal } from "@/components/CrushReveal";
import {
  completeTurn,
  currentPlayer,
  dial,
  dismissHandoff,
  generatePlayerPhone,
  newGame,
  playPvpEndOfTurn,
  solve,
  toggleMarkedBoy,
  toggleStrike,
} from "@/lib/game/engine";
import { playClick, playWin, unlockAudio } from "@/lib/audio/speech";
import type { GameState } from "@/lib/game/types";
import { PVP_LABELS, type PvpType } from "@/lib/game/cards";

type Overlay = null | "solve" | "call" | "phonebook";
type MobileTab = "play" | "notes" | "boys" | "log";

const GAME_STORAGE_KEY = "dp_game_state";

export default function Page() {
  const [state, setState] = useState<GameState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [callLogIds, setCallLogIds] = useState<string[]>([]);
  const [tab, setTab] = useState<MobileTab>("play");
  const [transformBanner, setTransformBanner] = useState<string | null>(null);
  const [postCall, setPostCall] = useState(false);
  const transformedRef = useRef(new Set<number>());
  // Bumped on every `start()` so in-flight portrait transforms from a previous
  // game don't write their result onto a freshly-started game's players.
  const gameSessionRef = useRef(0);

  // Restore saved game on mount so a tab-away (e.g. /print) doesn't wipe progress.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(GAME_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GameState;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState(parsed);
      }
    } catch {
      // ignore corrupted save
    }
    setHydrated(true);
  }, []);

  // Persist game state on every change.
  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;
    try {
      if (state) window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
      else window.localStorage.removeItem(GAME_STORAGE_KEY);
    } catch {
      // ignore storage quota / private mode
    }
  }, [state, hydrated]);

  // Keep the print snapshot in sync with the current game's players so the
  // /print/players and /print/notepad routes always show THIS game, not a
  // stale one from before. Snapshot cleared on Start Over (state === null).
  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;
    try {
      if (!state) {
        window.localStorage.removeItem("dp_print_players");
        return;
      }
      const snap = state.players
        .filter((p) => p.card)
        .map((p) => ({
          id: p.id,
          name: p.name,
          card: p.card,
          pvpHand: [],
          collectedClues: [],
          struckClues: [],
          markedBoys: [],
          guessedThisTurn: false,
        }));
      window.localStorage.setItem("dp_print_players", JSON.stringify(snap));
    } catch {
      // ignore
    }
  }, [state?.players, state, hydrated]);

  const start = (n: number, drafts: PlayerDraft[]) => {
    unlockAudio();
    transformedRef.current.clear();
    gameSessionRef.current += 1;
    const session = gameSessionRef.current;
    const seedCards = drafts.map((d) =>
      d.rawPhotoDataUrl
        ? {
            photoDataUrl: d.rawPhotoDataUrl,
            hangout: "Crosstown Mall",
            cardColor: "yellow",
            isPlaceholder: true,
          }
        : undefined,
    );
    const next = newGame(n, drafts.map((d) => d.name), seedCards);
    setState(next);
    drafts.forEach((d, i) => {
      if (d.rawPhotoDataUrl) transformPortrait(i, d.rawPhotoDataUrl, session);
    });
  };

  async function transformPortrait(playerIdx: number, dataUrl: string, session: number) {
    if (transformedRef.current.has(playerIdx)) return;
    transformedRef.current.add(playerIdx);
    const b64 = dataUrl.split(",")[1];
    try {
      const r = await fetch("/api/transform-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: b64 }),
      });
      if (!r.ok) {
        if (session !== gameSessionRef.current) return;
        const txt = await r.text().catch(() => "");
        if (r.status === 429 || /quota|spending cap/i.test(txt)) {
          setTransformBanner(
            "Photo transform paused — Gemini billing cap reached. You'll see your raw photo until it resets.",
          );
        } else {
          setTransformBanner("Photo transform failed — using your raw photo instead.");
        }
        setState((cur) => {
          if (!cur) return cur;
          return {
            ...cur,
            players: cur.players.map((p, i) =>
              i === playerIdx && p.card ? { ...p, card: { ...p.card, isPlaceholder: false } } : p,
            ),
          };
        });
        return;
      }
      const data = await r.json();
      if (session !== gameSessionRef.current) return;
      setState((cur) => {
        if (!cur) return cur;
        return {
          ...cur,
          players: cur.players.map((p, i) =>
            i === playerIdx
              ? {
                  ...p,
                  card: {
                    photoDataUrl: `data:${data.mimeType ?? "image/png"};base64,${data.imageBase64}`,
                    hangout: data.hangout ?? p.card?.hangout ?? "Crosstown Mall",
                    cardColor: data.cardColor ?? p.card?.cardColor ?? "yellow",
                    phone: p.card?.phone ?? generatePlayerPhone(new Set()),
                    isPlaceholder: false,
                  },
                }
              : p,
          ),
        };
      });
    } catch {
      if (session !== gameSessionRef.current) return;
      setState((cur) => {
        if (!cur) return cur;
        return {
          ...cur,
          players: cur.players.map((p, i) =>
            i === playerIdx && p.card ? { ...p, card: { ...p.card, isPlaceholder: false } } : p,
          ),
        };
      });
    }
  }

  useEffect(() => {
    if (state?.phase === "gameOver") playWin();
  }, [state?.phase]);

  // Solo play: auto-advance past the handoff screen. Done in an effect so it
  // doesn't fire as a side effect during render (which would re-run under
  // React Strict Mode and after every unrelated state update). The setStates
  // here are deliberate one-shot transitions, not derived state.
  const soloHandoff = state?.phase === "handoff" && state.numPlayers === 1;
  useEffect(() => {
    if (!soloHandoff) return;
    unlockAudio();
    /* eslint-disable react-hooks/set-state-in-effect */
    setTab("play");
    setPostCall(false);
    setState((cur) => (cur && cur.phase === "handoff" ? dismissHandoff(cur) : cur));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [soloHandoff]);

  // Avoid SSR/hydration flash where Setup renders briefly before the saved
  // state is restored — render nothing until the localStorage check is done.
  if (!hydrated) return null;
  if (!state) return <Setup onStart={start} />;
  if (state.phase === "gameOver")
    return <GameOver state={state} onPlayAgain={() => setState(null)} />;

  const player = currentPlayer(state);

  if (state.phase === "handoff") {
    // Solo handoff is dismissed by the effect above — render nothing while it
    // transitions to "drawn".
    if (state.numPlayers === 1) return null;
    return (
      <Handoff
        playerName={player.name}
        player={player}
        onReady={() => {
          unlockAudio();
                setTab("play");
          setPostCall(false);
          setState(dismissHandoff(state));
        }}
      />
    );
  }

  const drawn = state.drawnBoyId !== null ? state.board[state.drawnBoyId] : null;
  const nextPlayerName =
    state.numPlayers > 1
      ? state.players[(state.currentPlayerIdx + 1) % state.numPlayers].name
      : player.name;

  const handleDial = (phone: string) => {
    if (!drawn) return;
    playClick();
    const prevLen = state.log.length;
    const { state: next, outcome } = dial(state, phone);
    if (outcome === "wrong_number") {
      setState(next);
      return;
    }
    if (outcome === "skipped") {
      // Mom Hang Up — no call took place. Skip CallScreen, advance turn.
      setState(completeTurn(next));
      return;
    }
    const newLogIds = next.log.slice(prevLen).map((e) => e.id);
    // currentPlayerIdx = the dialer, drawnBoyId = null, phase = "calling".
    // Turn doesn't advance until the call screen is dismissed.
    setState(next);
    if (newLogIds.length > 0) {
      setCallLogIds(newLogIds);
      setOverlay("call");
    } else {
      // Defensive: dial(ok) always pushes log entries, but if not, advance.
      setState((cur) => (cur ? completeTurn(cur) : cur));
    }
  };

  const handleCallDone = () => {
    setOverlay(null);
    setCallLogIds([]);
    // Don't auto-advance — give the player a chance to mark their notepad.
    setPostCall(true);
  };

  const handleFinishTurn = () => {
    setPostCall(false);
    setState((cur) => (cur ? completeTurn(cur) : cur));
  };

  const handleEndPvp = (type: PvpType) => {
    playClick();
    setState((s) => (s ? playPvpEndOfTurn(s, type) : s));
  };

  const handleSolveGuess = (boyId: number) => {
    const { state: next, correct, locked } = solve(state, boyId);
    if (!locked) setState(next);
    return {
      correct,
      locked,
      guessedName: state.board[boyId].name,
    };
  };

  if (postCall) {
    return (
      <div className="min-h-dvh dp-grid dp-board-bg">
        <div
          className="max-w-3xl mx-auto px-3 sm:px-6"
          style={{
            paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
          }}
        >
          <header className="mb-3 flex items-start gap-3 flex-wrap">
            <div className="shrink-0">
              <PlayerCard player={player} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="dp-title-stroke text-2xl sm:text-3xl">Wrap Up</h1>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="dp-chip dp-chip-pink">{player.name}</span>
                <span className="dp-chip dp-chip-teal">Step 4 of 4</span>
              </div>
              <div className="mt-2">
                <TurnSteps step="wrap" verbose />
              </div>
            </div>
          </header>
          <PostCall
            state={state}
            onToggleClue={(clue) => setState((s) => (s ? toggleStrike(s, clue) : s))}
            onToggleBoy={(id) => setState((s) => (s ? toggleMarkedBoy(s, id) : s))}
            onPlayEndPvp={handleEndPvp}
            nextPlayerName={nextPlayerName}
            onFinish={handleFinishTurn}
          />
        </div>
      </div>
    );
  }

  const turnStep: TurnStep = overlay === "call" ? "talk" : drawn ? "dial" : "drew";

  return (
    <>
    <div className="min-h-dvh dp-grid dp-board-bg">
      <div
        className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 lg:pb-6"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 5.5rem)",
        }}
      >
        <motion.header
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 230, damping: 22 }}
          className="mb-3 flex items-start gap-3 flex-wrap"
        >
          <div className="shrink-0">
            <PlayerCard player={player} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="dp-title-stroke text-2xl sm:text-4xl">Dream Phone</h1>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <motion.span
                key={player.name + state.currentPlayerIdx}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="dp-chip dp-chip-pink"
              >
                {player.name}&apos;s turn
              </motion.span>
              <span className="dp-chip dp-chip-purple">P{player.id}/{state.numPlayers}</span>
              <span className="dp-chip">Deck {state.deck.length}</span>
              <span className="dp-chip dp-chip-teal">Discard {state.discard.length}</span>
              <a
                href="/print"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    try {
                      const data = state.players
                        .filter((p) => p.card)
                        .map((p) => ({
                          id: p.id,
                          name: p.name,
                          card: p.card,
                          pvpHand: [],
                          collectedClues: [],
                          struckClues: [],
                          markedBoys: [],
                          guessedThisTurn: false,
                        }));
                      window.localStorage.setItem("dp_print_players", JSON.stringify(data));
                    } catch {}
                  }
                }}
                className="dp-chip dp-chip-teal"
                title="Print / PDF"
              >
                🖨 Print
              </a>
            </div>
            <div className="mt-2">
              <TurnSteps step={turnStep} verbose />
            </div>
            {transformBanner && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xs px-3 py-1.5 rounded-md border-2 border-dp-ink bg-dp-yellow text-dp-ink flex items-center justify-between gap-2"
              >
                <span>{transformBanner}</span>
                <button
                  type="button"
                  className="font-black"
                  onClick={() => setTransformBanner(null)}
                >
                  ✕
                </button>
              </motion.div>
            )}
          </div>
        </motion.header>

        <AffectingTurn state={state} />

        {/* DESKTOP: 3 columns. MOBILE: tabs over a single canvas. */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 mt-3">
          <div className="space-y-3">
            <DrawnCardBlock state={state} drawn={drawn} onCall={handleDial} player={player} />
            <BoyGallery state={state} />
          </div>
          <div className="space-y-3">
            <ActionBar
              state={state}
              onPhoneBook={() => setOverlay("phonebook")}
              onSolve={() => setOverlay("solve")}
              onRedial={() => replayLastCall(state, setCallLogIds, setOverlay)}
              onQuit={() => {
                if (confirm("Quit and start over?")) setState(null);
              }}
              hasLastCall={state.lastDialedId !== null}
            />
            <GameLog state={state} />
          </div>
          <div>
            <NotePanel
              state={state}
              onToggleClue={(clue) => setState((s) => (s ? toggleStrike(s, clue) : s))}
              onToggleBoy={(id) => setState((s) => (s ? toggleMarkedBoy(s, id) : s))}
            />
          </div>
        </div>

        <div className="lg:hidden space-y-3 mt-3">
          <DrawnCardBlock state={state} drawn={drawn} onCall={handleDial} player={player} />

          <AnimatePresence mode="wait">
            {tab === "play" && (
              <motion.div key="play" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ActionBar
                  state={state}
                  onPhoneBook={() => setOverlay("phonebook")}
                  onSolve={() => setOverlay("solve")}
                  onRedial={() => replayLastCall(state, setCallLogIds, setOverlay)}
                  onQuit={() => {
                    if (confirm("Quit and start over?")) setState(null);
                  }}
                  hasLastCall={state.lastDialedId !== null}
                />
              </motion.div>
            )}
            {tab === "notes" && (
              <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <NotePanel
                  state={state}
                  onToggleClue={(clue) => setState((s) => (s ? toggleStrike(s, clue) : s))}
                  onToggleBoy={(id) => setState((s) => (s ? toggleMarkedBoy(s, id) : s))}
                />
              </motion.div>
            )}
            {tab === "boys" && (
              <motion.div key="boys" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BoyGallery state={state} />
              </motion.div>
            )}
            {tab === "log" && (
              <motion.div key="log" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GameLog state={state} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

      {/* Mobile bottom tab bar — fixed, respects safe area. Hidden when an overlay is up. */}
      <nav
        className={`lg:hidden fixed bottom-0 inset-x-0 z-30 border-t-4 border-dp-ink bg-dp-paper text-dp-ink shadow-[0_-6px_0_var(--dp-pink-hot)] transition-transform ${
          overlay ? "translate-y-full" : "translate-y-0"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-4">
          {[
            { id: "play" as const, label: "📞", sub: "Play" },
            { id: "notes" as const, label: "📓", sub: "Clue" },
            { id: "boys" as const, label: "👬", sub: "Boys" },
            { id: "log" as const, label: "📜", sub: "Log" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`py-2 text-xs font-black uppercase tracking-tight flex flex-col items-center gap-0.5 ${
                tab === t.id ? "bg-dp-pink-hot text-white" : "hover:bg-dp-ink/5"
              }`}
            >
              <span className="text-lg leading-none">{t.label}</span>
              <span className="text-[10px] leading-none">{t.sub}</span>
            </button>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {overlay === "phonebook" && (
          <PhoneBook key="phonebook" state={state} onClose={() => setOverlay(null)} />
        )}
        {overlay === "solve" && (
          <SolveModal
            key="solve"
            onGuess={handleSolveGuess}
            onClose={() => setOverlay(null)}
            alreadyGuessedThisTurn={player.guessedThisTurn && state.numPlayers > 1}
          />
        )}
        {overlay === "call" && callLogIds.length > 0 && (
          <CallScreen
            key="call"
            state={state}
            callLogIds={callLogIds}
            onDone={handleCallDone}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ActionBar({
  state,
  onPhoneBook,
  onSolve,
  onRedial,
  onQuit,
  hasLastCall,
}: {
  state: GameState;
  onPhoneBook: () => void;
  onSolve: () => void;
  onRedial: () => void;
  onQuit: () => void;
  hasLastCall: boolean;
}) {
  // Context-aware: only show buttons useful at this step. The primary action
  // ('Make the Call') lives on the drawn-card block; everything else here is
  // reference / alternative actions.
  return (
    <div className="dp-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="dp-chip dp-chip-pink">While You Decide</div>
        <button
          type="button"
          onClick={onQuit}
          className="dp-btn dp-btn-purple text-[11px] py-1 px-2"
          title="Abandon this game and return to setup"
        >
          ↺ Start Over
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          className="dp-btn dp-btn-teal"
          onClick={onPhoneBook}
        >
          📖 Phone Book
        </motion.button>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          className="dp-btn dp-btn-purple"
          onClick={onSolve}
        >
          💘 Solve
        </motion.button>
      </div>
      {hasLastCall && (
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          className="dp-btn w-full"
          onClick={onRedial}
        >
          ↻ Redial last clue
        </motion.button>
      )}
      <div className="pt-2 border-t-2 border-dashed border-dp-ink/30 flex justify-center">
        <PrintPlayerCardsButton state={state} compact />
      </div>
    </div>
  );
}

function DrawnCardBlock({
  state,
  drawn,
  onCall,
  player,
}: {
  state: GameState;
  drawn: ReturnType<typeof currentPlayer> extends never ? never : GameState["board"][number] | null;
  onCall: (phone: string) => void;
  player: ReturnType<typeof currentPlayer>;
}) {
  return (
    <div className="dp-card p-4">
      {/* Step ribbon */}
      <ol className="mb-3 grid grid-cols-3 gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-dp-ink">
        <li className="flex items-center gap-1 px-2 py-1 rounded-md bg-dp-mint/40 border-2 border-dp-ink">
          <span className="text-base">①</span>
          <span>Draw a card</span>
        </li>
        <li className="flex items-center gap-1 px-2 py-1 rounded-md bg-dp-yellow border-2 border-dp-ink">
          <span className="text-base">②</span>
          <span>Read his number</span>
        </li>
        <li className="flex items-center gap-1 px-2 py-1 rounded-md bg-dp-pink-hot/30 border-2 border-dp-ink">
          <span className="text-base">③</span>
          <span>Dial that boy</span>
        </li>
      </ol>

      {drawn ? (
        <>
          <DrawnCard card={drawn} size="md" deckSize={state.deck.length} />
          <div className="mt-8 sm:mt-9 text-center text-xs sm:text-sm font-bold text-dp-magenta px-2">
            You drew <span className="uppercase">{drawn.name}</span>. Dial{" "}
            <span className="font-mono">{drawn.phone}</span> on the Dream Phone.
          </div>
          {!state.pending.momHangUp && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="dp-btn dp-btn-pink w-full mt-3 text-lg py-4"
              onClick={() => onCall(drawn.phone)}
            >
              📞 Call {drawn.name} ({drawn.phone})
            </motion.button>
          )}
          {state.pending.momHangUp && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="dp-btn dp-btn-purple w-full mt-3 text-base py-3"
              onClick={() => onCall(drawn.phone)}
            >
              📵 Mom hung up — pass turn
            </motion.button>
          )}
        </>
      ) : (
        <p className="text-dp-ink italic text-center py-8">No card drawn yet.</p>
      )}

      {player.pvpHand.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 items-center justify-center pt-3 border-t-2 border-dashed border-dp-ink/30">
          <span className="text-[10px] uppercase text-dp-ink/70">Your PvP:</span>
          {player.pvpHand.map((c) => (
            <span key={c.id} className="dp-chip dp-chip-pink text-[10px]">
              ⚡ {PVP_LABELS[c.type]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function GameLog({ state, className }: { state: GameState; className?: string }) {
  return (
    <div className={`dp-card p-3 text-sm ${className ?? ""}`}>
      <div className="dp-chip mb-2">Game Log</div>
      <ul className="max-h-40 overflow-y-auto dp-scroll space-y-1">
        <AnimatePresence initial={false}>
          {state.log.slice(-15).map((e) => (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={tonClasses(e.tone)}
            >
              {e.text}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function replayLastCall(
  state: GameState,
  setCallLogIds: (ids: string[]) => void,
  setOverlay: (o: Overlay) => void,
) {
  if (state.lastDialedId === null) return;
  const lastIds: string[] = [];
  for (let i = state.log.length - 1; i >= 0 && lastIds.length < 8; i--) {
    const e = state.log[i];
    if (e.tone === "boy" || e.tone === "loud" || e.tone === "quiet") {
      lastIds.unshift(e.id);
    } else if (lastIds.length > 0) {
      break;
    }
  }
  if (lastIds.length === 0) return;
  setCallLogIds(lastIds);
  setOverlay("call");
}

function tonClasses(tone: string) {
  switch (tone) {
    case "loud":
      return "font-black text-dp-yellow";
    case "quiet":
      return "text-dp-pink-hot italic";
    case "boy":
      return "italic text-dp-cyan";
    case "win":
      return "font-black text-dp-mint";
    default:
      return "opacity-80";
  }
}

function GameOver({ state, onPlayAgain }: { state: GameState; onPlayAgain: () => void }) {
  // Just keep useMemo to silence the unused warning on import.
  void useMemo;
  return (
    <div className="min-h-dvh flex items-center justify-center p-6 relative overflow-hidden">
      <Confetti count={120} />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="relative max-w-3xl w-full text-center space-y-5"
      >
        <CrushReveal state={state} />

        <motion.button
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 3.5, type: "spring", stiffness: 220 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          type="button"
          className="dp-btn dp-btn-pink text-xl"
          onClick={() => {
            if (typeof window !== "undefined") {
              try { window.localStorage.removeItem("dp_game_state"); } catch {}
            }
            onPlayAgain();
          }}
        >
          🔄 Play Again
        </motion.button>
      </motion.div>
    </div>
  );
}
