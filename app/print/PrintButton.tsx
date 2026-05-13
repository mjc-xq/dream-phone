"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      className="dp-btn dp-btn-pink"
      onClick={() => window.print()}
    >
      🖨 Print
    </button>
  );
}
