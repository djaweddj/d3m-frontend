import { Users, Check } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { Badge, Btn } from "./Ui";
import { fmtTime, pricingBadge, toneFor } from "./scheduleUtils";

export default function SessionRow({ session, onAttendance }) {
  const { t } = useLanguage();
  const tone = toneFor(session.moduleId);
  const pm = pricingBadge(t, session.pricingModel);
  const done = session.attendanceMarked;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-3.5 shadow-sm sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className={`flex w-16 shrink-0 flex-col items-center rounded-xl py-2 ${tone.soft}`}>
          <span className="text-sm font-bold">{fmtTime(session.startTime)}</span>
          <span className="text-[11px] opacity-60">{fmtTime(session.endTime)}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-bold text-ink">{session.moduleName}</h3>
            {session.level && <Badge className="bg-stone-100 text-stone-500">{session.level}</Badge>}
            {pm && <Badge className={pm.cls}>{pm.label}</Badge>}
          </div>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-stone-500">
            <span>{t("schedule.attendance.teacherLabel", { name: session.teacherName })}</span>
            <span>{t("schedule.agenda.enrolledCount", { count: session.enrolledCount ?? 0 })}</span>
          </p>
        </div>
      </div>
      <Btn variant={done ? "soft" : "primary"} icon={done ? Check : Users} onClick={() => onAttendance(session)} className="w-full sm:w-auto">
        {done ? t("schedule.agenda.attendanceDone") : t("schedule.agenda.markAttendance")}
      </Btn>
    </div>
  );
}