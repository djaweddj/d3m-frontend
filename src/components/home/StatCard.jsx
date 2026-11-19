import Reveal from "./Reveal";
import { useCountUp, formatNumber } from "./useCountUp";

export default function StatCard({ icon: Icon, value, label, loading, locale, delay = 0 }) {
  const { display, ref } = useCountUp(loading ? null : value);
  return (
    <Reveal delay={delay} className="h-full">
      <div ref={ref} className="h-full border-t-2 border-gold bg-white px-6 py-10 text-center">
        <Icon className="mx-auto mb-4 size-7 text-gold-deep" strokeWidth={1.5} />
        <div className="font-display text-5xl tabular-nums text-green-deep">
          {loading
            ? <span className="inline-block h-12 w-24 animate-pulse bg-sand align-middle" />
            : <>{formatNumber(display, locale)}+</>}
        </div>
        <p className="mt-2 text-sm text-green-deep/60">{label}</p>
      </div>
    </Reveal>
  );
}