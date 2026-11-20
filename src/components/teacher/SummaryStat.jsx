import Reveal from "../home/Reveal";

export default function SummaryStat({ icon: Icon, label, value, sub, delay = 0 }) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className="flex h-full items-center gap-4 border-t-2 border-gold bg-white p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-sm bg-green-deep text-gold">
          <Icon className="size-6" strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-green-deep/60">{label}</p>
          <p className="font-display text-xl tabular-nums text-green-deep">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-green-deep/50">{sub}</p>}
        </div>
      </div>
    </Reveal>
  );
}
