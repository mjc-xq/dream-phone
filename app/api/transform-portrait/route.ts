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
  return [
    "CRITICAL — ABSOLUTELY NO TEXT, LETTERS, NUMBERS, OR LOGOS in the image of any kind.",
    "Edit this photo to look like an authentic early-1990s American high school yearbook portrait. Preserve the subject's identifiable features — face shape, eye color, smile, skin tone, gender presentation, and approximate hair color.",
    "Restyle the subject with iconic early-90s hair: big crimped or feathered styles, side-swept bangs, scrunchies, hair clips, mall bangs, or curtain hair, depending on what suits them best. The hairstyle should be playful, big, and unmistakably from 1992.",
    "Outfit them in 90s mall-store fashion: oversized denim jacket, neon windbreaker, color-blocked sweatshirt, turtleneck, flannel over tee, baby tee, choker necklace, hoop earrings, or scrunchie collar — pick what fits them best.",
    "Lighting: classic studio-portrait light with a soft side fill, no harsh shadows. The subject looks directly at the camera with a friendly, confident, slightly-cheesy yearbook smile.",
    "Background: a uniform mottled studio backdrop in faint pastel gradient (light blue-grey to soft pink) — typical of 1992 school photography. No props, no objects, no environment.",
    "Framing: head-and-shoulders portrait, subject centered, occupying 65–75% of frame height. Slight 3/4 turn, eyes to camera.",
    "Image quality: looks like 35mm photo print, slightly soft focus, mild film grain, very gentle color cast warm-on-skin. Like a freshly-developed photo from 1992.",
    "Output a single edited image of the SAME person, NOT a generic illustration. This must be a photorealistic edit, not cartoon or stylized.",
  ].join("\n\n");
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
    return NextResponse.json({ error: "gemini_failed", detail: msg }, { status: 502 });
  }
}
