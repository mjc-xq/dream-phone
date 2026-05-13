import Link from "next/link";
import { PrintCardsClient } from "./PrintCardsClient";

export const metadata = { title: "Print — Boy Cards" };

export default function PrintCardsPage() {
  return (
    <div className="print-root min-h-dvh bg-white text-black p-6">
      <div className="no-print mb-6 flex items-center justify-between flex-wrap gap-3">
        <Link href="/print" className="dp-btn dp-btn-purple">← Hub</Link>
        <h1 className="text-2xl sm:text-3xl font-black uppercase">Boy Cards (24)</h1>
        <div style={{ width: 1 }} />
      </div>
      <PrintCardsClient />
    </div>
  );
}
