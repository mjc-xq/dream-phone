import Link from "next/link";
import { BOYS } from "@/lib/game/cards";
import { getUniqueValues } from "@/lib/game/engine";
import { PrintButton } from "../PrintButton";

export const metadata = { title: "Print — Clue Card / Notepad" };

const HANGOUTS = [
  "Crosstown Mall",
  "E.A.T.S. Snack Shop",
  "Reel Movies",
  "Woodland Park",
  "High Tide Beach",
  "Jim's Gym",
] as const;

export default function PrintNotepadPage() {
  const u = getUniqueValues();
  const calledChunks: Array<typeof BOYS> = [];
  for (let i = 0; i < 24; i += 6) calledChunks.push(BOYS.slice(i, i + 6));

  return (
    <div className="print-root min-h-dvh bg-white text-black p-6">
      <div className="no-print mb-6 flex items-center justify-between flex-wrap gap-3">
        <Link href="/print" className="dp-btn dp-btn-purple">← Hub</Link>
        <h1 className="text-2xl sm:text-3xl font-black uppercase">Clue Card / Notepad</h1>
        <PrintButton />
      </div>
      <p className="no-print text-sm opacity-70 mb-6 max-w-2xl">
        Redrawn with sharper type so it&apos;s easy to fill in by hand.
        Print 1 per player. Landscape Letter / A4 works best.
      </p>

      <section className="notepad-sheet bg-white text-black mx-auto max-w-5xl border-2 border-black p-6">
        <header className="border-b-4 border-black pb-2 mb-3 flex items-end justify-between">
          <div>
            <div
              className="text-4xl font-black tracking-tight uppercase"
              style={{ fontFamily: '"Georgia", "Times New Roman", serif', letterSpacing: "-0.02em" }}
            >
              Dream Phone <span className="text-base align-top">TM</span>
            </div>
            <div className="text-[11px] uppercase tracking-widest opacity-70 mt-1">
              Player Clue Card · cross things out as you rule them out
            </div>
          </div>
          <div className="text-right text-[11px] uppercase tracking-widest">
            <div>Player: ______________________</div>
            <div className="mt-1">Date: ______________________</div>
          </div>
        </header>

        <div
          className="grid grid-cols-[1.4fr_1fr_1fr] gap-6"
          style={{ fontFamily: '"Trebuchet MS", "Arial", sans-serif' }}
        >
          {/* Called */}
          <div>
            <Section title="Called">
              <div className="grid grid-cols-2 gap-x-4">
                {calledChunks.map((chunk, ci) => (
                  <ul key={ci} className="space-y-0.5">
                    {chunk.map((b) => (
                      <li key={b.id} className="text-sm flex items-baseline gap-1.5">
                        <span className="inline-block w-3 h-3 border-2 border-black rounded-sm shrink-0" />
                        <span className="font-bold">{b.name}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </Section>
          </div>

          {/* Clue columns */}
          <div className="space-y-3">
            <Section title="Hang-Out Clues">
              <ClueList items={u.hangouts} />
            </Section>
            <Section title="Sports Clues">
              <ClueList items={u.sports} />
            </Section>
            <Section title="Food Clues">
              <ClueList items={u.foods} />
            </Section>
            <Section title="Clothing Clues">
              <ClueList items={u.clothing} />
            </Section>
          </div>

          {/* Secret Admirer */}
          <div>
            <Section title="Secret Admirer?">
              <div className="space-y-2">
                {HANGOUTS.map((h) => {
                  const boys = BOYS.filter((b) => b.hangout === h);
                  return (
                    <div key={h} className="border border-black p-1.5">
                      <div
                        className="text-[10px] font-black uppercase tracking-widest mb-1 pb-0.5 border-b border-black"
                        style={{ fontFamily: '"Georgia", serif' }}
                      >
                        {h}
                      </div>
                      <ul className="grid grid-cols-2 gap-x-2">
                        {boys.map((b) => (
                          <li key={b.id} className="text-xs flex items-baseline gap-1">
                            <span className="inline-block w-2.5 h-2.5 border-2 border-black rounded-sm shrink-0" />
                            <span className="font-bold">{b.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        </div>

        <footer className="border-t-2 border-black mt-4 pt-2 flex items-center justify-between text-[10px] uppercase tracking-widest">
          <span>Cockafellow Games</span>
          <span>One sheet per player · pencil recommended</span>
        </footer>
      </section>

      <style>{`
        @media print {
          .notepad-sheet { border: none !important; }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="border-b-2 border-black mb-1 pb-0.5 text-base font-black uppercase tracking-wider"
        style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function ClueList({ items }: { items: string[] }) {
  return (
    <ul className="grid grid-cols-1 gap-y-0.5">
      {items.map((v) => (
        <li key={v} className="text-sm flex items-baseline gap-1.5">
          <span className="inline-block w-3 h-3 border-2 border-black rounded-sm shrink-0" />
          <span>{v}</span>
        </li>
      ))}
    </ul>
  );
}
