import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import useLocale from "./useLocale";
import { currentPeriod, formatPeriod, shiftPeriod } from "./payouts";

const STEP =
  "grid size-8 place-items-center border border-gold/40 bg-white text-green-deep transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white";

export default function MonthStepper({ period, onChange, large = false }) {
  const { dir } = useLanguage();
  const locale = useLocale();
  const rtl = dir === "rtl";
  const canGoForward = period < currentPeriod();
  // In RTL "previous" points right; flipped for LTR
  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(shiftPeriod(period, -1))} className={STEP}>
        <PrevIcon className="size-4" />
      </button>
      <span className={`min-w-28 text-center font-bold text-green-deep ${large ? "text-base" : "text-xs"}`}>
        {formatPeriod(period, locale)}
      </span>
      <button type="button" disabled={!canGoForward} onClick={() => onChange(shiftPeriod(period, 1))} className={STEP}>
        <NextIcon className="size-4" />
      </button>
    </div>
  );
}
