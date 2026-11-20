import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pageCount, onChange, prevLabel = "Previous", nextLabel = "Next" }) {
  if (pageCount <= 1) return null;
  const btn =
    "grid size-9 place-items-center rounded-sm border border-gold/40 text-green-deep transition-colors hover:bg-gold disabled:pointer-events-none disabled:opacity-40";
  return (
    <nav className="flex items-center justify-center gap-3" aria-label="Pagination">
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={prevLabel}>
        <ChevronLeft className="size-4 rtl:rotate-180" />
      </button>
      <span className="text-sm tabular-nums text-green-deep/70">{page} / {pageCount}</span>
      <button type="button" className={btn} disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label={nextLabel}>
        <ChevronRight className="size-4 rtl:rotate-180" />
      </button>
    </nav>
  );
}