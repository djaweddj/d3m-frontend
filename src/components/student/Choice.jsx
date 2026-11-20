import { Check } from "lucide-react";

export function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
        active
          ? "border-gold bg-green-deep text-gold"
          : "border-gold/30 bg-white text-green-deep/70 hover:border-gold"
      }`}
    >
      {children}
    </button>
  );
}

export function ChoiceRow({ active, onClick, badge, title, meta }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center gap-3 rounded-sm border p-3 text-start transition-colors ${
        active ? "border-gold bg-green-deep text-ivory" : "border-gold/25 bg-white text-green-deep hover:border-gold"
      }`}
    >
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-sm text-[10px] font-bold ${
          active ? "bg-gold text-green-deep" : "bg-green-deep text-gold"
        }`}
      >
        {badge}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display">{title}</span>
        {meta && <span className={`block truncate text-xs ${active ? "text-ivory/70" : "text-green-deep/60"}`}>{meta}</span>}
      </span>
      {active && <Check className="size-4 shrink-0 text-gold" />}
    </button>
  );
}