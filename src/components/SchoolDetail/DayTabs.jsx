import { motion } from "framer-motion";

export default function DayTabs({ days, active, onChange, getLabel, getCount }) {
  return (
    <div
      role="tablist"
      className="mb-6 flex gap-1 overflow-x-auto border border-gold/25 bg-white p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {days.map((day) => {
        const isActive = active === day;
        return (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(day)}
            className={`relative flex h-11 shrink-0 items-center gap-2 px-5 text-sm font-bold transition-colors ${
              isActive ? "text-ivory" : "text-green-deep/60 hover:text-green-deep"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="day-tab-pill"
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="absolute inset-0 bg-green-deep"
              />
            )}
            <span className="relative">{getLabel(day)}</span>
            <span
              className={`relative rounded-full px-2 py-0.5 text-xs tabular-nums ${
                isActive ? "bg-ivory/20 text-ivory" : "bg-sand text-green-deep/60"
              }`}
            >
              {getCount(day)}
            </span>
          </button>
        );
      })}
    </div>
  );
}