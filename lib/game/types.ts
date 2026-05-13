import type { BoyCard, PvpType } from "./cards";

export type Curse = {
  id: string;
  type: PvpType;
  ownerPlayerId: number;
};

export type BoardCard = BoyCard & {
  clueReveal: string;
  firstCall: boolean;
  curses: Curse[];
};

export type PvpCard = {
  id: string;
  type: PvpType;
  ownerPlayerId: number;
};

export type PlayerCardSkin = {
  photoDataUrl: string;
  /** True when this is still the raw camera photo and Gemini is processing. */
  isPlaceholder?: boolean;
  hangout: string;
  cardColor: string;
  phone: string;
};

export type Player = {
  id: number;
  name: string;
  pvpHand: PvpCard[];
  collectedClues: number[];
  struckClues: string[];
  markedBoys: number[];
  guessedThisTurn: boolean;
  card?: PlayerCardSkin;
};

export type PendingPvp = {
  speakerphone?: { ownerPlayerId: number };
  shareSecret?: { ownerPlayerId: number };
  momHangUp?: { ownerPlayerId: number };
};

export type LogEntry = {
  id: string;
  text: string;
  tone: "narrator" | "boy" | "loud" | "quiet" | "system" | "win";
  speak?: boolean;
  boyId?: number;
};

export type Phase =
  | "handoff"
  | "drawn"
  | "calling"
  | "gameOver";

export type GameState = {
  phase: Phase;
  numPlayers: number;
  players: Player[];
  board: BoardCard[];
  deck: number[];
  discard: number[];
  crushId: number;
  currentPlayerIdx: number;
  log: LogEntry[];
  lastDialedId: number | null;
  drawnBoyId: number | null;
  pending: PendingPvp;
  pvpPlayedThisRound: number[]; // player ids that have played this round
  winner: number | null;
};
