import Image from "next/image";
import Link from "next/link";
import { PrintButton } from "../PrintButton";

export const metadata = { title: "Print — Game Board" };

export default function PrintBoardPage() {
  return (
    <div className="print-root min-h-dvh bg-white text-black p-6">
      <div className="no-print mb-6 flex items-center justify-between flex-wrap gap-3">
        <Link href="/print" className="dp-btn dp-btn-purple">← Hub</Link>
        <h1 className="text-2xl sm:text-3xl font-black uppercase">Game Board</h1>
        <PrintButton />
      </div>
      <p className="no-print text-sm opacity-70 mb-6 max-w-2xl">
        Print on Letter or A4 landscape. Use &ldquo;Fit to page&rdquo; in your print dialog.
      </p>

      <section className="page-break-before">
        <div className="relative w-full max-w-5xl mx-auto">
          <Image
            src="/assets/board.jpg"
            alt="Dream Phone game board"
            width={2000}
            height={1400}
            className="w-full h-auto"
            priority
          />
        </div>
      </section>
    </div>
  );
}
