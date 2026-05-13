import Link from "next/link";
import { BOYS } from "@/lib/game/cards";
import { PrintButton } from "../PrintButton";

export const metadata = { title: "Print — Bayside Crush Guide" };

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

export default function PrintGuidePage() {
  return (
    <div className="print-root min-h-dvh bg-white text-black p-6">
      <div className="no-print mb-6 flex items-center justify-between flex-wrap gap-3">
        <Link href="/print" className="dp-btn dp-btn-purple">← Hub</Link>
        <h1 className="text-2xl sm:text-3xl font-black uppercase">Crush Guide</h1>
        <PrintButton />
      </div>
      <p className="no-print text-sm opacity-70 mb-6 max-w-2xl">
        Quick-reference for who hangs out where, what they like, and what they wear. Print
        landscape, one sheet, hand it around the table.
      </p>

      <section className="guide-sheet mx-auto bg-white text-black p-5 border-2 border-black relative overflow-hidden">
        {/* Memphis confetti decorations behind the content */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.18 }}
        >
          <pattern id="memphis" width="180" height="180" patternUnits="userSpaceOnUse">
            <g fill="none" strokeWidth="3" strokeLinecap="round">
              <path d="M20 60 Q35 40 50 60 T80 60" stroke="#FF2D8A" />
              <circle cx="130" cy="40" r="6" fill="#00D4D0" />
              <polygon points="40,140 55,165 25,165" fill="#FFD400" />
              <rect x="120" y="120" width="14" height="14" transform="rotate(45 127 127)" fill="#8A2BE2" />
              <path d="M80 100 L92 110 L80 110 L88 122" stroke="#FF8A00" />
            </g>
          </pattern>
          <rect width="100%" height="100%" fill="url(#memphis)" />
        </svg>

        <header className="relative border-b-4 border-black pb-3 mb-4 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div
              className="text-3xl sm:text-4xl font-black tracking-tight uppercase leading-none"
              style={{ fontFamily: '"Georgia", "Times New Roman", serif', letterSpacing: "-0.02em" }}
            >
              Crush Guide <span className="text-base align-top">★</span>
            </div>
            <div className="text-[11px] uppercase tracking-widest opacity-70 mt-1">
              Who&apos;s where · what they like · what they wear
            </div>
          </div>
          <div className="text-[11px] uppercase tracking-widest text-right">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#FF2D8A]" />
              <span className="w-3 h-3 rounded-full bg-[#00D4D0]" />
              <span className="w-3 h-3 rounded-full bg-[#FFD400]" />
              <span className="w-3 h-3 rounded-full bg-[#8A2BE2]" />
              <span className="w-3 h-3 rounded-full bg-[#A8F045]" />
              <span className="w-3 h-3 rounded-full bg-[#FF9046]" />
            </div>
            <div className="mt-1">Bayside · 1992</div>
          </div>
        </header>

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
                    {boys.length} boys
                  </span>
                </header>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-black/5 border-b border-black">
                      <th className="text-left px-2 py-0.5 font-black uppercase tracking-wider text-[10px]">Name</th>
                      <th className="text-left px-1 py-0.5 font-black uppercase tracking-wider text-[10px]">Phone</th>
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
                        <td className="px-2 py-1 font-black">{b.name}</td>
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

        <footer className="relative border-t-2 border-black mt-4 pt-2 flex items-center justify-between text-[10px] uppercase tracking-widest">
          <span>Cockafellow Games</span>
          <span>Match the boys to your ruled-out clues to find the crush</span>
        </footer>
      </section>

      <style>{`
        .guide-sheet { max-width: 1080px; }
        @media print {
          @page { size: letter landscape; margin: 0.35in; }
          .guide-sheet {
            max-width: none !important;
            width: 100% !important;
            border: none !important;
            padding: 0 !important;
            font-size: 10pt;
          }
          .guide-sheet section { break-inside: avoid; page-break-inside: avoid; }
          .guide-sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
