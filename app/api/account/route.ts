import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return NextResponse.json({ error: "missing_key" }, { status: 503 });
  const r = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
    headers: { "xi-api-key": key, Accept: "application/json" },
  });
  if (!r.ok) {
    return NextResponse.json({ error: "lookup_failed", status: r.status, detail: await r.text() }, { status: 502 });
  }
  const data = await r.json();
  return NextResponse.json({
    tier: data.tier,
    status: data.status,
    character_limit: data.character_limit,
    character_count: data.character_count,
    can_use_professional_voices: data.can_use_professional_voices,
    can_use_instant_voice_cloning: data.can_use_instant_voice_cloning,
    can_extend_character_limit: data.can_extend_character_limit,
    next_character_count_reset_unix: data.next_character_count_reset_unix,
  });
}
