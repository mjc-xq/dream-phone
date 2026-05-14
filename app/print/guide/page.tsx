import Link from "next/link";
import { GuideClient } from "./GuideClient";
import { PrintButton } from "../PrintButton";

export const metadata = { title: "Print — Crush Guide" };

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

        <GuideClient />

        <footer className="relative border-t-2 border-black mt-4 pt-2 flex items-center justify-between text-[10px] uppercase tracking-widest">
          <span>Cockafellow Games</span>
          <span>Match the cast to your ruled-out clues to find the crush</span>
        </footer>
      </section>

      <style>{`
        .guide-sheet { max-width: 1080px; }
        @media print {
          @page { size: letter landscape; margin: 0.35in; }
          .print-root { padding: 0 !important; }
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
