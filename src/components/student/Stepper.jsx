import { Check } from "lucide-react";

export default function Stepper({ steps = [], current = 0 }) {
  return (
    <ol className="mb-5 flex items-start">
      {steps.map((label, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={i} className={`flex items-start ${i < steps.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`grid size-7 place-items-center rounded-sm border text-xs font-bold transition-colors ${
                  done
                    ? "border-gold bg-gold text-green-deep"
                    : now
                    ? "border-gold bg-white text-gold-deep"
                    : "border-gold/30 bg-white text-green-deep/40"
                }`}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={`whitespace-nowrap text-[10px] ${now ? "font-bold text-green-deep" : "text-green-deep/50"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <span className={`mx-2 mt-3.5 h-px flex-1 ${done ? "bg-gold" : "bg-gold/25"}`} />}
          </li>
        );
      })}
    </ol>
  );
}