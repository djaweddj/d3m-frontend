import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Drawer from "./Drawer";
import Pagination from "./Pagination";

const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

export default function GroupStudentsDrawer({
  open, onClose, title, subtitle, dir, students = [], labels,
  resetKey, pageSize = 8, showLevel = false, closeOnEsc = true,
  onSelect, renderActions, toolbarEnd,
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { setQuery(""); setPage(1); }, [resetKey, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.fullName, s.email, s.parentPhone, s.parentName].some((v) => v && String(v).toLowerCase().includes(q))
    );
  }, [students, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <Drawer
      open={open} onClose={onClose} title={title} subtitle={subtitle}
      dir={dir} closeLabel={labels.close} closeOnEsc={closeOnEsc}
    >
      <div className="border-b border-gold/20 p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gold-deep" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder={labels.search}
            className="h-11 w-full rounded-sm border border-gold/40 bg-white ps-10 pe-4 text-base text-green-deep outline-none transition-colors placeholder:text-green-deep/40 focus:border-gold"
          />
        </label>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-green-deep/60">{filtered.length} {labels.count}</p>
          {toolbarEnd}
        </div>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-gold/15 overflow-y-auto">
        {rows.length === 0 && (
          <li className="p-10 text-center text-sm text-green-deep/50">{labels.empty}</li>
        )}
        {rows.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white">
            <button
              type="button"
              onClick={() => onSelect?.(s)}
              className="flex min-w-0 flex-1 items-center gap-4 text-start"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-green-deep text-sm font-bold text-gold">
                {initials(s.fullName)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-green-deep">{s.fullName}</span>
                <span className="block truncate text-xs text-green-deep/60">
                  <span dir="ltr">{s.email || "—"}</span>
                  {" · "}{s.parentPhone || "—"}
                  {showLevel && s.level ? ` · ${s.level}` : ""}
                </span>
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-2">{renderActions?.(s)}</div>
          </li>
        ))}
      </ul>

      <div className="border-t border-gold/20 p-4">
        <Pagination
          page={safePage} pageCount={pageCount} onChange={setPage}
          prevLabel={labels.prev} nextLabel={labels.next}
        />
      </div>
    </Drawer>
  );
}