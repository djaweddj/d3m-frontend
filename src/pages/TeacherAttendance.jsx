import { useEffect, useState } from "react";
import { CalendarX } from "lucide-react";
import PageHeader from "../components/dash/PageHeader";
import DashCard from "../components/dash/DashCard";
import Badge from "../components/dash/Badge";
import NButton from "../components/home/NButton";
import {
  EmptyState, ErrorNote, Modal, ModalHeader, ModalBody, ModalFooter, fieldCls,
} from "../components/home/ui";
import { Page, Loading } from "../components/teacherdash/teacherBits";
import { teacherApi } from "../components/teacherdash/api";
import useFetch from "../components/teacherdash/useFetch";
import { formatTime, todayStr } from "../components/teacherdash/format";

const STATUS_STYLE = {
  PRESENT: "bg-green-deep text-gold",
  ABSENT: "bg-algeria-red text-white",
};

function AttendanceModal({ session, onClose, onSaved }) {
  const { data, loading, error: loadError } = useFetch(() => teacherApi.attendanceSheet(session.id), [session.id]);
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (data) setStudents(data.students || []); }, [data]);

  const setStatus = (id, status) =>
    setStudents((prev) => prev.map((s) => (s.studentId === id ? { ...s, status } : s)));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await teacherApi.markAttendance(session.id, students.map(({ studentId, status }) => ({ studentId, status })));
      onSaved();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal dir="rtl" maxWidth="max-w-2xl" onClose={onClose}>
      <ModalHeader
        title={session.moduleName}
        subtitle={`${formatTime(session.startTime)} – ${formatTime(session.endTime)}`}
        onClose={onClose}
      />
      <ModalBody>
        <ErrorNote msg={error || loadError} />
        {loading ? <Loading label="جاري تحميل قائمة التلاميذ..." /> : (
          <div className="space-y-2">
            {students.map((s) => (
              <div key={s.studentId} className="flex flex-wrap items-center justify-between gap-3 bg-white p-4">
                <span className="text-sm font-bold text-green-deep">{s.fullName}</span>
                <div className="flex gap-2">
                  {[["PRESENT", "حاضر"], ["ABSENT", "غائب"]].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setStatus(s.studentId, key)}
                      aria-pressed={s.status === key}
                      className={`h-9 rounded-sm px-4 text-xs font-bold transition-colors ${
                        s.status === key ? STATUS_STYLE[key] : "bg-sand text-green-deep/60 hover:bg-sand/70"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <NButton variant="gold" onClick={save} disabled={saving || loading} className="flex-1">
          {saving ? "جاري الحفظ..." : "حفظ الحضور"}
        </NButton>
      </ModalFooter>
    </Modal>
  );
}

export default function TeacherAttendance() {
  const [date, setDate] = useState(todayStr);
  const [active, setActive] = useState(null);
  const [version, setVersion] = useState(0); // bump to reload the list after saving
  const { data: sessions, loading, error } = useFetch(() => teacherApi.sessionsByDate(date), [date, version]);

  return (
    <Page>
      <PageHeader title="حصص اليوم" subtitle="اختر حصة لتسجيل حضور التلاميذ.">
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className={`${fieldCls} !h-12 !w-auto bg-white`}
        />
      </PageHeader>

      <ErrorNote msg={error} />

      {loading ? <Loading />
        : !sessions?.length ? <EmptyState icon={CalendarX} title="لا توجد حصص في هذا اليوم" />
        : (
          <div className="grid gap-4 md:grid-cols-2">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s)}
                className="bg-white p-5 text-start transition-colors hover:bg-gold/10"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="font-display text-sm tabular-nums text-ink" dir="ltr">
                    {formatTime(s.startTime)} – {formatTime(s.endTime)}
                  </span>
                  <Badge tone={s.attendanceMarked ? "ok" : "warn"}>
                    {s.attendanceMarked ? "تم التسجيل" : "لم يُسجل بعد"}
                  </Badge>
                </div>
                <h4 className="font-display text-base text-ink">{s.moduleName}</h4>
                <p className="mt-1 text-xs text-ink/60">{s.subjectName} · {s.level}</p>
                <p className="mt-2 text-xs text-ink/40">{s.enrolledCount} تلميذ مسجل</p>
              </button>
            ))}
          </div>
        )}

      {active && (
        <AttendanceModal
          session={active}
          onClose={() => setActive(null)}
          onSaved={() => { setActive(null); setVersion((v) => v + 1); }}
        />
      )}
    </Page>
  );
}
