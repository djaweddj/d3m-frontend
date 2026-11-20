import { useState } from "react";
import { GraduationCap, Users, ChevronLeft, Search, PackageOpen } from "lucide-react";
import PageHeader from "../components/dash/PageHeader";
import DashCard from "../components/dash/DashCard";
import {
  Avatar, IconTile, ProgressBar, EmptyState, ErrorNote,
  Modal, ModalHeader, ModalBody, TextInput,
} from "../components/home/ui";
import { Page, Loading } from "../components/teacherdash/teacherBits";
import { teacherApi } from "../components/teacherdash/api";
import useFetch from "../components/teacherdash/useFetch";

function StudentsModal({ module: mod, onClose }) {
  const { data: students = [], loading, error } = useFetch(() => teacherApi.studentsByModule(mod.id), [mod.id]);
  const [q, setQ] = useState("");
  const list = (students || []).filter((s) => s.fullName?.toLowerCase().includes(q.toLowerCase()));

  return (
    <Modal dir="rtl" maxWidth="max-w-2xl" onClose={onClose}>
      <ModalHeader
        title={mod.name}
        subtitle={[mod.subjectName, mod.classroomName, mod.level].filter(Boolean).join(" · ")}
        onClose={onClose}
      />
      <ModalBody>
        <div className="relative">
          <TextInput value={q} onChange={setQ} placeholder="ابحث عن تلميذ..." className="!ps-11" />
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-gold-deep" strokeWidth={1.5} />
        </div>

        {loading ? <Loading label="جاري تحميل التلاميذ..." />
          : error ? <ErrorNote msg={error} />
          : list.length === 0 ? <EmptyState icon={Users} title="لا يوجد تلاميذ مسجلون بعد" />
          : (
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((s) => (
                <div key={s.id} className="rounded-sm bg-white p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.fullName} />
                    <div className="min-w-0">
                      <h4 className="truncate font-display text-sm text-green-deep">{s.fullName}</h4>
                      <p className="truncate text-xs text-green-deep/50">{s.email}</p>
                    </div>
                  </div>
                  {(s.parentName || s.parentPhone) && (
                    <div className="mt-3 space-y-0.5 bg-sand/60 p-3 text-xs text-green-deep/70">
                      {s.parentName && <p>ولي الأمر: {s.parentName}</p>}
                      {s.parentPhone && <p dir="ltr" className="text-end">{s.parentPhone}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </ModalBody>
    </Modal>
  );
}

export default function TeacherStudents() {
  const { data: modules, loading, error } = useFetch(teacherApi.modules, []);
  const [selected, setSelected] = useState(null);

  const byLevel = (modules || []).reduce((acc, m) => ((acc[m.level] ||= []).push(m), acc), {});

  return (
    <Page wide>
      <PageHeader title="أقسامي وتلاميذي" subtitle="اختر أحد أقسامك لعرض التلاميذ المسجلين فيه." />
      <ErrorNote msg={error} />

      {loading ? <Loading />
        : !modules?.length ? (
          <EmptyState icon={PackageOpen} title="لا توجد أقسام مسندة إليك بعد" subtitle="سيظهر هنا كل قسم تُسنده إليك إدارة المدرسة." />
        ) : (
          Object.entries(byLevel).map(([level, mods]) => (
            <DashCard key={level} title={`${level} — ${mods.length} أقسام`}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className="group bg-canvas p-5 text-start transition-colors hover:bg-gold/15"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <IconTile icon={GraduationCap} />
                      <ChevronLeft className="size-4 text-ink/40 group-hover:text-gold-deep" />
                    </div>
                    <h4 className="font-display text-base text-ink">{m.name}</h4>
                    <p className="mb-4 mt-1 text-xs text-ink/60">{m.subjectName} · {m.classroomName}</p>
                    <p className="mb-2 text-xs text-ink/60">{m.enrolledCount} / {m.maxStudents} تلميذ</p>
                    <ProgressBar pct={Math.min((m.enrolledCount / Math.max(m.maxStudents, 1)) * 100, 100)} />
                  </button>
                ))}
              </div>
            </DashCard>
          ))
        )}

      {selected && <StudentsModal module={selected} onClose={() => setSelected(null)} />}
    </Page>
  );
}
