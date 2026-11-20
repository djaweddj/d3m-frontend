import { useState, useRef, useEffect } from "react";
import { Plus, Clock, BookOpen, GripVertical } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { Empty } from "./Ui";
import ModuleChip from "./ModuleChip";
import { DAY_TO_IDX, IDX_TO_DAY, fmtTime, useSlotsFromModules } from "./scheduleUtils";

function DropCell({ dayIdx, time, onDrop, children }) {
  const [over, setOver] = useState(false);
  return (
    <td
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onDrop(dayIdx, time); }}
      className={`align-top p-1 transition ${over ? "rounded-xl bg-brand/5 ring-2 ring-inset ring-gold/60" : ""}`}
    >
      <div className="flex min-h-12 flex-col gap-1">{children}</div>
    </td>
  );
}

function DayList({ slots, days, onAdd, onEdit, onArchive }) {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const daySlots = slots
    .filter((s) => DAY_TO_IDX[s.day] === active)
    .sort((a, b) => fmtTime(a.startTime).localeCompare(fmtTime(b.startTime)));

  return (
    <div className="flex flex-col gap-3 md:hidden">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {days.map((d, i) => (
          <button
            key={d}
            onClick={() => setActive(i)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${active === i ? "bg-brand text-white" : "bg-white text-stone-500"}`}
          >
            {d}
          </button>
        ))}
      </div>
      <button onClick={() => onAdd(active)} className="flex items-center justify-center gap-1.5 rounded-xl bg-gold/15 py-2.5 text-xs font-semibold text-amber-900">
        <Plus size={13} /> {t("schedule.grid.addSessionShort")}
      </button>
      {daySlots.length === 0 ? (
        <div className="rounded-2xl bg-white"><Empty icon={BookOpen} title={t("schedule.grid.emptyTitle")} hint={t("schedule.grid.emptyHint")} /></div>
      ) : (
        daySlots.map((s) => <ModuleChip key={s.slotKey} slot={s} onEdit={onEdit} onArchive={onArchive} />)
      )}
    </div>
  );
}

export default function WeekGrid({ modules, onAddModal, setEditSlot, setArchiveSlot }) {
  const { t } = useLanguage();
  const days = t("schedule.days");
  const baseSlots = useSlotsFromModules(modules);
  const [moved, setMoved] = useState({}); // local-only drag overrides keyed by slotKey
  const dragging = useRef(null);
  useEffect(() => setMoved({}), [modules]);

  const slots = baseSlots.map((s) => moved[s.slotKey] ?? s);

  const handleDrop = (dayIdx, time) => {
    const slot = dragging.current;
    if (!slot) return;
    const [sh, sm] = fmtTime(slot.startTime).split(":").map(Number);
    const [eh, em] = fmtTime(slot.endTime).split(":").map(Number);
    const [nh, nm] = time.split(":").map(Number);
    const endMin = nh * 60 + nm + ((eh * 60 + em) - (sh * 60 + sm));
    const newEnd = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}:00`;
    const origin = baseSlots.find((s) => s.slotKey === slot.slotKey) ?? slot;
    setMoved((prev) => ({ ...prev, [origin.slotKey]: { ...slot, day: IDX_TO_DAY[dayIdx], startTime: `${time}:00`, endTime: newEnd } }));
  };

  const byCell = {};
  const times = new Set();
  slots.forEach((s) => {
    const idx = DAY_TO_IDX[s.day];
    if (idx === undefined) return;
    const time = fmtTime(s.startTime);
    times.add(time);
    (byCell[`${idx}_${time}`] ??= []).push(s);
  });
  const allTimes = [...times].sort();

  return (
    <>
      <DayList slots={slots} days={days} onAdd={onAddModal} onEdit={setEditSlot} onArchive={setArchiveSlot} />

      <div className="hidden flex-col gap-3 md:flex">
        <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
          <table className="w-full min-w-160 table-fixed border-separate border-spacing-0">
            <thead>
              <tr className="bg-paper">
                <th className="w-20 px-3 py-3 text-start text-[11px] font-bold text-stone-400">
                  <Clock size={12} className="me-1 inline align-middle" />{t("schedule.grid.timeHeader")}
                </th>
                {days.map((d, i) => (
                  <th key={d} className="px-2 py-3 text-xs font-bold text-brand">
                    {d}
                    <button onClick={() => onAddModal(i)} className="mx-auto mt-1 flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-amber-900 transition hover:bg-gold/30">
                      <Plus size={9} /> {t("schedule.grid.addSessionShort")}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTimes.length === 0 ? (
                <tr><td colSpan={8}><Empty icon={BookOpen} title={t("schedule.grid.emptyTitle")} hint={t("schedule.grid.emptyHint")} /></td></tr>
              ) : (
                allTimes.map((time) => (
                  <tr key={time}>
                    <td className="px-3 pt-3 align-top text-[11px] font-bold text-stone-400">{time}</td>
                    {days.map((_, dayIdx) => (
                      <DropCell key={dayIdx} dayIdx={dayIdx} time={time} onDrop={handleDrop}>
                        {(byCell[`${dayIdx}_${time}`] ?? []).map((s) => (
                          <ModuleChip
                            key={s.slotKey}
                            slot={s}
                            onEdit={setEditSlot}
                            onArchive={setArchiveSlot}
                            onDragStart={(e, slot) => { dragging.current = slot; e.dataTransfer.effectAllowed = "move"; }}
                            onDragEnd={() => { dragging.current = null; }}
                          />
                        ))}
                      </DropCell>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {slots.length > 0 && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-stone-400"><GripVertical size={11} />{t("schedule.grid.dragHint")}</p>
        )}
      </div>
    </>
  );
}