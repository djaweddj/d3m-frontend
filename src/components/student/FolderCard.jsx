import Reveal from "../home/Reveal";

export function FolderShell({ active = false, className = "", children }) {
  const tone = active
    ? "border-gold bg-green-deep text-ivory"
    : "border-gold/25 bg-white text-green-deep";
  return (
    <div className={`relative pt-4 ${className}`}>
      <span className={`absolute start-0 top-0 z-10 h-5 w-24 rounded-t-sm border border-b-0 ${tone}`} />
      <div className={`relative h-full rounded-sm rounded-ss-none border p-6 transition-colors duration-500 ${tone}`}>
        {children}
      </div>
    </div>
  );
}

export default function FolderCard({ icon: Icon, title, subtitle, count, countLabel, badge, active, onClick, delay = 0 }) {
  return (
    <Reveal delay={delay} className="h-full">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className="group block h-full w-full text-start transition duration-500 hover:-translate-y-1"
      >
        <FolderShell active={active} className="h-full">
          <div className="flex items-start justify-between gap-4">
            <span
              className={`grid size-12 place-items-center rounded-sm transition-colors ${
                active ? "bg-gold text-green-deep" : "bg-green-deep text-gold group-hover:bg-gold group-hover:text-green-deep"
              }`}
            >
              <Icon className="size-6" strokeWidth={1.5} />
            </span>
            <div className="text-end">
              <div className={`font-display text-3xl tabular-nums ${active ? "text-gold" : "text-green-deep"}`}>{count}</div>
              <div className={`text-xs ${active ? "text-ivory/60" : "text-green-deep/60"}`}>{countLabel}</div>
            </div>
          </div>
          <h4 className="mt-6 font-display text-xl">{title}</h4>
          {subtitle && <p className={`mt-1 text-sm ${active ? "text-ivory/70" : "text-green-deep/60"}`}>{subtitle}</p>}
          {badge && (
            <span
              className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                active ? "bg-gold/20 text-gold" : "bg-gold/15 text-gold-deep"
              }`}
            >
              {badge}
            </span>
          )}
        </FolderShell>
      </button>
    </Reveal>
  );
}