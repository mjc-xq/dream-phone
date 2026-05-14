// Animals Mode: 13 unique animals from sloppysecondsinc.org/animals (owned
// by the project owner) mixed in with 11 boy cards. No duplicate animal
// names — each animal owns exactly one of the 24 game slots. The other 11
// slots stay as their original boy.
//
// Animal slots are picked across all 6 hangouts so animals appear evenly
// throughout the deck, not bunched at one hangout.

export type AnimalSkin = {
  boyId: number;
  name: string;
  image: string;
  image90s?: string;
  /** Background color for the stylized animal card (one of the dp tones). */
  cardColor: string;
};

const A = (slug: string) => `/assets/animals/${slug}.jpg`;
const A90 = (slug: string) => `/assets/animals-90s/${slug}.jpg`;

const COLORS = ["yellow", "pink", "teal", "lime", "orange", "violet", "skyblue"];

// Hangout layout in BOYS (4 per location): 0-3 Crosstown, 4-7 EATS,
// 8-11 Reel Movies, 12-15 Woodland Park, 16-19 High Tide, 20-23 Jim's Gym.
// Pick 2-3 from each so every hangout has at least 2 animals.
const PICKS: Array<{ slot: number; name: string; slug: string }> = [
  // Crosstown Mall (2)
  { slot: 0,  name: "Brewster", slug: "brewster" },
  { slot: 2,  name: "Frida",    slug: "frida" },
  // E.A.T.S. (2)
  { slot: 4,  name: "Bella",    slug: "bella" },
  { slot: 6,  name: "Wilbur",   slug: "wilbur" },
  // Reel Movies (2)
  { slot: 8,  name: "Toodles",  slug: "toodles" },
  { slot: 10, name: "Bentley",  slug: "bentley" },
  // Woodland Park (3)
  { slot: 12, name: "Stash",    slug: "stash" },
  { slot: 13, name: "Phillip",  slug: "phillip" },
  { slot: 15, name: "JoJo",     slug: "jojo" },
  // High Tide Beach (2)
  { slot: 16, name: "Buscemi",  slug: "buscemi" },
  { slot: 18, name: "Nala",     slug: "nala" },
  // Jim's Gym (2)
  { slot: 20, name: "Phoebe",   slug: "phoebe" },
  { slot: 22, name: "Blanche",  slug: "blanche" },
];

/** Map boyId -> AnimalSkin for slots that are animals in Animals Mode. */
export const ANIMAL_SLOTS: Record<number, AnimalSkin> = Object.fromEntries(
  PICKS.map((p, i) => [
    p.slot,
    {
      boyId: p.slot,
      name: p.name,
      image: A(p.slug),
      image90s: A90(p.slug),
      cardColor: COLORS[i % COLORS.length],
    },
  ]),
);

export function animalForSlot(boyId: number): AnimalSkin | undefined {
  return ANIMAL_SLOTS[boyId];
}
