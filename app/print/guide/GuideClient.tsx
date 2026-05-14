"use client";

import { useEffect, useState } from "react";
import { BOYS, displayName } from "@/lib/game/cards";
import type { GameMode } from "@/lib/game/types";

const HANGOUTS = [
  "Crosstown Mall",
  "E.A.T.S. Snack Shop",
  "Reel Movies",
  "Woodland Park",
  "High Tide Beach",
  "Jim's Gym",
] as const;

const HANGOUT_TONE: Record<string, string> = {
  "Crosstown Mall": "#FF6FB1",
  "E.A.T.S. Snack Shop": "#FFD94B",
  "Reel Movies": "#B975FF",
  "Woodland Park": "#A8F045",
  "High Tide Beach": "#5DC2FF",
  "Jim's Gym": "#FF9046",
};

export function GuideClient() {
  const [mode, setMode] = useState<GameMode>("boys");
  useEffect(() => {
    if (typeof window === "undefined") return;
    let next: GameMode | null = null;
    try {
      const raw = window.localStorage.getItem("dp_game_mode");
      if (raw === "animals" || raw === "boys") next = raw;
    } catch {}
    if (next) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(next);
    }
  }, []);

  return (
    <>
      <div className="no-print mb-4 flex items-center gap-2 flex-wrap">
        <span className="text-sm font-black uppercase tracking-widest opacity-70">Roster:</span>
        <button
          type="button"
          className={`dp-btn ${mode === "boys" ? "dp-btn-teal" : ""} text-sm py-1.5 px-3`}
          onClick={() => setMode("boys")}
        >
          🧑 Boys
        </button>
        <button
          type="button"
          className={`dp-btn ${mode === "animals" ? "dp-btn-teal" : ""} text-sm py-1.5 px-3`}
          onClick={() => setMode("animals")}
        >
          🐷 Animals
        </button>
      </div>

      <div
        className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        style={{ fontFamily: '"Trebuchet MS", "Arial", sans-serif' }}
      >
        {HANGOUTS.map((h) => {
          const boys = BOYS.filter((b) => b.hangout === h);
          const tone = HANGOUT_TONE[h];
          return (
            <section
              key={h}
              className="border-2 border-black rounded-md overflow-hidden break-inside-avoid"
              style={{ background: "white", boxShadow: `4px 4px 0 ${tone}` }}
            >
              <header
                className="px-3 py-1.5 border-b-2 border-black flex items-center gap-2"
                style={{ background: tone, color: "#1c0030" }}
              >
                <div
                  className="text-sm font-black uppercase tracking-tight"
                  style={{ fontFamily: '"Georgia", serif' }}
                >
                  {h}
                </div>
                <span className="ml-auto text-[10px] font-black uppercase opacity-80">
                  {boys.length}
                </span>
              </header>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-black/5 border-b border-black">
                    <th className="text-left px-2 py-0.5 font-black uppercase tracking-wider text-[10px]">
                      Name
                    </th>
                    <th className="text-left px-1 py-0.5 font-black uppercase tracking-wider text-[10px]">
                      Phone
                    </th>
                    <th className="text-left px-1 py-0.5 font-black uppercase tracking-wider text-[10px]">
                      Sport / Food
                    </th>
                    <th className="text-left px-2 py-0.5 font-black uppercase tracking-wider text-[10px]">
                      Wears
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {boys.map((b, i) => (
                    <tr
                      key={b.id}
                      className={`border-t border-black/40 ${i % 2 === 0 ? "" : "bg-black/[0.03]"}`}
                    >
                      <td className="px-2 py-1 font-black">{displayName(b, mode)}</td>
                      <td className="px-1 py-1 font-mono text-[11px]">{b.phone}</td>
                      <td className="px-1 py-1">{b.sport ?? b.food ?? "—"}</td>
                      <td className="px-2 py-1 font-bold">{b.clothing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </>
  );
}
