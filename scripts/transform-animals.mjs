// One-shot batch: run each /public/assets/animals/*.jpg through Gemini to
// produce a 90s-high-school-yearbook treatment, and save to
// /public/assets/animals-90s/*.jpg. The animals.ts helper picks up the
// transformed images automatically.
//
// Usage:
//   GOOGLE_GENERATIVE_AI_API_KEY=… node scripts/transform-animals.mjs
//
// Reads from .env.local if present.

import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";

const IN = path.join(process.cwd(), "public/assets/animals");
const OUT = path.join(process.cwd(), "public/assets/animals-90s");

const MODEL = "gemini-2.5-flash-image";
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 88;
const TIMEOUT_MS = 60_000;

function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {}
}
loadEnv();

const apiKey =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY (or GOOGLE_API_KEY / GEMINI_API_KEY).");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

function prompt() {
  return [
    "CRITICAL — ABSOLUTELY NO TEXT, LETTERS, NUMBERS, LOGOS, WATERMARKS, SIGNAGE, BORDERS, or UI in the image of any kind.",

    "TASK: Edit this photograph of a real animal into a 1992 American school-portrait of an anthropomorphic teenage version of that EXACT animal. The animal stands or sits upright like a person, framed head-and-shoulders, wearing 90s teen clothing, posed as if for a yearbook photo. This is an IMAGE EDIT of the supplied animal, not a generation of a generic mascot.",

    "ANIMAL IDENTITY PRESERVATION — NON-NEGOTIABLE: keep the exact species, color, markings, ear/snout/beak/shell shape, fur/feather/scale texture, eye color, and unique features of the supplied animal. A guinea pig stays a guinea pig (cavy body, no tail, rounded ears). A pig stays a pig (snout, ears, body shape, coat color). A duck stays a duck (bill, plumage, eye markings). A bearded dragon stays a bearded dragon (scales, beard, head shape). A chinchilla stays a chinchilla (large round ears, dense gray fur, whiskers). A squirrel stays a squirrel (bushy tail visible at shoulder if cropped, ear tufts). A turtle stays a turtle (shell visible behind shoulders, beak). The face MUST be recognizable as the same individual animal that was in the input photo.",

    "POSE: Upright, anthropomorphized — animal's body is human-proportioned but its head, face, fur/feathers/scales, and limbs remain that animal. Plausible head-and-shoulders portrait, slight 3/4 turn, looking at the camera. Friendly closed-mouth or soft expression. Subject occupies ~70% of frame height. 3:4 aspect.",

    "AESTHETIC: photorealistic 35mm color photograph, 1992 American school-portrait. NOT illustration, NOT 3D render, NOT cartoon, NOT anime, NOT Pixar. Soft film grain. Subtle warm overexposure on highlights. Mild halation. Lens behaves like an 85mm portrait. Color science of the era: gentle magenta-leaning shadows, warm midtones, slight desaturation typical of 1990s consumer print.",

    "BACKDROP: classic 1992 school-photo mottled studio backdrop — soft cloudy gradient in muted blue-gray, lavender-gray, or warm gray. NO environment, props, scenery, or animal habitat. Just the seamless studio backdrop fading darker toward the corners.",

    "LIGHTING: school-photographer key on camera-left, gentle fill on the right, mild rim light separating the head from the backdrop. Soft, no harsh shadows.",

    "HAIR / HEAD STYLE for the animal: pick a believable early-90s style that suits the species — if a mammal with hair on its head, give it crimped voluminous bangs, a high pony with scrunchie, a side-part with hairspray, a mullet, or a slicked spike. If reptile / amphibian / bird, do not add human hair; instead style the natural feathers/scales as if groomed for a portrait, or add a single tasteful 90s accessory (scrunchie, slap bracelet, plastic earring) where appropriate to the species.",

    "CLOTHING: one mall-store early-90s outfit appropriate for a teen: oversized denim jacket over a colorblock tee, neon windbreaker, flannel over a band tee, polo with vertical stripes, baby tee with choker, varsity letterman, sweater vest, plaid button-up. Strong hot pink / teal / electric yellow / lime / royal purple / black accents. Memphis-pattern geometric prints OK. The clothing fits the anthropomorphic upper body without obscuring the species.",

    "DO NOT cartoonize. DO NOT anime. DO NOT make it Disney. DO NOT change the species. DO NOT change fur/feather/scale color. DO NOT add a different animal's features. DO NOT add a smartphone, AirPods, modern logo, or contemporary streetwear. DO NOT include text or signage. DO NOT include the original habitat (no barn, no cage, no enclosure, no grass).",
  ].join("\n\n");
}

async function normalizeImage(buf) {
  return await sharp(buf)
    .rotate()
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}

async function processOne(file) {
  const inPath = path.join(IN, file);
  const outPath = path.join(OUT, file.replace(/\.(jpe?g|png)$/i, ".jpg"));

  // Skip if already done
  try {
    await fs.stat(outPath);
    console.log(`skip: ${file} (already exists)`);
    return;
  } catch {}

  const raw = await fs.readFile(inPath);
  const jpg = await normalizeImage(raw);
  const b64 = jpg.toString("base64");

  console.log(`gemini: ${file} (${(jpg.length / 1024).toFixed(0)} KB)`);

  const result = await Promise.race([
    ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: b64 } },
            { text: prompt() },
          ],
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: "3:4" },
      },
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
  ]);

  const parts = result?.candidates?.[0]?.content?.parts ?? [];
  let outB64 = null;
  for (const p of parts) {
    if (p.inlineData?.data) {
      outB64 = p.inlineData.data;
      break;
    }
  }
  if (!outB64) {
    console.warn(`  no image returned for ${file}`);
    return;
  }
  // Re-encode through sharp to land on JPEG (Gemini returns PNG).
  const outBuf = await sharp(Buffer.from(outB64, "base64"))
    .resize(900)
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  await fs.mkdir(OUT, { recursive: true });
  await fs.writeFile(outPath, outBuf);
  console.log(`  wrote: ${path.relative(process.cwd(), outPath)} (${(outBuf.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const all = (await fs.readdir(IN)).filter((f) => /\.(jpe?g|png)$/i.test(f));
  for (const f of all) {
    try {
      await processOne(f);
    } catch (e) {
      console.error(`  ERROR ${f}:`, e?.message ?? String(e));
    }
  }
  console.log("done.");
}
main();
