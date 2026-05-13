import Link from "next/link";
import { BOYS, imageForBoy, imageForPvp } from "@/lib/game/cards";
import { PrintButton } from "../PrintButton";

export const metadata = { title: "Print — Boy Cards" };

export default function PrintCardsPage() {
  return (
    <div className="print-root min-h-dvh bg-white text-black p-6">
      <div className="no-print mb-6 flex items-center justify-between flex-wrap gap-3">
        <Link href="/print" className="dp-btn dp-btn-purple">← Hub</Link>
        <h1 className="text-2xl sm:text-3xl font-black uppercase">Boy Cards (24)</h1>
        <PrintButton />
      </div>
      <p className="no-print text-sm opacity-70 mb-6 max-w-2xl">
        Six cards per row at print size. Cut along the edges. PvP cards and card back on the second page.
      </p>

      <section>
        <div className="print-grid grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {BOYS.map((b) => (
            <PrintCard key={b.id} src={imageForBoy(b)} alt={`${b.name} card`} />
          ))}
        </div>
      </section>

      <section className="mt-8 page-break-before">
        <h2 className="no-print text-lg font-black uppercase mb-2">PvP Cards + Card Back</h2>
        <div className="print-grid grid grid-cols-3 sm:grid-cols-4 gap-3">
          <PrintCard src={imageForPvp("hangup")} alt="Mom Says Hang Up" />
          <PrintCard src={imageForPvp("share_secret")} alt="Share a Secret" />
          <PrintCard src={imageForPvp("speakerphone")} alt="Speakerphone" />
          <PrintCard src="/assets/boys/card-back.jpg" alt="Card back" />
        </div>
      </section>
    </div>
  );
}

function PrintCard({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="print-card relative w-full aspect-[3/4] border border-black overflow-hidden bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-contain" />
    </div>
  );
}
