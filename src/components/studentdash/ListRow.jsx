import { ACCENT } from "./studentUtils";

// One row of any list: [leading] title + meta line [trailing], with a coloured edge on the start side.
// meta = [{ icon?, text }]  (empty texts are skipped)
export default function ListRow({ accent = "gold", leading, title, meta = [], trailing }) {
  const items = meta.filter((m) => m.text);
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-sm border-s-4 bg-canvas p-3 sm:p-4 ${ACCENT[accent]}`}>
      {leading}
      <div className="min-w-40 flex-1">
        <p className="text-sm font-bold text-ink">{title}</p>
        {items.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60">
            {items.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-center gap-1">
                {Icon && <Icon className="size-3 text-gold-deep" />}{text}
              </li>
            ))}
          </ul>
        )}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
    </div>
  );
}
