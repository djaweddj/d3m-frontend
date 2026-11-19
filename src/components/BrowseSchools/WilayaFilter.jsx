import { ChevronDown, MapPin, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { WILAYAS } from "../Wilayas";

export default function WilayaFilter({ value, onChange }) {
  const { t } = useLanguage();
  const label = t("browseSchools.wilaya") || "Wilaya";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-72">
        <MapPin className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-gold-deep" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="h-12 w-full cursor-pointer appearance-none rounded-sm border border-gold/40 bg-ivory ps-10 pe-10 text-sm text-green-deep outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/40"
        >
          <option value="">{label}</option>
          {WILAYAS.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-green-deep/50" />
      </div>

      <AnimatePresence>
        {value && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 py-1.5 ps-4 pe-2 text-sm font-bold text-gold-deep"
          >
            {value}
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label={t("browseSchools.clearFilter") || "Clear filter"}
              className="grid size-5 place-items-center rounded-full transition-colors hover:bg-gold hover:text-green-deep"
            >
              <X className="size-3.5" />
            </button>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}