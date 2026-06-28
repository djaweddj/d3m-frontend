import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";

// ─── API ──────────────────────────────────────────────────────────────────────
const fetchSubjects    = ()         => api.get("/api/subjects").then(r => r.data);
const createSubject    = (data)     => api.post("/api/subjects", data).then(r => r.data);
const updateSubject    = (id, data) => api.put(`/api/subjects/${id}`, data).then(r => r.data);
const archiveSubject   = (id)       => api.patch(`/api/subjects/${id}/archive`).then(r => r.data);
const fetchClassrooms  = ()         => api.get("/api/classrooms").then(r => r.data);
const createClassroom  = (data)     => api.post("/api/classrooms", data).then(r => r.data);
const updateClassroom  = (id, data) => api.put(`/api/classrooms/${id}`, data).then(r => r.data);
const fetchTeachers    = ()         => api.get("/api/teachers").then(r => r.data);

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_SUBJECT   = { name: "", description: "", teacherId: "" };
const EMPTY_CLASSROOM = { name: "", capacity: "" };

// ─── Shared UI ────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { key: "subjects",   label: "المواد الدراسية"  },
    { key: "classrooms", label: "الفصول الدراسية" },
  ];
  return (
    <div className="flex gap-2 mb-6">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
            active === t.key
              ? "bg-[#185FA5] text-white shadow"
              : "bg-white text-gray-500 border border-gray-200 hover:border-[#185FA5] hover:text-[#185FA5]"
          }`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Modal({ open, title, onClose, onConfirm, confirmLabel, confirmColor = "blue", children }) {
  if (!open) return null;
  const btnColor =
    confirmColor === "red"   ? "bg-red-500 hover:bg-red-600"      :
    confirmColor === "green" ? "bg-[#0F6E56] hover:bg-[#0a5540]" :
                               "bg-[#185FA5] hover:bg-[#134d8a]";
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
            initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={e => e.stopPropagation()} dir="rtl">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
            <div className="space-y-3">{children}</div>
            <div className="flex gap-2 mt-6 justify-end">
              <button onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
                إلغاء
              </button>
              <button onClick={onConfirm}
                className={`px-4 py-2 rounded-lg text-sm text-white font-semibold transition ${btnColor}`}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5] transition" />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder = "" }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea value={value} placeholder={placeholder} rows={3}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5] transition" />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5] transition bg-white text-gray-800">
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-[#185FA5]/20 border-t-[#185FA5] rounded-full animate-spin" />
    </div>
  );
}

// ─── SUBJECTS TAB ─────────────────────────────────────────────────────────────
function SubjectsTab() {
  const [subjects,      setSubjects]      = useState([]);
  const [teachers,      setTeachers]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [createOpen,    setCreateOpen]    = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [form,          setForm]          = useState(EMPTY_SUBJECT);
  const [submitting,    setSubmitting]    = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true); setError(null);
      const [s, t] = await Promise.all([fetchSubjects(), fetchTeachers()]);
      setSubjects(s);
      setTeachers(t.filter(tc => !tc.archived));
    } catch { setError("فشل تحميل البيانات. حاول مرة أخرى."); }
    finally   { setLoading(false); }
  }

  const teacherOptions = teachers.map(t => ({
    value: String(t.id),
    label: `${t.fullName}${t.specialization ? " — " + t.specialization : ""}`,
  }));

  function openCreate() { setForm(EMPTY_SUBJECT); setCreateOpen(true); }

  async function handleCreate() {
    if (!form.name.trim()) return;
    try {
      setSubmitting(true);
      const created = await createSubject({
        name:        form.name.trim(),
        description: form.description.trim(),
        teacherId:   form.teacherId ? Number(form.teacherId) : null,
      });
      setSubjects(prev => [created, ...prev]);
      setCreateOpen(false);
    } catch { alert("فشل إنشاء المادة."); }
    finally { setSubmitting(false); }
  }

  function openEdit(s) {
    setForm({ name: s.name, description: s.description || "", teacherId: s.teacherId ? String(s.teacherId) : "" });
    setEditTarget(s);
  }

  async function handleEdit() {
    if (!form.name.trim()) return;
    try {
      setSubmitting(true);
      const updated = await updateSubject(editTarget.id, {
        name:        form.name.trim(),
        description: form.description.trim(),
        teacherId:   form.teacherId ? Number(form.teacherId) : null,
      });
      setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s));
      setEditTarget(null);
    } catch { alert("فشل تعديل المادة."); }
    finally { setSubmitting(false); }
  }

  async function handleArchive() {
    try {
      setSubmitting(true);
      await archiveSubject(archiveTarget.id);
      setSubjects(prev => prev.filter(s => s.id !== archiveTarget.id));
      setArchiveTarget(null);
    } catch { alert("فشل أرشفة المادة."); }
    finally { setSubmitting(false); }
  }

  const subjectForm = (
    <>
      <Input label="اسم المادة *" value={form.name}
        onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="مثال: الرياضيات" />
      <Textarea label="وصف المادة" value={form.description}
        onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="وصف اختياري..." />
      <SelectField
        label="الأستاذ المسؤول"
        value={form.teacherId}
        onChange={v => setForm(f => ({ ...f, teacherId: v }))}
        options={teacherOptions}
        placeholder="بدون تخصيص (اختياري)"
      />
    </>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{subjects.length} مادة دراسية</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#185FA5] text-white text-sm font-semibold rounded-xl hover:bg-[#134d8a] transition shadow">
          <span className="text-lg leading-none">+</span> إضافة مادة
        </button>
      </div>

      {loading ? <Spinner /> : error ? (
        <div className="text-center py-10 text-red-500 text-sm">{error}</div>
      ) : subjects.length === 0 ? (
        <EmptyState message="لا توجد مواد دراسية بعد. أضف أول مادة!" />
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {subjects.map(s => (
              <motion.div key={s.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-3"
                dir="rtl">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#185FA5]/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#185FA5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{s.description}</p>
                    )}
                    {s.teacherName ? (
                      <p className="text-xs text-[#185FA5] mt-1">👨‍🏫 {s.teacherName}</p>
                    ) : (
                      <p className="text-xs text-gray-300 mt-1">بدون أستاذ مخصص</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(s)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#185FA5] hover:text-[#185FA5] transition">
                    تعديل
                  </button>
                  <button onClick={() => setArchiveTarget(s)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition">
                    أرشفة
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={createOpen} title="إضافة مادة دراسية جديدة"
        onClose={() => setCreateOpen(false)} onConfirm={handleCreate}
        confirmLabel={submitting ? "جارٍ الحفظ..." : "حفظ"}>
        {subjectForm}
      </Modal>

      <Modal open={!!editTarget} title="تعديل المادة"
        onClose={() => setEditTarget(null)} onConfirm={handleEdit}
        confirmLabel={submitting ? "جارٍ الحفظ..." : "حفظ التغييرات"}>
        {subjectForm}
      </Modal>

      <Modal open={!!archiveTarget} title="تأكيد الأرشفة"
        onClose={() => setArchiveTarget(null)} onConfirm={handleArchive}
        confirmLabel={submitting ? "جارٍ الأرشفة..." : "نعم، أرشف"} confirmColor="red">
        <p className="text-sm text-gray-600">
          هل أنت متأكد من أرشفة مادة{" "}
          <span className="font-semibold text-gray-800">"{archiveTarget?.name}"</span>؟
          <br />لن تظهر في القائمة بعد الأرشفة.
        </p>
      </Modal>
    </div>
  );
}

// ─── CLASSROOMS TAB ───────────────────────────────────────────────────────────
function ClassroomsTab() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form,       setForm]       = useState(EMPTY_CLASSROOM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true); setError(null);
      setClassrooms(await fetchClassrooms());
    } catch { setError("فشل تحميل الفصول. حاول مرة أخرى."); }
    finally { setLoading(false); }
  }

  function openCreate() { setForm(EMPTY_CLASSROOM); setCreateOpen(true); }

  async function handleCreate() {
    if (!form.name.trim() || !form.capacity) return;
    try {
      setSubmitting(true);
      const created = await createClassroom({ name: form.name.trim(), capacity: Number(form.capacity) });
      setClassrooms(prev => [created, ...prev]);
      setCreateOpen(false);
    } catch (err) { alert(err?.response?.data || "فشل إنشاء الفصل."); }
    finally { setSubmitting(false); }
  }

  function openEdit(c) {
    setForm({ name: c.name, capacity: String(c.capacity) });
    setEditTarget(c);
  }

  async function handleEdit() {
    if (!form.name.trim() || !form.capacity) return;
    try {
      setSubmitting(true);
      const updated = await updateClassroom(editTarget.id, { name: form.name.trim(), capacity: Number(form.capacity) });
      setClassrooms(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEditTarget(null);
    } catch { alert("فشل تعديل الفصل."); }
    finally { setSubmitting(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{classrooms.length} فصل دراسي</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F6E56] text-white text-sm font-semibold rounded-xl hover:bg-[#0a5540] transition shadow">
          <span className="text-lg leading-none">+</span> إضافة فصل
        </button>
      </div>

      {loading ? <Spinner /> : error ? (
        <div className="text-center py-10 text-red-500 text-sm">{error}</div>
      ) : classrooms.length === 0 ? (
        <EmptyState message="لا توجد فصول دراسية بعد. أضف أول فصل!" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {classrooms.map(c => (
              <motion.div key={c.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4" dir="rtl">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#0F6E56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <button onClick={() => openEdit(c)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#0F6E56] hover:text-[#0F6E56] transition">
                    تعديل
                  </button>
                </div>
                <p className="font-bold text-gray-800 text-base">{c.name}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs text-gray-500">السعة: {c.capacity} طالب</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={createOpen} title="إضافة فصل دراسي جديد"
        onClose={() => setCreateOpen(false)} onConfirm={handleCreate}
        confirmLabel={submitting ? "جارٍ الحفظ..." : "حفظ"} confirmColor="green">
        <Input label="اسم الفصل *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="مثال: 1A" />
        <Input label="السعة (عدد الطلاب) *" type="number" value={form.capacity} onChange={v => setForm(f => ({ ...f, capacity: v }))} placeholder="مثال: 30" />
      </Modal>

      <Modal open={!!editTarget} title="تعديل الفصل"
        onClose={() => setEditTarget(null)} onConfirm={handleEdit}
        confirmLabel={submitting ? "جارٍ الحفظ..." : "حفظ التغييرات"} confirmColor="green">
        <Input label="اسم الفصل *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <Input label="السعة (عدد الطلاب) *" type="number" value={form.capacity} onChange={v => setForm(f => ({ ...f, capacity: v }))} />
      </Modal>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SubjectsAndClassrooms() {
  const [activeTab, setActiveTab] = useState("subjects");

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">المواد والفصول الدراسية</h1>
        <p className="text-sm text-gray-400 mt-1">إدارة المواد الدراسية والفصول الخاصة بمدرستك</p>
      </div>
      <TabBar active={activeTab} onChange={setActiveTab} />
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}>
          {activeTab === "subjects" ? <SubjectsTab /> : <ClassroomsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}