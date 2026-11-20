import { motion } from "framer-motion";

// tabs: [{ key, label, count? }]
export default function FilterTabs({ tabs, active, onChange }) {
  return (
    <div role="tablist" className="flex gap-1 border border-gold/25 bg-white p-1">
      {tabs.map(({ key, label, count }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={`relative flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap px-5 text-sm font-bold transition-colors ${
              isActive ? "text-ivory" : "text-green-deep/60 hover:text-green-deep"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="filter-tab-pill"
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="absolute inset-0 bg-green-deep"
              />
            )}
            <span className="relative">{label}</span>
            {count > 0 && (
              <span
                className={`relative rounded-full px-2 py-0.5 text-xs tabular-nums ${
                  isActive ? "bg-gold text-green-deep" : "bg-gold/15 text-gold-deep"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}