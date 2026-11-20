import { CalendarX } from "lucide-react";
import PageHeader from "../components/dash/PageHeader";
import DashCard from "../components/dash/DashCard";
import { Pill, EmptyState, ErrorNote } from "../components/home/ui";
import { Page, Loading } from "../components/teacherdash/teacherBits";
import { teacherApi } from "../components/teacherdash/api";
import useFetch from "../components/teacherdash/useFetch";
import { DAY_ORDER, DAY_LABELS, formatTime } from "../components/teacherdash/format";

export default function TeacherSchedule() {
  const { data: modules, loading, error } = useFetch(teacherApi.modules, []);

  const byDay = Object.fromEntries(DAY_ORDER.map((d) => [d, []]));
  (modules || []).forEach((m) =>
    (m.schedules || []).forEach((s) => byDay[s.day]?.push({ ...s, module: m }))
  );
  Object.values(byDay).forEach((l) => l.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || "")));
  const days = DAY_ORDER.filter((d) => byDay[d].length);

  return (
    <Page wide>
      <PageHeader title="جدول الحصص" subtitle="نظرة أسبوعية على حصصك، مرتبة حسب اليوم والوقت." />
      <ErrorNote msg={error} />

      {loading ? <Loading />
        : days.length === 0 ? <EmptyState icon={CalendarX} title="لا توجد حصص مبرمجة بعد" />
        : days.map((day) => (
          <DashCard key={day} title={DAY_LABELS[day]} action={<Pill tone="gold">{byDay[day].length} حصص</Pill>}>
            <div className="grid gap-3 md:grid-cols-2">
              {byDay[day].map(({ module: m, startTime, endTime }, i) => (
                <div key={i} className="flex items-center gap-4 bg-canvas p-4">
                  <div className="grid w-16 shrink-0 place-items-center bg-green-deep py-2 text-center" dir="ltr">
                    <span className="font-display text-sm tabular-nums text-gold">{formatTime(startTime)}</span>
                    <span className="text-xs tabular-nums text-ivory/60">{formatTime(endTime)}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate font-display text-sm text-ink">{m.name}</h4>
                    <p className="truncate text-xs text-ink/60">{m.subjectName} · {m.classroomName} · {m.level}</p>
                    <p className="mt-1 text-xs text-ink/40">{m.enrolledCount} / {m.maxStudents} تلميذ</p>
                  </div>
                </div>
              ))}
            </div>
          </DashCard>
        ))}
    </Page>
  );
}
