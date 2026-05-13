export type BoyCard = {
  id: number;
  name: string;
  phone: string;
  hangout: string;
  sport: string | null;
  food: string | null;
  clothing: string;
};

export const BOYS: BoyCard[] = [
  { id: 0, name: "Dave", phone: "555-1111", hangout: "Crosstown Mall", sport: null, food: "Cookies", clothing: "Blue Jeans" },
  { id: 1, name: "George", phone: "555-1233", hangout: "Crosstown Mall", sport: null, food: "Ice Cream", clothing: "Tie" },
  { id: 2, name: "Dale", phone: "555-4566", hangout: "Crosstown Mall", sport: null, food: "Ice Cream", clothing: "Jacket" },
  { id: 3, name: "Alan", phone: "555-7899", hangout: "Crosstown Mall", sport: null, food: "Cookies", clothing: "Tie" },
  { id: 4, name: "James", phone: "555-2588", hangout: "E.A.T.S. Snack Shop", sport: null, food: "Hot Dogs", clothing: "Jacket" },
  { id: 5, name: "Phil", phone: "555-3333", hangout: "E.A.T.S. Snack Shop", sport: null, food: "Pizza", clothing: "Glasses" },
  { id: 6, name: "Bruce", phone: "555-3699", hangout: "E.A.T.S. Snack Shop", sport: null, food: "Pizza", clothing: "Tie" },
  { id: 7, name: "Tyler", phone: "555-1477", hangout: "E.A.T.S. Snack Shop", sport: null, food: "Hot Dogs", clothing: "Blue Jeans" },
  { id: 8, name: "Jamal", phone: "555-9877", hangout: "Reel Movies", sport: null, food: "Candy", clothing: "Tie" },
  { id: 9, name: "Gary", phone: "555-3211", hangout: "Reel Movies", sport: null, food: "Popcorn", clothing: "Blue Jeans" },
  { id: 10, name: "Dan", phone: "555-7777", hangout: "Reel Movies", sport: null, food: "Candy", clothing: "Blue Jeans" },
  { id: 11, name: "Spencer", phone: "555-6544", hangout: "Reel Movies", sport: null, food: "Popcorn", clothing: "Jacket" },
  { id: 12, name: "Mark", phone: "555-8522", hangout: "Woodland Park", sport: "Baseball", food: null, clothing: "Hat" },
  { id: 13, name: "Jason", phone: "555-7411", hangout: "Woodland Park", sport: "Baseball", food: null, clothing: "Glasses" },
  { id: 14, name: "Steve", phone: "555-9999", hangout: "Woodland Park", sport: "Skateboarding", food: null, clothing: "Jacket" },
  { id: 15, name: "John", phone: "555-9633", hangout: "Woodland Park", sport: "Skateboarding", food: null, clothing: "Anything Yellow" },
  { id: 16, name: "Paul", phone: "555-5515", hangout: "High Tide Beach", sport: "Volleyball", food: null, clothing: "Anything Yellow" },
  { id: 17, name: "Tony", phone: "555-2442", hangout: "High Tide Beach", sport: "Volleyball", food: null, clothing: "Hat" },
  { id: 18, name: "Wayne", phone: "555-3535", hangout: "High Tide Beach", sport: "Surfing", food: null, clothing: "Anything Yellow" },
  { id: 19, name: "Mike", phone: "555-2226", hangout: "High Tide Beach", sport: "Surfing", food: null, clothing: "Hat" },
  { id: 20, name: "Scott", phone: "555-5599", hangout: "Jim's Gym", sport: "Basketball", food: null, clothing: "Anything Yellow" },
  { id: 21, name: "Bob", phone: "555-4884", hangout: "Jim's Gym", sport: "Basketball", food: null, clothing: "Glasses" },
  { id: 22, name: "Carlos", phone: "555-6668", hangout: "Jim's Gym", sport: "Tennis", food: null, clothing: "Hat" },
  { id: 23, name: "Matt", phone: "555-7557", hangout: "Jim's Gym", sport: "Tennis", food: null, clothing: "Glasses" },
];

export type ClueCategory = "hangout" | "sport" | "food" | "clothing";

export function attributeOf(boy: BoyCard, cat: ClueCategory): string | null {
  if (cat === "hangout") return boy.hangout;
  if (cat === "sport") return boy.sport;
  if (cat === "food") return boy.food;
  return boy.clothing;
}

export function categoryOfClue(_boy: BoyCard, clue: string): ClueCategory | null {
  return clueCategoryGlobal(clue);
}

export function imageForBoy(boy: BoyCard): string {
  const slug = boy.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `/assets/boys/${slug}.jpg`;
}

export function imageForPvp(type: PvpType): string {
  if (type === "hangup") return "/assets/boys/hang-up.jpg";
  if (type === "share_secret") return "/assets/boys/share-a-secret.jpg";
  return "/assets/boys/speakerphone.jpg";
}

export const CARD_BACK_IMAGE = "/assets/boys/card-back.jpg";

let _clueCatCache: Map<string, ClueCategory> | null = null;
export function clueCategoryGlobal(clue: string): ClueCategory | null {
  if (!_clueCatCache) {
    _clueCatCache = new Map();
    for (const b of BOYS) {
      _clueCatCache.set(b.hangout, "hangout");
      if (b.sport) _clueCatCache.set(b.sport, "sport");
      if (b.food) _clueCatCache.set(b.food, "food");
      _clueCatCache.set(b.clothing, "clothing");
    }
  }
  return _clueCatCache.get(clue) ?? null;
}

export type PvpType = "hangup" | "share_secret" | "speakerphone";

export const PVP_LABELS: Record<PvpType, string> = {
  hangup: "Mom Says Hang Up!",
  share_secret: "Share a Secret",
  speakerphone: "Speakerphone",
};

export const PVP_DESCRIPTIONS: Record<PvpType, string> = {
  hangup: "Target boy card is discarded — opponent loses that card and the clue.",
  share_secret: "When opponent calls this card, you also learn the clue and grab this PvP card.",
  speakerphone: "When opponent calls this card, every player hears the clue.",
};

/* ElevenLabs voices verified accessible on the project's free-tier account.
   `pitchBias` is a per-voice pitch-playback offset that stacks on top of
   the per-boy hash. All 11 normal slots read as confident 90s teens.
   Slot 7 is one intentional "old man" cameo. */
export const TEEN_VOICE_POOL: {
  id: string;
  label: string;
  baseRate: number;
  pitchBias?: number;
}[] = [
  { id: "TX3LPaxmHKxFdv7VOQHJ", label: "Liam",    baseRate: 1.02 },                    // 0  young US, confident
  { id: "IKne3meq5aSn9XLyUdCD", label: "Charlie", baseRate: 1.04 },                    // 1  young AU, hyped
  { id: "SOYHLrjzK2X1ezoPC6cr", label: "Harry",   baseRate: 1.04 },                    // 2  young US, rough
  { id: "bIHbv24MWmeRgasZH58o", label: "Will",    baseRate: 1.00 },                    // 3  young US, chill
  { id: "wo6udizrrtpIxWGp2qJk", label: "Terry",   baseRate: 1.04 },                    // 4  young UK, husky
  { id: "iP95p4xoKVk53GoZ742B", label: "Chris",   baseRate: 1.12, pitchBias: 0.04 },   // 5  middle US, casual -> teen
  { id: "cjVigY5qzO86Huf0OWal", label: "Eric",    baseRate: 1.11, pitchBias: 0.04 },   // 6  middle US, smooth -> teen
  // 7: intentional old-man cameo — Bill (old US, crisp), slow + lower pitch
  { id: "pqHfZKP75CvOlQylNhV4", label: "OldMan",  baseRate: 0.86, pitchBias: -0.12 },  // 7
  { id: "nPczCjzI2devNBz1zQrb", label: "Brian",   baseRate: 1.13, pitchBias: 0.05 },   // 8  middle US, deep -> teen
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam",    baseRate: 1.12, pitchBias: 0.04 },   // 9  middle US, dominant -> teen
  { id: "CwhRBWXzGAHq8TQ4Fs17", label: "Roger",   baseRate: 1.12, pitchBias: 0.04 },   // 10 middle US, classy -> teen
  { id: "JBFqnCBsd6RMkjVDRZzb", label: "George",  baseRate: 1.13, pitchBias: 0.05 },   // 11 middle UK, mature -> teen
];

export type BoyVoice = {
  voiceId: string;
  pitchPlayback: number;
  rate: number;
  stability: number;
  style: number;
  similarity: number;
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function voiceForBoy(boy: BoyCard): BoyVoice {
  const h = hashStr(boy.name + boy.phone);
  const pool = TEEN_VOICE_POOL;
  const v = pool[boy.id % pool.length];
  const pitchPlayback = (v.pitchBias ?? 0) + 0.96 + ((h >> 3) % 14) / 100;
  const stability = 0.32 + ((h >> 5) % 35) / 100;
  const style = ((h >> 7) % 60) / 100;
  const similarity = 0.7 + ((h >> 9) % 25) / 100;
  const rate = v.baseRate + ((h >> 11) % 6) / 100 - 0.02;
  return { voiceId: v.id, pitchPlayback, rate, stability, style, similarity };
}
