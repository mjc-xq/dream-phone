import Link from "next/link";

export const metadata = { title: "Print — Dream Phone" };

export default function PrintHub() {
  return (
    <div className="min-h-dvh bg-white text-black p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <Link href="/" className="dp-btn dp-btn-purple">← Back to game</Link>
          <h1 className="text-2xl sm:text-3xl font-black uppercase">Print &amp; PDF</h1>
        </div>

        <p className="opacity-70 text-sm mb-6">
          Each link opens a print-ready page. Use your browser&apos;s print dialog and choose
          <strong> Save as PDF</strong> if you want a file.
        </p>

        <div className="grid sm:grid-cols-1 gap-3">
          <PrintTile
            href="/print/cards"
            emoji="🎴"
            title="Boy Cards (24)"
            sub="Six cards per page, ready to cut out."
          />
          <PrintTile
            href="/print/guide"
            emoji="📋"
            title="Crush Guide"
            sub="One-page reference: every boy with their hangout, sport/food, and clothing. 90s-themed."
          />
          <PrintTile
            href="/print/notepad"
            emoji="📓"
            title="Clue Card / Notepad"
            sub="Original layout, redrawn with sharper type so it&apos;s easy to fill in."
          />
          <PrintTile
            href="/print/board"
            emoji="🗺"
            title="Game Board"
            sub="Full-page board art. Print on Letter or A4."
          />
          <PrintTile
            href="/print/players"
            emoji="🪪"
            title="Player Cards"
            sub="Your 90s player cards, one per page. Generates from the snapshot saved when you tap &lsquo;Print Player Cards&rsquo; in-game."
          />
        </div>
      </div>
    </div>
  );
}

function PrintTile({ href, emoji, title, sub }: { href: string; emoji: string; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="block p-4 rounded-md border-3 border-black bg-white hover:bg-yellow-50 transition-colors"
      style={{ boxShadow: "5px 5px 0 #1c0030" }}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{emoji}</div>
        <div className="flex-1">
          <div className="font-black text-lg uppercase">{title}</div>
          <div className="text-sm opacity-70" dangerouslySetInnerHTML={{ __html: sub }} />
        </div>
        <div className="text-2xl">→</div>
      </div>
    </Link>
  );
}
