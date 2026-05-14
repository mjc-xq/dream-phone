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

/** Display name + image for a slot, honoring Animals Mode. */
export async function loadAnimalRoster() {
  const mod = await import("./animals");
  return mod.ANIMAL_ROSTER;
}

import { ANIMAL_ROSTER } from "./animals";

export function displayName(boy: BoyCard, mode: "boys" | "animals" = "boys"): string {
  if (mode === "animals") return ANIMAL_ROSTER[boy.id]?.name ?? boy.name;
  return boy.name;
}

export function displayImage(boy: BoyCard, mode: "boys" | "animals" = "boys"): string {
  if (mode === "animals") {
    const skin = ANIMAL_ROSTER[boy.id];
    if (!skin) return imageForBoy(boy);
    return skin.image90s ?? skin.image;
  }
  return imageForBoy(boy);
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

/* ElevenLabs voice pool — paid plan, full shared library.
   ONE voice per boy (24 boys × 24 unique voices). No speed/pitch tuning.
   Slot 23 (the last boy, Matt) gets the intentional old-man cameo. */
export const TEEN_VOICE_POOL: {
  id: string;
  label: string;
  baseRate: number;
  pitchBias?: number;
}[] = [
  { id: "TxGEqnHWrfWFTfGW9XjX", label: "Josh",     baseRate: 1.0 }, // 0  Dave    — young US
  { id: "TX3LPaxmHKxFdv7VOQHJ", label: "Liam",     baseRate: 1.0 }, // 1  George  — young US, confident
  { id: "IKne3meq5aSn9XLyUdCD", label: "Charlie",  baseRate: 1.0 }, // 2  Dale    — young AU, hyped
  { id: "SOYHLrjzK2X1ezoPC6cr", label: "Harry",    baseRate: 1.0 }, // 3  Alan    — young US, rough
  { id: "bIHbv24MWmeRgasZH58o", label: "Will",     baseRate: 1.0 }, // 4  James   — young US, chill
  { id: "yoZ06aMxZJJ28mfd3POQ", label: "Sam",      baseRate: 1.0 }, // 5  Phil    — young US
  { id: "g5CIjZEefAph4nQFvHAz", label: "Ethan",    baseRate: 1.0 }, // 6  Bruce   — young US
  { id: "ODq5zmih8GrVes37Dizd", label: "Patrick",  baseRate: 1.0 }, // 7  Tyler   — young US
  { id: "wViXBPUzp2ZZixB1xQuM", label: "Ryan",     baseRate: 1.0 }, // 8  Jamal   — young US
  { id: "bVMeCyTHy58xNoL34h3p", label: "Jeremy",   baseRate: 1.0 }, // 9  Gary    — young US
  { id: "wo6udizrrtpIxWGp2qJk", label: "Terry",    baseRate: 1.0 }, // 10 Dan     — young UK, husky
  { id: "ErXwobaYiN019PkySvjV", label: "Antoni",   baseRate: 1.0 }, // 11 Spencer — well-rounded US
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam",     baseRate: 1.0 }, // 12 Mark    — US, firm
  { id: "29vD33N1CtxCmqQRPOHJ", label: "Drew",     baseRate: 1.0 }, // 13 Jason   — well-rounded
  { id: "D38z5RcWu1voky8WS1ja", label: "Fin",      baseRate: 1.0 }, // 14 Steve   — Irish
  { id: "ZQe5CZNOzWyzPSCn5a3c", label: "JamesAU",  baseRate: 1.0 }, // 15 John    — Australian
  { id: "flq6f7yk4E4fJM5XTYuZ", label: "Michael",  baseRate: 1.0 }, // 16 Paul    — US
  { id: "GBv7mTt0atIp3Br8iCZE", label: "Thomas",   baseRate: 1.0 }, // 17 Tony    — US
  { id: "onwK4e9ZLuTAKqWW03F9", label: "Daniel",   baseRate: 1.0 }, // 18 Wayne   — British
  { id: "cjVigY5qzO86Huf0OWal", label: "Eric",     baseRate: 1.0 }, // 19 Mike    — US smooth
  { id: "iP95p4xoKVk53GoZ742B", label: "Chris",    baseRate: 1.0 }, // 20 Scott   — US casual
  { id: "N2lVS1w4EtoT3dr4eOWO", label: "Callum",   baseRate: 1.0 }, // 21 Bob     — US husky
  { id: "nPczCjzI2devNBz1zQrb", label: "Brian",    baseRate: 1.0 }, // 22 Carlos  — US deep
  // 23 Matt — intentional old-man cameo (Bill: old US, crisp; slow + lower pitch)
  { id: "pqHfZKP75CvOlQylNhV4", label: "OldMan",   baseRate: 0.86, pitchBias: -0.12 },
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
  // Each boy gets a unique voice, so no jitter needed. Keep playback exact;
  // only the old-man cameo applies its pitch/rate character.
  const pitchPlayback = (v.pitchBias ?? 0) + 1.0;
  const rate = v.baseRate;
  // Per-boy hash drives only ElevenLabs voice settings for subtle persona.
  const stability = 0.4 + ((h >> 5) % 20) / 100;
  const style = ((h >> 7) % 35) / 100;
  const similarity = 0.8 + ((h >> 9) % 15) / 100;
  return { voiceId: v.id, pitchPlayback, rate, stability, style, similarity };
}
