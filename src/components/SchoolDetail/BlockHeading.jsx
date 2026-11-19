import { Diamond } from "../home/Marks";

// In-column section heading (SectionHeader is the centered, page-level one)
export default function BlockHeading({ title, subtitle, badge }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-3 font-display text-2xl text-green-deep">
          <Diamond className="size-2.5 shrink-0 text-gold" />
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 text-sm text-green-deep/60">{subtitle}</p>}
      </div>
      {badge && (
        <span className="rounded-full border border-gold/40 bg-gold/10 px-4 py-1 text-xs font-bold text-gold-deep">
          {badge}
        </span>
      )}
    </div>
  );
}