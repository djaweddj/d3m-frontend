import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { todayYM, shiftYM, parseYM, ymToStr } from "./DashUtils";

const input = "h-9 flex-1 rounded-sm bg-canvas px-2 text-xs text-ink outline-none focus:ring-2 focus:ring-accent/40";

export default function MonthRangePicker({ from, to, onChange, t, months }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const ymLabel = ({ y, m }) => `${months[m - 1]} ${y}`;

  useEffect(() => {
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const presets = [
    { label: t("dashboard.range.presets.threeMonths"), n: 3 },
    { label: t("dashboard.range.presets.sixMonths"), n: 6 },
    { label: t("dashboard.range.presets.twelveMonths"), n: 12 },
  ];
  const applyPreset = (n) => {
    const end = todayYM();
    onChange({ from: shiftYM(end, -(n - 1)), to: end });
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button onClick={() => setOpen((o) => !o)} className="flex h-9 items-center gap-2 rounded-sm bg-white px-3 text-xs font-bold text-ink hover:bg-ink/5">
        {ymLabel(from)} – {ymLabel(to)}
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute start-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-2.5rem)] rounded-sm bg-white p-3 shadow-xl">
          <div className="mb-3 flex gap-2">
            {presets.map((p) => (
              <button key={p.n} onClick={() => applyPreset(p.n)} className="h-8 flex-1 rounded-sm bg-canvas text-xs text-ink hover:bg-accent/10 hover:text-accent">
                {p.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="flex items-center justify-between gap-2 text-xs text-ink/60">
              {t("dashboard.range.from")}
              <input type="month" className={input} value={ymToStr(from)} max={ymToStr(to)}
                onChange={(e) => onChange({ from: parseYM(e.target.value), to })} />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs text-ink/60">
              {t("dashboard.range.to")}
              <input type="month" className={input} value={ymToStr(to)} min={ymToStr(from)} max={ymToStr(todayYM())}
                onChange={(e) => onChange({ from, to: parseYM(e.target.value) })} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}