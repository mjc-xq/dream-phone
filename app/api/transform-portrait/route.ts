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
    "CRITICAL — ABSOLUTELY NO TEXT, LETTERS, NUMBERS, LOGOS, WATERMARKS, SIGNAGE, BORDERS, FRAMES, OR UI in the image of any kind.";

  const task =
    "TASK: This is an IMAGE EDIT, not a new generation. Take the supplied photograph and edit ONLY the hairstyle, clothing, and background to match an authentic 1992 American high-school yearbook portrait. Everything else about the person must be unchanged.";

  const identity = [
    "IDENTITY PRESERVATION — NON-NEGOTIABLE: The output MUST be recognizable as the EXACT SAME individual in the input photo. Anyone who knows them must instantly identify them.",
    "Preserve, do not invent: face shape, jawline, cheekbones, chin, brow shape, eye shape, eye color, nose shape, nose width, lips, smile shape, teeth, skin tone, freckles, moles, glasses (if present), facial hair (if present), gender presentation, ethnicity, approximate age, and any visible scars or birthmarks.",
    "Do NOT slim, smooth, or beautify the face. Do NOT change the eye color or skin tone. Do NOT make the subject look younger/older than they are. Do NOT swap gender or ethnicity. The face is the input — only the hair, clothes, and backdrop are repainted.",
    "Subject fallback: If the supplied image does not contain a clear human face, use a gender-ambiguous, racially-ambiguous young person as the base — but never invent a face when one is given.",
  ].join("\n");

  const style = [
    "STYLE: photorealistic 35mm school-portrait photograph from 1992. NOT illustration, NOT 3D, NOT painting, NOT stylized. Soft film grain, gentle warm color cast on skin, slightly soft focus typical of school-portrait lenses.",
    "Hair: choose a believable early-90s style that flatters their face — feathered curtains, mall bangs with crimp, slicked side-part, mushroom cut, big curly perm, blowout, high pony with scrunchie, half-up clip, or short undercut as appropriate. Hair texture and base color stay close to the original.",
    "Clothing: a single mall-store 90s outfit, head-and-shoulders visible — pick one: oversized denim jacket over color-blocked tee, neon windbreaker, flannel over band tee, fitted turtleneck, varsity letterman, polo with popped collar, baby tee with choker, sweater vest. Visible accessories: scrunchie, choker, hoop earrings, slap bracelet, plastic clip — used sparingly.",
    "Background: classic 1992 studio backdrop — mottled / laser-streak / pastel-cloud — uniform, no environment, no props. Soft side-fill key light, no harsh shadow.",
  ].join("\n");

  const framing =
    "FRAMING: head-and-shoulders portrait, subject centered, occupying 65–75% of frame height, slight 3/4 turn with eyes to camera. Friendly closed-lip or soft-smile expression. Aspect ratio 3:4.";

  const negative =
    "DO NOT: cartoonize, anime-ify, output an illustration, alter facial geometry, swap identity, age-shift, beautify, add tattoos that weren't there, change race or gender, add text or signage, or invent jewelry/piercings the subject doesn't have. NO mirror text, NO captions, NO yearbook name plate.";

  return [noText, task, identity, style, framing, negative].join("\n\n");
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
