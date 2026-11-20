import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Drawer from "./Drawer";
import Pagination from "./Pagination";
import { formatNumber } from "./useCountUp";

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export default function StudentDrawer({
  open, onClose, group, levelName, students = [], loading, locale, labels, pageSize = 8,
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { setQuery(""); setPage(1); }, [group?.id, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.fullName, s.code, s.phone, s.email].some((v) => v && String(v).toLowerCase().includes(q))
    );
  }, [students, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <Drawer open={open} onClose={onClose} title={group?.name} subtitle={levelName} closeLabel={labels.close}>
      <div className="border-b border-gold/20 p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gold-deep" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder={labels.search}
            className="h-11 w-full rounded-sm border border-gold/40 bg-white ps-10 pe-4 text-sm text-green-deep outline-none transition-colors placeholder:text-green-deep/40 focus:border-gold"
          />
        </label>
        <p className="mt-2 text-xs text-green-deep/60">
          {formatNumber(filtered.length, locale)} {labels.students}
        </p>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-gold/15 overflow-y-auto">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="p-4"><span className="block h-10 animate-pulse bg-sand" /></li>
          ))}
        {!loading && rows.length === 0 && (
          <li className="p-10 text-center text-sm text-green-deep/50">{labels.empty}</li>
        )}
        {!loading && rows.map((s) => (
          <li key={s.id} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-white">
            <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-green-deep text-sm font-bold text-gold">
              {initials(s.fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-green-deep">{s.fullName}</p>
              <p className="truncate text-xs text-green-deep/60">{[s.code, s.phone].filter(Boolean).join(" · ")}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-gold/20 p-4">
        <Pagination page={safePage} pageCount={pageCount} onChange={setPage} prevLabel={labels.prev} nextLabel={labels.next} />
      </div>
    </Drawer>
  );
}