// Animals roster for "Animals Mode" — substitutes the boy faces + names
// with photos and names of real animals from sloppysecondsinc.org/animals
// (owned by the project owner, used with permission).
//
// The game keeps its 24 character slots and their attribute data; only the
// display name and the portrait change when this mode is active. Since the
// roster has 13 unique animals, each appears roughly twice across the 24
// slots with a slight name suffix so they read as distinct characters.

export type AnimalSkin = {
  /** Display name for this slot when Animals Mode is active. */
  name: string;
  /** Public path to the optimized photo. */
  image: string;
  /** Optional 90s-yearbook transformed image (if pre-generated). Falls back
   *  to `image` when missing. */
  image90s?: string;
};

const A = (slug: string) => `/assets/animals/${slug}.jpg`;
const A90 = (slug: string) => `/assets/animals-90s/${slug}.jpg`;

/** 24 animal display skins, indexed by boy id. */
export const ANIMAL_ROSTER: AnimalSkin[] = [
  { name: "Brewster",      image: A("brewster"), image90s: A90("brewster") }, // 0  Dave
  { name: "Frida",         image: A("frida"),    image90s: A90("frida") },    // 1  George
  { name: "Bella",         image: A("bella"),    image90s: A90("bella") },    // 2  Dale
  { name: "Wilbur",        image: A("wilbur"),   image90s: A90("wilbur") },   // 3  Alan
  { name: "Toodles",       image: A("toodles"),  image90s: A90("toodles") },  // 4  James
  { name: "Bentley",       image: A("bentley"),  image90s: A90("bentley") },  // 5  Phil
  { name: "Stash",         image: A("stash"),    image90s: A90("stash") },    // 6  Bruce
  { name: "Phillip",       image: A("phillip"),  image90s: A90("phillip") },  // 7  Tyler
  { name: "JoJo",          image: A("jojo"),     image90s: A90("jojo") },     // 8  Jamal
  { name: "Buscemi",       image: A("buscemi"),  image90s: A90("buscemi") },  // 9  Gary
  { name: "Nala",          image: A("nala"),     image90s: A90("nala") },     // 10 Dan
  { name: "Phoebe",        image: A("phoebe"),   image90s: A90("phoebe") },   // 11 Spencer
  { name: "Blanche",       image: A("blanche"),  image90s: A90("blanche") },  // 12 Mark
  { name: "Brewster Jr.",  image: A("brewster"), image90s: A90("brewster") }, // 13 Jason
  { name: "Frida II",      image: A("frida"),    image90s: A90("frida") },    // 14 Steve
  { name: "Bella Sue",     image: A("bella"),    image90s: A90("bella") },    // 15 John
  { name: "Big Wilbur",    image: A("wilbur"),   image90s: A90("wilbur") },   // 16 Paul
  { name: "Toodles 2",     image: A("toodles"),  image90s: A90("toodles") },  // 17 Tony
  { name: "Bentley B.",    image: A("bentley"),  image90s: A90("bentley") },  // 18 Wayne
  { name: "Stash Jr.",     image: A("stash"),    image90s: A90("stash") },    // 19 Mike
  { name: "Phil-Phil",     image: A("phillip"),  image90s: A90("phillip") },  // 20 Scott
  { name: "JoJo 2",        image: A("jojo"),     image90s: A90("jojo") },     // 21 Bob
  { name: "Lil Buscemi",   image: A("buscemi"),  image90s: A90("buscemi") },  // 22 Carlos
  { name: "Nala May",      image: A("nala"),     image90s: A90("nala") },     // 23 Matt
];
