import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  text: string;
  voiceId: string;
  stability?: number;
  style?: number;
  similarity?: number;
  rate?: number;
};

const cache = new Map<string, ArrayBuffer>();
const MAX_CACHE = 256;

function cacheKey(b: Body) {
  return JSON.stringify(b);
}

export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return NextResponse.json({ error: "missing_key" }, { status: 503 });
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (!body.text || !body.voiceId) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  if (body.text.length > 320) body.text = body.text.slice(0, 320);

  const cKey = cacheKey(body);
  const cached = cache.get(cKey);
  if (cached) {
    return new Response(cached, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "X-Cache": "HIT" },
    });
  }

  const stability = clamp(body.stability ?? 0.45, 0, 1);
  const style = clamp(body.style ?? 0.35, 0, 1);
  const similarity = clamp(body.similarity ?? 0.85, 0, 1);

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(body.voiceId)}?output_format=mp3_44100_128`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: body.text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability,
        similarity_boost: similarity,
        style,
        use_speaker_boost: true,
      },
    }),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    return NextResponse.json({ error: "tts_failed", status: resp.status, detail }, { status: 502 });
  }
  const buf = await resp.arrayBuffer();
  if (cache.size >= MAX_CACHE) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(cKey, buf);
  return new Response(buf, {
    status: 200,
    headers: { "Content-Type": "audio/mpeg", "X-Cache": "MISS" },
  });
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
