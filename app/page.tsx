"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Setup, type PlayerDraft } from "@/components/Setup";
import { Handoff } from "@/components/Handoff";
import { DrawnCard } from "@/components/DrawnCard";
import { ToyPhone } from "@/components/ToyPhone";
import { NotePanel } from "@/components/NotePanel";
import { PhoneBook } from "@/components/PhoneBook";
import { OpponentPvpPanel } from "@/components/OpponentPvpPanel";
import { SolveModal } from "@/components/SolveModal";
import { CallScreen } from "@/components/CallScreen";
import { Confetti } from "@/components/Confetti";
import { PlayerCard } from "@/components/PlayerCard";
import { BoyGallery } from "@/components/BoyGallery";
import {
  completeTurn,
  currentPlayer,
  dial,
  dismissHandoff,
  generatePlayerPhone,
  newGame,
  playPvp,
  solve,
  toggleMarkedBoy,
  toggleStrike,
} from "@/lib/game/engine";
import { playClick, playWin, unlockAudio } from "@/lib/audio/speech";
import type { GameState } from "@/lib/game/types";
import { PVP_LABELS, type PvpType } from "@/lib/game/cards";

type Overlay = null | "solve" | "call" | "phonebook";
type MobileTab = "phone" | "notes" | "boys";

export default function Page() {
  const [state, setState] = useState<GameState | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [callLogIds, setCallLogIds] = useState<string[]>([]);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [tab, setTab] = useState<MobileTab>("phone");
  const [transformBanner, setTransformBanner] = useState<string | null>(null);
  const transformedRef = useRef(new Set<number>());

  const start = (n: number, drafts: PlayerDraft[]) => {
    unlockAudio();
    transformedRef.current.clear();
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
      if (d.rawPhotoDataUrl) transformPortrait(i, d.rawPhotoDataUrl);
    });
  };

  async function transformPortrait(playerIdx: number, dataUrl: string) {
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

  if (!state) return <Setup onStart={start} />;
  if (state.phase === "gameOver")
    return <GameOver state={state} onPlayAgain={() => setState(null)} />;

  const player = currentPlayer(state);

  if (state.phase === "handoff") {
    return (
      <Handoff
        playerName={player.name}
        player={player}
        onReady={() => {
          unlockAudio();
          setSpeakerOn(false);
          setTab("phone");
          setState(dismissHandoff(state));
        }}
      />
    );
  }

  const drawn = state.drawnBoyId !== null ? state.board[state.drawnBoyId] : null;

  const handleDial = (phone: string) => {
    if (!drawn) return;
    playClick();
    const prevLen = state.log.length;
    const { state: next, outcome } = dial(state, phone);
    setSpeakerOn(false);
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
    // Now actually advance the turn.
    setState((cur) => (cur ? completeTurn(cur) : cur));
  };

  const handlePlayPvp = (ownerId: number, type: PvpType) => {
    playClick();
    setState(playPvp(state, ownerId, type));
  };

  const handleSolveGuess = (boyId: number) => {
    const { state: next } = solve(state, boyId);
    setState(next);
    setOverlay(null);
  };

  const speakerPending = !!state.pending.speakerphone;
  const hasOpponentCards =
    state.numPlayers > 1 &&
    state.players.some((p) => p.id !== player.id && p.pvpHand.length > 0);

  return (
    <div className="min-h-dvh dp-grid dp-board-bg">
      <div
        className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 lg:pb-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5.5rem)" }}
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

        {/* DESKTOP: 3 columns. MOBILE: tabs over a single canvas. */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-4">
          {/* LEFT */}
          <div className="space-y-3">
            <DrawnCardBlock state={state} drawn={drawn} onCall={handleDial} player={player} speakerOn={speakerOn} />
            {hasOpponentCards && <OpponentPvpPanel state={state} onPlay={handlePlayPvp} />}
            <BoyGallery state={state} />
          </div>

          {/* CENTER */}
          <div>
            <ToyPhone
              expectedPhone={drawn?.phone}
              hint={
                state.pending.momHangUp
                  ? "Mom hung up — pass the phone"
                  : speakerPending
                  ? "Press SPEAKER first"
                  : drawn
                  ? `Dial ${drawn.name}`
                  : "—"
              }
              speakerphonePending={speakerPending}
              speakerphoneOn={speakerOn}
              onToggleSpeaker={() => setSpeakerOn((v) => !v)}
              onSolve={() => setOverlay("solve")}
              onRedial={() => replayLastCall(state, setCallLogIds, setOverlay)}
              onNewGame={() => {
                if (confirm("Quit and start over?")) setState(null);
              }}
              onCall={handleDial}
              disabled={!!state.pending.momHangUp}
            />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="button"
                className="dp-btn dp-btn-teal"
                onClick={() => setOverlay("phonebook")}
              >
                📖 Phone Book
              </button>
              <button
                type="button"
                className="dp-btn dp-btn-purple"
                onClick={() => setOverlay("solve")}
              >
                💘 Solve
              </button>
            </div>
            <GameLog state={state} className="mt-3" />
          </div>

          {/* RIGHT */}
          <div>
            <NotePanel
              state={state}
              onToggleClue={(clue) => setState((s) => (s ? toggleStrike(s, clue) : s))}
              onToggleBoy={(id) => setState((s) => (s ? toggleMarkedBoy(s, id) : s))}
            />
          </div>
        </div>

        {/* MOBILE: active thing on top — drawn card + call. Then the tabbed canvas. */}
        <div className="lg:hidden space-y-3">
          {/* Tab content first (the "thing happening" on each tab) so the user lands on it */}
          <DrawnCardBlock state={state} drawn={drawn} onCall={handleDial} player={player} speakerOn={speakerOn} />
          {hasOpponentCards && <OpponentPvpPanel state={state} onPlay={handlePlayPvp} />}

          {/* tab content */}
          <AnimatePresence mode="wait">
            {tab === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ToyPhone
                  expectedPhone={drawn?.phone}
                  hint={
                    state.pending.momHangUp
                      ? "Mom hung up — pass"
                      : speakerPending
                      ? "Press SPEAKER first"
                      : drawn
                      ? `Dial ${drawn.name}`
                      : "—"
                  }
                  speakerphonePending={speakerPending}
                  speakerphoneOn={speakerOn}
                  onToggleSpeaker={() => setSpeakerOn((v) => !v)}
                  onSolve={() => setOverlay("solve")}
                  onRedial={() => replayLastCall(state, setCallLogIds, setOverlay)}
                  onNewGame={() => {
                    if (confirm("Quit and start over?")) setState(null);
                  }}
                  onCall={handleDial}
                  disabled={!!state.pending.momHangUp}
                />
                <GameLog state={state} className="mt-3" />
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
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile bottom tab bar — fixed, respects safe area. Hidden when an overlay is up. */}
      <nav
        className={`lg:hidden fixed bottom-0 inset-x-0 z-30 border-t-4 border-dp-ink bg-dp-paper text-dp-ink shadow-[0_-6px_0_var(--dp-pink-hot)] transition-transform ${
          overlay ? "translate-y-full" : "translate-y-0"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-3">
          {[
            { id: "phone" as const, label: "📞 Phone" },
            { id: "notes" as const, label: "📓 Clue Card" },
            { id: "boys" as const, label: "👬 Boys" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`py-3 text-sm font-black uppercase tracking-tight ${
                tab === t.id ? "bg-dp-pink-hot text-white" : "hover:bg-dp-ink/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {overlay === "phonebook" && (
          <PhoneBook key="phonebook" state={state} onClose={() => setOverlay(null)} />
        )}
        {overlay === "solve" && (
          <SolveModal key="solve" onGuess={handleSolveGuess} onClose={() => setOverlay(null)} />
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
    </div>
  );
}

function DrawnCardBlock({
  state,
  drawn,
  onCall,
  player,
  speakerOn,
}: {
  state: GameState;
  drawn: ReturnType<typeof currentPlayer> extends never ? never : GameState["board"][number] | null;
  onCall: (phone: string) => void;
  player: ReturnType<typeof currentPlayer>;
  speakerOn: boolean;
}) {
  const blockedBySpeaker = !!state.pending.speakerphone && !speakerOn;
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
              whileHover={blockedBySpeaker ? undefined : { scale: 1.03 }}
              whileTap={blockedBySpeaker ? undefined : { scale: 0.95 }}
              type="button"
              disabled={blockedBySpeaker}
              className={`dp-btn dp-btn-pink w-full mt-3 text-base py-3 ${
                blockedBySpeaker ? "opacity-55 cursor-not-allowed" : ""
              }`}
              onClick={() => !blockedBySpeaker && onCall(drawn.phone)}
              title={blockedBySpeaker ? "Press SPEAKER on the phone first" : undefined}
            >
              {blockedBySpeaker
                ? `📢 Press SPEAKER first to call ${drawn.name}`
                : `📞 Call ${drawn.name} (${drawn.phone})`}
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
  const winner = useMemo(() => state.players.find((p) => p.id === state.winner), [state]);
  const crush = state.board[state.crushId];
  const crushImg = `/assets/boys/${crush.name.toLowerCase()}.jpg`;

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 relative overflow-hidden">
      <Confetti count={80} />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="relative max-w-3xl w-full text-center"
      >
        <motion.h1
          className="dp-title-stroke text-5xl sm:text-6xl mb-2"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          {winner?.name} ❤️ {crush.name}!
        </motion.h1>
        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg mb-6 opacity-80"
        >
          You guessed it — your crush is {crush.name} ({crush.phone}).
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-6 flex-wrap mb-6"
        >
          {winner && <PlayerCard player={winner} size="lg" />}
          <div className="text-4xl">💘</div>
          <div
            className="w-72 rounded-md border-4 border-dp-ink overflow-hidden bg-white"
            style={{ boxShadow: "8px 8px 0 var(--dp-pink-hot)" }}
          >
            <div className="relative w-full aspect-[3/4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={crushImg} alt={crush.name} className="absolute inset-0 w-full h-full object-contain" />
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 220 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          type="button"
          className="dp-btn dp-btn-pink text-xl"
          onClick={onPlayAgain}
        >
          🔄 Play Again
        </motion.button>
      </motion.div>
    </div>
  );
}
