import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return NextResponse.json({ error: "missing_key" }, { status: 503 });
  const r = await fetch("https://api.elevenlabs.io/v2/voices?page_size=100", {
    headers: { "xi-api-key": key, Accept: "application/json" },
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    return NextResponse.json({ error: "voices_failed", status: r.status, detail: t }, { status: 502 });
  }
  const data = await r.json();
  type V = { voice_id: string; name: string; category?: string; labels?: Record<string, string>; description?: string };
  const voices = ((data.voices ?? []) as V[]).map((v) => ({
    voice_id: v.voice_id,
    name: v.name,
    category: v.category,
    labels: v.labels,
    description: v.description,
  }));
  return NextResponse.json({ voices });
}
