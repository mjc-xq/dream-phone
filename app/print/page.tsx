import Image from "next/image";
import Link from "next/link";
import { BOYS, imageForBoy, imageForPvp } from "@/lib/game/cards";
import { PrintButton } from "./PrintButton";

export const metadata = {
  title: "Print — Dream Phone Cards",
};

export default function PrintPage() {
  return (
    <div className="print-root min-h-dvh bg-white text-black p-6">
      <div className="no-print mb-6 flex items-center justify-between flex-wrap gap-3">
        <Link href="/" className="dp-btn dp-btn-purple">← Back</Link>
        <h1 className="text-2xl sm:text-3xl font-black uppercase">Print Cards</h1>
        <PrintButton />
      </div>

      <p className="no-print text-sm opacity-70 mb-6 max-w-2xl">
        This page lays the boy cards, PvP cards, card back, and clue card out for a home printer.
        Tap <strong>🖨 Print</strong> or use your browser&apos;s print dialog. Save as PDF from the
        print dialog if you want a PDF. 9 cards per Letter/A4 page in landscape works well.
      </p>

      <section className="mb-8">
        <h2 className="no-print text-lg font-black uppercase mb-2 text-dp-magenta">Boy Cards (24)</h2>
        <div className="print-grid grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {BOYS.map((b) => (
            <PrintCard key={b.id} src={imageForBoy(b)} alt={`${b.name} card`} />
          ))}
        </div>
      </section>

      <section className="mb-8 page-break-before">
        <h2 className="no-print text-lg font-black uppercase mb-2 text-dp-magenta">PvP Cards</h2>
        <div className="print-grid grid grid-cols-3 gap-3">
          <PrintCard src={imageForPvp("hangup")} alt="Mom Says Hang Up" />
          <PrintCard src={imageForPvp("share_secret")} alt="Share a Secret" />
          <PrintCard src={imageForPvp("speakerphone")} alt="Speakerphone" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="no-print text-lg font-black uppercase mb-2 text-dp-magenta">Card Back</h2>
        <div className="print-grid grid grid-cols-3 gap-3">
          <PrintCard src="/assets/boys/card-back.jpg" alt="Card back" />
        </div>
      </section>

      <section className="page-break-before">
        <h2 className="no-print text-lg font-black uppercase mb-2 text-dp-magenta">Clue Card</h2>
        <div className="relative w-full max-w-3xl mx-auto">
          <Image
            src="/assets/clue-card.png"
            alt="Clue card"
            width={1200}
            height={1600}
            className="w-full h-auto"
            priority
          />
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
