import { BOYS, type ClueCategory, PVP_LABELS, type PvpType, clueCategoryGlobal } from "./cards";
import type { BoardCard, GameState, LogEntry, PendingPvp, Player, PvpCard } from "./types";

let logCounter = 0;
const nextLogId = () => `l${++logCounter}`;

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeBoardCards(crushId: number): BoardCard[] {
  const crush = BOYS[crushId];
  const crushAttrs = new Set<string>([
    crush.hangout,
    crush.sport ?? "",
    crush.food ?? "",
    crush.clothing,
  ]);
  const clueValues = new Set<string>();
  for (const b of BOYS) {
    if (b.hangout) clueValues.add(b.hangout);
    if (b.sport) clueValues.add(b.sport);
    if (b.food) clueValues.add(b.food);
    if (b.clothing) clueValues.add(b.clothing);
  }
  const allClues = shuffle(Array.from(clueValues));
  const safeClues = allClues.filter((c) => !crushAttrs.has(c));
  const pool: string[] = [];
  while (pool.length < BOYS.length) pool.push(...shuffle(safeClues));
  return BOYS.map((b, i) => ({ ...b, clueReveal: pool[i], firstCall: true, curses: [] }));
}

export function generatePlayerPhone(usedPhones: Set<string>): string {
  for (let i = 0; i < 200; i++) {
    const n = Math.floor(1000 + Math.random() * 8999);
    const p = `555-${n}`;
    if (!usedPhones.has(p) && !BOYS.some((b) => b.phone === p)) {
      usedPhones.add(p);
      return p;
    }
  }
  return `555-${Math.floor(1000 + Math.random() * 8999)}`;
}

export function newGame(
  numPlayers: number,
  names: string[],
  cards?: Array<{ photoDataUrl: string; hangout: string; cardColor: string } | undefined>,
): GameState {
  logCounter = 0;
  const crushId = Math.floor(Math.random() * BOYS.length);
  const board = makeBoardCards(crushId);
  const deck = shuffle(BOYS.map((b) => b.id));

  const players: Player[] = [];
  const usedPhones = new Set<string>();
  let pvpCounter = 0;
  for (let i = 0; i < numPlayers; i++) {
    const skin = cards?.[i];
    const playerCard = skin
      ? { ...skin, phone: generatePlayerPhone(usedPhones) }
      : undefined;
    const pvpHand: PvpCard[] =
      numPlayers > 1
        ? (["hangup", "share_secret", "speakerphone"] as PvpType[]).map((t) => ({
            id: `pvp-${pvpCounter++}`,
            type: t,
            ownerPlayerId: i + 1,
          }))
        : [];
    players.push({
      id: i + 1,
      name: names[i] || `Player ${i + 1}`,
      pvpHand,
      collectedClues: [],
      struckClues: [],
      markedBoys: [],
      guessedThisTurn: false,
      card: playerCard,
    });
  }

  const state: GameState = {
    phase: "handoff",
    numPlayers,
    players,
    board,
    deck,
    discard: [],
    crushId,
    currentPlayerIdx: 0,
    log: [
      {
        id: nextLogId(),
        text:
          numPlayers === 1
            ? "Single player mode. PvP cards disabled. Draw a card and dial!"
            : "Each player has one Speakerphone, one Share a Secret, and one Mom Says Hang Up. Good luck!",
        tone: "system",
      },
    ],
    lastDialedId: null,
    drawnBoyId: null,
    pending: {},
    pvpPlayedThisRound: [],
    winner: null,
  };

  return state;
}

export const currentPlayer = (s: GameState) => s.players[s.currentPlayerIdx];

export function pushLog(s: GameState, entry: Omit<LogEntry, "id">) {
  s.log = [...s.log, { ...entry, id: nextLogId() }];
}

/** Begin the current player's turn — auto-draws a boy card. */
export function beginTurn(prev: GameState): GameState {
  const s = clone(prev);
  ensureDeck(s);
  if (s.deck.length === 0) {
    s.phase = "gameOver"; // shouldn't happen if reshuffle works
    return s;
  }
  const id = s.deck.shift()!;
  s.drawnBoyId = id;
  s.phase = "drawn";
  s.pending = {};
  s.pvpPlayedThisRound = [];
  pushLog(s, { text: `${currentPlayer(s).name} drew a boy card.`, tone: "system" });
  return s;
}

function ensureDeck(s: GameState) {
  if (s.deck.length === 0 && s.discard.length > 0) {
    s.deck = shuffle(s.discard);
    s.discard = [];
    pushLog(s, { text: "Discard pile shuffled back into the deck.", tone: "system" });
  }
}

/** Opponent plays a PvP card against the current dial. */
export function playPvp(prev: GameState, ownerPlayerId: number, type: PvpType): GameState {
  const s = clone(prev);
  if (s.phase !== "drawn") return prev;
  if (ownerPlayerId === currentPlayer(s).id) return prev; // only opponents can play
  if (s.pvpPlayedThisRound.includes(ownerPlayerId)) return prev;
  const owner = s.players.find((p) => p.id === ownerPlayerId);
  if (!owner) return prev;
  const cardIdx = owner.pvpHand.findIndex((c) => c.type === type);
  if (cardIdx === -1) return prev;
  // remove from owner hand
  owner.pvpHand.splice(cardIdx, 1);
  s.pvpPlayedThisRound.push(ownerPlayerId);
  if (type === "hangup") s.pending.momHangUp = { ownerPlayerId };
  if (type === "speakerphone") s.pending.speakerphone = { ownerPlayerId };
  if (type === "share_secret") s.pending.shareSecret = { ownerPlayerId };
  pushLog(s, {
    text: `${owner.name} played "${PVP_LABELS[type]}" against ${currentPlayer(s).name}!`,
    tone: "system",
  });
  return s;
}

type DialResult = {
  state: GameState;
  outcome: "ok" | "wrong_number" | "skipped";
};

const GREETINGS_FIRST = [
  (player: string, boy: string) => `Hey ${player}, this is ${boy}. You wanna know about your crush?`,
  (player: string, boy: string) => `What's up ${player}? It's ${boy}. So you got a crush, huh?`,
  (player: string, boy: string) => `Hello ${player}, ${boy} speaking. You want the scoop on your crush?`,
  (player: string, boy: string) => `${player}? Yeah, it's ${boy}. Heard you're trying to figure out your crush.`,
];
const GREETINGS_REPEAT = [
  (player: string) => `You again, ${player}? Fine, here's another hint.`,
  (player: string) => `${player}, I already started telling you — okay, one more.`,
];

function pickByHash(len: number, seed: number) {
  const h = Math.abs(seed * 2654435761) >>> 0;
  return h % len;
}

/** Current player dials the given phone number. Resolves with pending PvP. */
export function dial(prev: GameState, phone: string, useSpeakerphoneButton: boolean): DialResult {
  if (prev.phase !== "drawn" || prev.drawnBoyId === null) {
    return { state: prev, outcome: "wrong_number" };
  }
  const s = clone(prev);
  const player = currentPlayer(s);
  const drawn = s.board[s.drawnBoyId!];

  // Mom Says Hang Up — current player must skip the dial entirely
  if (s.pending.momHangUp) {
    pushLog(s, {
      text: `Mom hung up the phone! ${player.name} loses this turn — pass the phone.`,
      tone: "system",
    });
    s.discard.push(drawn.id);
    s.drawnBoyId = null;
    return finishTurn(s, "skipped");
  }

  // Phone-number must match the drawn boy's number
  if (phone !== drawn.phone) {
    pushLog(s, { text: `☎️ Wrong number — try the number on your card.`, tone: "system" });
    return { state: s, outcome: "wrong_number" };
  }

  // If Speakerphone was queued, the current player MUST press the speakerphone button.
  // If they didn't, hold off until they do. (UI gates this)
  const speakerphoneActive = !!s.pending.speakerphone && useSpeakerphoneButton;
  const shareSecretActive = !!s.pending.shareSecret;

  const clue = drawn.clueReveal;
  const cat = clueCategoryGlobal(clue) as ClueCategory | null;
  if (!cat) {
    return { state: s, outcome: "wrong_number" };
  }

  const greeting = drawn.firstCall
    ? GREETINGS_FIRST[pickByHash(GREETINGS_FIRST.length, drawn.id + player.id * 7)](player.name, drawn.name)
    : GREETINGS_REPEAT[pickByHash(GREETINGS_REPEAT.length, drawn.id + player.id * 13)](player.name);

  const loudByCat: Record<ClueCategory, string> = {
    hangout: "I know where he hangs out,",
    sport: "He is very athletic,",
    food: "He loves to eat,",
    clothing: "He looks good in whatever he wears,",
  };
  const lower = clue.toLowerCase();
  const needsArticle = ["hat", "jacket", "tie"].includes(lower);
  const quietByCat: Record<ClueCategory, string> = {
    hangout: `but he doesn't hang out at ${clue}.`,
    sport: `but he doesn't like ${lower}.`,
    food: `but he hates the taste of ${lower}.`,
    clothing: `but he doesn't wear ${needsArticle ? "a " : ""}${lower}.`,
  };

  pushLog(s, { text: greeting, tone: "boy", speak: true, boyId: drawn.id });
  pushLog(s, { text: loudByCat[cat], tone: "loud", speak: true, boyId: drawn.id });
  pushLog(s, { text: quietByCat[cat], tone: speakerphoneActive ? "loud" : "quiet", speak: true, boyId: drawn.id });

  // Record clue for current player
  if (!player.collectedClues.includes(drawn.id)) player.collectedClues.push(drawn.id);

  // Speakerphone — all players get the clue
  if (speakerphoneActive) {
    for (const p of s.players) {
      if (!p.collectedClues.includes(drawn.id)) p.collectedClues.push(drawn.id);
    }
    pushLog(s, { text: `📣 SPEAKERPHONE — everyone heard that clue.`, tone: "system" });
  }

  // Share a Secret — give clue to playing opponent AND transfer the card to current player
  if (shareSecretActive && s.pending.shareSecret) {
    const opp = s.players.find((p) => p.id === s.pending.shareSecret!.ownerPlayerId);
    if (opp && !opp.collectedClues.includes(drawn.id)) opp.collectedClues.push(drawn.id);
    // current player gains the share-a-secret card
    player.pvpHand.push({ id: `pvp-ss-${drawn.id}-${player.id}`, type: "share_secret", ownerPlayerId: player.id });
    pushLog(s, {
      text: `Share a Secret: ${opp?.name ?? "opponent"} also heard the clue, and the card transfers to ${player.name}.`,
      tone: "system",
    });
  }

  drawn.firstCall = false;
  s.lastDialedId = drawn.id;
  s.discard.push(drawn.id);
  s.drawnBoyId = null;

  return finishTurn(s, "ok");
}

function finishTurn(s: GameState, outcome: DialResult["outcome"]): DialResult {
  s.pending = {};
  s.pvpPlayedThisRound = [];

  // Advance to next player
  if (s.numPlayers > 1) {
    s.currentPlayerIdx = (s.currentPlayerIdx + 1) % s.numPlayers;
    s.phase = "handoff";
  } else {
    s.phase = "handoff";
  }
  // reset turn flags
  currentPlayer(s).guessedThisTurn = false;
  // reset firstCall (clue snark reset between players)
  for (const b of s.board) b.firstCall = true;
  ensureDeck(s);
  return { state: s, outcome };
}

export function dismissHandoff(prev: GameState): GameState {
  // From handoff phase, automatically draw and move to "drawn"
  return beginTurn(prev);
}

export function redial(prev: GameState): GameState {
  // Re-show the last spoken lines for the current dial (used for Share a Secret).
  // We do not advance the turn or modify state — this is a UI-driven replay.
  return prev;
}

export function solve(prev: GameState, guessBoyId: number): { state: GameState; correct: boolean } {
  const s = clone(prev);
  const p = currentPlayer(s);
  if (p.guessedThisTurn && s.numPlayers > 1) return { state: prev, correct: false };
  const correct = guessBoyId === s.crushId;
  if (correct) {
    s.phase = "gameOver";
    s.winner = p.id;
    pushLog(s, { text: `${s.board[s.crushId].name} is your crush! ${p.name} wins!`, tone: "win" });
    return { state: s, correct };
  }
  if (s.numPlayers > 1) p.guessedThisTurn = true;
  pushLog(s, {
    text: `Wrong! ${s.board[guessBoyId].name} isn't the crush. Try again next turn.`,
    tone: "system",
  });
  return { state: s, correct };
}

export function toggleStrike(prev: GameState, clue: string): GameState {
  const s = clone(prev);
  const p = currentPlayer(s);
  const set = new Set(p.struckClues);
  if (set.has(clue)) set.delete(clue);
  else set.add(clue);
  p.struckClues = Array.from(set);
  return s;
}

export function toggleMarkedBoy(prev: GameState, boyId: number): GameState {
  const s = clone(prev);
  const p = currentPlayer(s);
  const set = new Set(p.markedBoys);
  if (set.has(boyId)) set.delete(boyId);
  else set.add(boyId);
  p.markedBoys = Array.from(set);
  return s;
}

export function heardFor(s: GameState, playerIdx: number) {
  const p = s.players[playerIdx];
  const heard: Array<{ boyId: number; clue: string }> = [];
  for (const id of p.collectedClues) heard.push({ boyId: id, clue: s.board[id].clueReveal });
  return heard;
}

export function ruledOutFor(s: GameState, playerIdx: number) {
  const p = s.players[playerIdx];
  const out = {
    hangouts: new Set<string>(),
    sports: new Set<string>(),
    foods: new Set<string>(),
    clothing: new Set<string>(),
    calledBoys: new Set<number>(),
  };
  for (const id of p.collectedClues) {
    out.calledBoys.add(id);
    const clue = s.board[id].clueReveal;
    for (const b of BOYS) {
      if (b.hangout === clue) out.hangouts.add(clue);
      if (b.sport === clue) out.sports.add(clue);
      if (b.food === clue) out.foods.add(clue);
      if (b.clothing === clue) out.clothing.add(clue);
    }
  }
  return out;
}

export function getUniqueValues() {
  const hangouts = new Set<string>();
  const sports = new Set<string>();
  const foods = new Set<string>();
  const clothing = new Set<string>();
  for (const b of BOYS) {
    hangouts.add(b.hangout);
    if (b.sport) sports.add(b.sport);
    if (b.food) foods.add(b.food);
    clothing.add(b.clothing);
  }
  return {
    hangouts: Array.from(hangouts),
    sports: Array.from(sports),
    foods: Array.from(foods),
    clothing: Array.from(clothing),
  };
}

function clone(s: GameState): GameState {
  return {
    ...s,
    players: s.players.map((p) => ({
      ...p,
      pvpHand: p.pvpHand.map((c) => ({ ...c })),
      collectedClues: [...p.collectedClues],
      struckClues: [...p.struckClues],
      markedBoys: [...p.markedBoys],
    })),
    board: s.board.map((b) => ({ ...b, curses: b.curses.map((c) => ({ ...c })) })),
    deck: [...s.deck],
    discard: [...s.discard],
    log: s.log,
    pending: { ...s.pending },
    pvpPlayedThisRound: [...s.pvpPlayedThisRound],
  };
}

// Keep compatibility export shapes
export type { PendingPvp };
