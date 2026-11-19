import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const BTN =
  "inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-gold/60 px-5 text-sm font-bold text-green-deep transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

export default function Pagination({ page, totalPages, onChange }) {
  const { t } = useLanguage();
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-14 flex flex-wrap items-center justify-center gap-3" aria-label="Pagination">
      <button type="button" disabled={page === 0} onClick={() => onChange(page - 1)} className={BTN}>
        <ChevronLeft className="size-4 rtl:rotate-180" />
        {t("browseSchools.pagination.prev") || "Prev"}
      </button>

      <span className="grid h-11 min-w-20 place-items-center rounded-sm bg-green-deep px-4 text-sm font-bold tabular-nums text-ivory">
        {page + 1} / {totalPages}
      </span>

      <button type="button" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)} className={BTN}>
        {t("browseSchools.pagination.next") || "Next"}
        <ChevronRight className="size-4 rtl:rotate-180" />
      </button>
    </nav>
  );
}