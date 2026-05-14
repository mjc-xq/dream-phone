"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { GameState } from "@/lib/game/types";
import { PVP_DESCRIPTIONS, PVP_LABELS, type PvpType, displayName, imageForPvp } from "@/lib/game/cards";
import { heardFor } from "@/lib/game/engine";
import { NotePanel } from "./NotePanel";
import { CharacterCard } from "./CharacterCard";

type Props = {
  state: GameState;
  onToggleClue: (clue: string) => void;
  onToggleBoy: (id: number) => void;
  onPlayEndPvp: (type: PvpType) => void;
  nextPlayerName: string;
  onFinish: () => void;
};

export function PostCall({ state, onToggleClue, onToggleBoy, onPlayEndPvp, nextPlayerName, onFinish }: Props) {
  const heard = heardFor(state, state.currentPlayerIdx);
  const lastClue = heard[heard.length - 1];
  const lastBoy = lastClue ? state.board[lastClue.boyId] : null;
  const me = state.players[state.currentPlayerIdx];
  const armedTypes: PvpType[] = [];
  if (state.pending.momHangUp) armedTypes.push("hangup");
  if (state.pending.speakerphone) armedTypes.push("speakerphone");
  if (state.pending.shareSecret) armedTypes.push("share_secret");

  const hasPvp = me.pvpHand.length > 0 && state.numPlayers > 1;

  return (
    <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-4">
      {lastBoy && lastClue && (
        <div className="dp-card p-4">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="dp-chip dp-chip-pink">Just heard from</div>
            <div className="font-black text-lg">{displayName(lastBoy, state.mode)}</div>
            <div className="dp-chip">{lastBoy.phone}</div>
          </div>
          <div className="flex items-stretch gap-3">
            <div className="relative w-24 sm:w-28 aspect-[3/4] rounded-md border-3 border-dp-ink overflow-hidden shrink-0 bg-white">
              <CharacterCard boy={lastBoy} mode={state.mode} size="sm" sizes="120px" />
            </div>
            <div className="flex-1 min-w-0 bg-dp-yellow border-3 border-dp-ink rounded-md p-3 flex flex-col justify-center text-dp-ink">
              <div className="text-[10px] font-black uppercase tracking-widest text-dp-magenta">
                Clue ruled out
              </div>
              <div className="leading-tight">
                <span className="text-sm sm:text-base font-bold">Your crush is </span>
                <span className="text-lg sm:text-xl font-black uppercase bg-dp-ink text-dp-yellow px-1.5 py-0.5 rounded-sm">
                  NOT
                </span>
                <span className="text-sm sm:text-base font-bold"> into </span>
                <span className="text-lg sm:text-xl font-black uppercase">
                  {lastClue.clue}
                </span>
                <span className="text-sm sm:text-base font-bold">.</span>
              </div>
              <div className="text-[11px] opacity-80 mt-1">
                Tap it below to strike it off your clue card.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dp-card p-3">
        <div className="dp-chip dp-chip-teal mb-2">📓 Mark your clue card</div>
        <p className="text-xs sm:text-sm opacity-80 mb-2">
          Strike anything you ruled out. Cross off boys who can&apos;t be the crush.
        </p>
        <NotePanel state={state} onToggleClue={onToggleClue} onToggleBoy={onToggleBoy} />
      </div>

      {hasPvp && (
        <div className="dp-card p-3">
          <div className="dp-chip dp-chip-pink mb-2">
            ⚡ Sabotage {nextPlayerName}?
          </div>
          {armedTypes.length > 0 && (
            <div className="bg-dp-yellow/40 border-2 border-dp-ink rounded-md p-2 mb-2 text-xs">
              Already armed against {nextPlayerName}:{" "}
              {armedTypes.map((t) => PVP_LABELS[t]).join(" + ")}
            </div>
          )}
          <p className="text-xs opacity-80 mb-3">
            Tap a card to play it on {nextPlayerName}&apos;s next turn. (Optional — you can also skip.)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["hangup", "speakerphone", "share_secret"] as PvpType[]).map((t) => {
              const owned = me.pvpHand.some((c) => c.type === t);
              const armed = armedTypes.includes(t);
              return (
                <motion.button
                  key={t}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ y: -2 }}
                  type="button"
                  disabled={!owned || armed}
                  onClick={() => onPlayEndPvp(t)}
                  className={`relative rounded-md border-3 border-dp-ink overflow-hidden bg-white text-left ${
                    !owned || armed ? "opacity-40" : "shadow-[4px_4px_0_var(--dp-ink)]"
                  }`}
                >
                  <div className="relative w-full aspect-[3/4] bg-white">
                    <Image src={imageForPvp(t)} alt={PVP_LABELS[t]} fill sizes="120px" className="object-contain" />
                    {armed && (
                      <div className="absolute inset-0 bg-dp-yellow/70 flex items-center justify-center">
                        <span className="font-black uppercase text-xs">ARMED</span>
                      </div>
                    )}
                    {!owned && !armed && (
                      <div className="absolute inset-0 bg-dp-ink/40 flex items-center justify-center">
                        <span className="font-black uppercase text-[10px] text-white">USED</span>
                      </div>
                    )}
                  </div>
                  <div className="p-1.5 text-[10px] sm:text-xs text-dp-ink">
                    <div className="font-black leading-none">{PVP_LABELS[t]}</div>
                    <div className="opacity-80 mt-1 leading-tight">{PVP_DESCRIPTIONS[t]}</div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={onFinish}
        className="dp-btn dp-btn-pink w-full text-lg py-4"
      >
        ☎ Hand phone to {nextPlayerName} →
      </motion.button>
    </motion.div>
  );
}
