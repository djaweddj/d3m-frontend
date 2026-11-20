import { TrendingUp, TrendingDown } from "lucide-react";
import Reveal from "../home/Reveal";
import { useCountUp, formatNumber } from "../home/useCountUp";

export default function DashStat({ icon: Icon, label, value, suffix = "", trend, trendLabel, sub, locale, delay = 0 }) {
  const { display, ref } = useCountUp(value ?? null);
  const Arrow = trend >= 0 ? TrendingUp : TrendingDown;
  return (
    <Reveal delay={delay} y={12} className="h-full">
      <div ref={ref} className="h-full rounded-sm bg-white p-4 sm:p-5">
        <span className="mb-3 grid size-9 place-items-center rounded-sm bg-ink text-gold">
          <Icon className="size-4" strokeWidth={1.5} />
        </span>
        <p className="text-xs text-ink/60">{label}</p>
        <p className="mt-1 truncate font-display text-xl tabular-nums text-ink sm:text-2xl">
          {value == null ? "—" : <>{formatNumber(display, locale)}{suffix}</>}
        </p>
        {trend != null ? (
          <p className={`mt-1 flex items-center gap-1 text-xs font-bold ${trend >= 0 ? "text-green-600" : "text-algeria-red"}`}>
            <Arrow className="size-3" />{Math.abs(trend).toFixed(0)}% {trendLabel}
          </p>
        ) : sub && <p className="mt-1 text-xs text-ink/40">{sub}</p>}
      </div>
    </Reveal>
  );
}