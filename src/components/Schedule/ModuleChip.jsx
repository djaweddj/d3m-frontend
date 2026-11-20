import { Edit2, Trash2, GripVertical } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { IconBtn } from "./Ui";
import { fmtTime, pricingBadge, toneFor } from "./scheduleUtils";

export default function ModuleChip({ slot, onEdit, onArchive, onDragStart, onDragEnd }) {
  const { t } = useLanguage();
  const tone = toneFor(slot.moduleId);
  const pm = pricingBadge(t, slot.pricingModel);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, slot)}
      onDragEnd={onDragEnd}
      className={`group relative flex select-none items-start justify-between gap-2 rounded-xl p-2.5 transition md:cursor-grab md:hover:-translate-y-px md:hover:shadow-md ${tone.soft}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold">{slot.subjectName ?? slot.moduleName}</p>
        <p className="mt-0.5 text-[11px] opacity-75">{fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] opacity-70">
          {slot.teacherName && <span>{slot.teacherName}</span>}
          {pm && <span className="rounded-md bg-white/60 px-1.5 font-bold">{pm.label}</span>}
        </p>
      </div>
      <GripVertical size={11} className="hidden shrink-0 opacity-20 group-hover:opacity-50 md:block" />
      <div className="flex shrink-0 gap-1 md:absolute md:bottom-1.5 md:end-1.5 md:opacity-0 md:transition md:group-hover:opacity-100">
        <IconBtn icon={Edit2} title={t("schedule.grid.edit")} onClick={(e) => { e.stopPropagation(); onEdit(slot); }} className="md:size-6" />
        <IconBtn icon={Trash2} tone="text-danger" title={t("schedule.grid.archive")} onClick={(e) => { e.stopPropagation(); onArchive(slot); }} className="md:size-6" />
      </div>
    </div>
  );
}