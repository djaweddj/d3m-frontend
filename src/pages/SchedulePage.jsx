import { BookOpen, GraduationCap } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import DashCard from "../components/dash/DashCard";
import { EmptyState, IconTile, Pill } from "../components/home/ui";
import ListRow from "../components/studentdash/ListRow";
import ScheduleSlot from "../components/studentdash/ScheduleSlot";
import { WEEK_DAYS, WEEK_ORDER, cycle, fill, fmtTime, moduleIdOf } from "../components/studentdash/studentUtils";

export default function SchedulePage({ enrollments, moduleMap }) {
  const { t } = useLanguage();

  const byDay = Object.fromEntries(WEEK_ORDER.map((k) => [k, []]));
  enrollments.forEach((enr, idx) => {
    const mod = moduleMap[moduleIdOf(enr)];
    if (!mod) return;
    (mod.schedules || []).forEach((sch) => {
      byDay[WEEK_DAYS[sch.dayOfWeek] || sch.dayOfWeek]?.push({ ...sch, mod, idx });
    });
  });

  const rows = enrollments
    .map((enr, i) => ({ enr, i, mod: moduleMap[moduleIdOf(enr)] }))
    .filter((r) => r.mod);

  return (
    <div className="space-y-5">
      <DashCard title={t("studentDashboard.schedule.title")}>
        <div className="grid grid-cols-[repeat(7,minmax(5.5rem,1fr))] gap-2 overflow-x-auto">
          {WEEK_ORDER.map((day) => (
            <div key={day} className="space-y-2">
              <p className="rounded-sm bg-ink py-1.5 text-center text-xs font-bold text-gold">
                {t(`studentDashboard.weekDays.${day}`)}
              </p>
              {byDay[day].length === 0 ? (
                <p className="grid h-12 place-items-center rounded-sm bg-canvas text-xs text-ink/30">—</p>
              ) : (
                byDay[day].map((slot, si) => (
                  <ScheduleSlot
                    key={si}
                    accent={cycle(slot.idx)}
                    subject={slot.mod.subjectName || slot.mod.name || "—"}
                    time={fmtTime(slot.startTime)}
                    room={slot.mod.classroomName}
                  />
                ))
              )}
            </div>
          ))}
        </div>
      </DashCard>

      <DashCard title={t("studentDashboard.schedule.myModules")}>
        {rows.length === 0 ? (
          <EmptyState icon={BookOpen} title={t("studentDashboard.schedule.noModules")} />
        ) : (
          <ul className="space-y-2">
            {rows.map(({ enr, i, mod }) => (
              <li key={enr.id || i}>
                <ListRow
                  accent={cycle(i)}
                  leading={<IconTile icon={BookOpen} tone="gold" />}
                  title={mod.subjectName || mod.name}
                  meta={[
                    { icon: GraduationCap, text: mod.teacherName || "—" },
                    { text: fill(t("studentDashboard.schedule.sessionsPerWeek"), { count: mod.schedules?.length || 0 }) },
                  ]}
                  trailing={<Pill tone="gold">{mod.level}</Pill>}
                />
              </li>
            ))}
          </ul>
        )}
      </DashCard>
    </div>
  );
}
