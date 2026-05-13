import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "gemini-2.5-flash-image";
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 88;
const GENERATION_TIMEOUT_MS = 55_000;

const HANGOUTS = [
  "Crosstown Mall",
  "E.A.T.S. Snack Shop",
  "Reel Movies",
  "Woodland Park",
  "High Tide Beach",
  "Jim's Gym",
] as const;

const CARD_COLORS = [
  { name: "yellow", hex: "#FFD94B" },
  { name: "pink", hex: "#FF6FB1" },
  { name: "teal", hex: "#3DD3D5" },
  { name: "lime", hex: "#A8F045" },
  { name: "orange", hex: "#FF9046" },
  { name: "violet", hex: "#B975FF" },
  { name: "skyblue", hex: "#5DC2FF" },
] as const;

type RequestBody = {
  imageBase64: string;
  mimeType?: string;
  hangout?: string;
  cardColor?: string;
  playerName?: string;
};

async function normalizeImage(b64: string): Promise<{ base64: string; mimeType: "image/jpeg" }> {
  const buf = Buffer.from(b64, "base64");
  const meta = await sharp(buf).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  let pipeline = sharp(buf).rotate();
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true });
  }
  const out = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  return { base64: out.toString("base64"), mimeType: "image/jpeg" };
}

function build90sPrompt(): string {
  const noText =
    "CRITICAL — ABSOLUTELY NO TEXT, LETTERS, NUMBERS, LOGOS, WATERMARKS, SIGNAGE, BORDERS, FRAMES, OR UI in the image of any kind. No yearbook name plate. No watermarks.";

  const task = [
    "TASK: Edit this photograph into an authentic 1992 American school-portrait — like a yearbook headshot from a suburban US high school. This is an IMAGE EDIT of the supplied person, NOT a generation of a new person.",
    "Specifically: keep the face. Replace ONLY the hair, clothing, and background.",
  ].join(" ");

  const identity = [
    "IDENTITY PRESERVATION — NON-NEGOTIABLE: the output must be unmistakably the SAME individual. Anyone who knows them must recognize them at a glance.",
    "Preserve exactly: face shape, jawline, cheekbones, chin, brow position and shape, eye shape, eye color, nose shape, nose width, lip shape, mouth, teeth (if visible), skin tone (do NOT lighten or darken), freckles, moles, glasses (keep if present), facial hair (keep if present), gender presentation, ethnicity, age, and any scars or birthmarks.",
    "Do NOT slim or smooth or beautify the face. Do NOT alter eye color or skin tone. Do NOT youth-shift or age-shift. Do NOT swap gender, age, or ethnicity. The face — geometry and identity — comes from the input untouched.",
    "If the supplied image lacks a clear human face, use a gender-ambiguous, racially-ambiguous teenager as the base — but if a face IS provided, NEVER invent a new one.",
  ].join("\n");

  const aesthetic = [
    "AESTHETIC: photorealistic 35mm color photograph, 1992 American school-portrait. NOT illustration, NOT painting, NOT 3D render, NOT stylized. The image must look like a printed school photo from 1992 — slightly soft focus, faint film grain, warm slight overexposure on the highlights of the skin, subtle halation around bright edges.",
    "Color science of the era: gentle magenta-leaning shadows, warm midtones, very slight desaturation typical of consumer-print processing.",
    "Lens: about 85mm portrait, shallow depth of field but not blown-out, subject sharply in focus.",
  ].join("\n");

  const backdrop = [
    "BACKDROP: a uniform mottled studio backdrop — the standard 1992 school-photo background. Soft cloudy gradient in muted blue-gray, lavender-gray, or warm gray. NO environment, props, doorways, blackboards, or scenery. Just the seamless paper-style backdrop fading darker toward the corners.",
    "LIGHTING: classic school-photographer setup — soft key on the camera-left, gentle fill on the right, mild rim light separating the head from the backdrop. No harsh shadows. Slight hot-spot on the cheek facing the key light.",
  ].join("\n");

  const hairAndClothes = [
    "HAIR: choose a believable early-1990s style that fits the person's existing hair color, texture, and gender presentation. Options for masculine presentation: high-top fade (especially for Black/brown teens — height at the crown, sharp temple lines), curtain bangs with center or side part, feathered mullet-lite, slicked-back undercut, bowl cut for younger teens, gelled spikes, surfer shag. Options for feminine presentation: crimped big hair, sky-high bangs with hairspray volume, side ponytail with scrunchie, half-up half-down with claw clip, butterfly clips, frizzy curls, blunt bob with bangs.",
    "CLOTHING: a single mall-store outfit appropriate for a 1992 school photo. Options: plaid flannel buttoned to the neck, denim jacket over a printed tee, colorblock windbreaker, neon ski jacket, varsity letterman, polo with vertical stripes, oversized graphic sweatshirt (geometric Memphis pattern), turtleneck with vest, layered tees, baby tee with choker, plain tee under a denim jacket. Visible accessories tasteful and few: choker necklace, plastic earrings, slap bracelet, simple chain. Avoid modern logos or contemporary streetwear cuts.",
  ].join("\n");

  const framing =
    "FRAMING: head-and-shoulders portrait, slight 3/4 turn with eyes to camera, subject centered, occupying about 70% of frame height. Top of head ~10% from top edge. Friendly closed-lip or soft-smile expression — NOT a big grin unless the source photo had one. Aspect ratio 3:4 (portrait).";

  const negative = [
    "DO NOT: cartoonize, anime-ify, paint, illustrate, or output anything stylized.",
    "DO NOT alter facial geometry, swap identity, age-shift, or beautify.",
    "DO NOT add tattoos, piercings, or jewelry that aren't in the input.",
    "DO NOT change race or gender presentation.",
    "DO NOT add text, signage, captions, name plates, year stamps, or watermarks.",
    "DO NOT include modern items: smartphones, AirPods, contemporary streetwear logos, modern haircuts (mullets are OK if period-appropriate, but no 2020s fades).",
    "DO NOT add filters or Instagram-style color grading — period-accurate film color only.",
  ].join("\n");

  return [noText, task, identity, aesthetic, backdrop, hairAndClothes, framing, negative].join("\n\n");
}

export async function POST(req: Request) {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "missing_google_key" }, { status: 503 });
  }
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (!body.imageBase64) return NextResponse.json({ error: "missing_image" }, { status: 400 });

  let normalized: { base64: string; mimeType: "image/jpeg" };
  try {
    normalized = await normalizeImage(body.imageBase64);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "bad_image", detail: msg }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = build90sPrompt();

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), GENERATION_TIMEOUT_MS),
    );
    const result = await Promise.race([
      ai.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: normalized.mimeType, data: normalized.base64 } },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: "3:4" },
        },
      }),
      timeout,
    ]);

    let outImg: string | null = null;
    const parts = result?.candidates?.[0]?.content?.parts ?? [];
    for (const p of parts) {
      if (p.inlineData?.data) {
        outImg = p.inlineData.data;
        break;
      }
    }
    if (!outImg) {
      return NextResponse.json({ error: "no_image_returned" }, { status: 502 });
    }
    const hangout = body.hangout && (HANGOUTS as readonly string[]).includes(body.hangout)
      ? body.hangout
      : HANGOUTS[Math.floor(Math.random() * HANGOUTS.length)];
    const cardColor = body.cardColor && CARD_COLORS.find((c) => c.name === body.cardColor)
      ? body.cardColor
      : CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)].name;

    return NextResponse.json({
      imageBase64: outImg,
      mimeType: "image/png",
      hangout,
      cardColor,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "timeout") {
      return NextResponse.json({ error: "timeout" }, { status: 504 });
    }
    const isQuota = /exceeded|spending cap|429|quota/i.test(msg);
    return NextResponse.json(
      { error: isQuota ? "gemini_quota" : "gemini_failed", detail: msg },
      { status: isQuota ? 429 : 502 },
    );
  }
}
