import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { useLanguage } from "../context/LanguageContext";

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
  const { t } = useLanguage();
  const tabs = [
    { key: "subjects",   label: t("subjectsClassrooms.tabs.subjects")   },
    { key: "classrooms", label: t("subjectsClassrooms.tabs.classrooms") },
  ];
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
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
  const { t, dir } = useLanguage();
  if (!open) return null;
  const btnColor =
    confirmColor === "red"   ? "bg-red-500 hover:bg-red-600"      :
    confirmColor === "green" ? "bg-[#0F6E56] hover:bg-[#0a5540]" :
                               "bg-[#185FA5] hover:bg-[#134d8a]";
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6"
            initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={e => e.stopPropagation()} dir={dir}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
            <div className="space-y-3">{children}</div>
            <div className="flex gap-2 mt-6 justify-end">
              <button onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
                {t("subjectsClassrooms.modal.cancel")}
              </button>
              <button onClick={onConfirm}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm text-white font-semibold transition ${btnColor}`}>
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
      <p className="text-sm text-center px-4">{message}</p>
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
  const { t, dir } = useLanguage();
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
      const [s, tt] = await Promise.all([fetchSubjects(), fetchTeachers()]);
      setSubjects(s);
      setTeachers(tt.filter(tc => !tc.archived));
    } catch { setError(t("subjectsClassrooms.subjects.loadError")); }
    finally   { setLoading(false); }
  }

  const teacherOptions = teachers.map(tc => ({
    value: String(tc.id),
    label: `${tc.fullName}${tc.specialization ? " — " + tc.specialization : ""}`,
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
    } catch { alert(t("subjectsClassrooms.subjects.createError")); }
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
    } catch { alert(t("subjectsClassrooms.subjects.editError")); }
    finally { setSubmitting(false); }
  }

  async function handleArchive() {
    try {
      setSubmitting(true);
      await archiveSubject(archiveTarget.id);
      setSubjects(prev => prev.filter(s => s.id !== archiveTarget.id));
      setArchiveTarget(null);
    } catch { alert(t("subjectsClassrooms.subjects.archiveError")); }
    finally { setSubmitting(false); }
  }

  const subjectForm = (
    <>
      <Input label={t("subjectsClassrooms.subjects.form.nameLabel")} value={form.name}
        onChange={v => setForm(f => ({ ...f, name: v }))} placeholder={t("subjectsClassrooms.subjects.form.namePlaceholder")} />
      <Textarea label={t("subjectsClassrooms.subjects.form.descriptionLabel")} value={form.description}
        onChange={v => setForm(f => ({ ...f, description: v }))} placeholder={t("subjectsClassrooms.subjects.form.descriptionPlaceholder")} />
      <SelectField
        label={t("subjectsClassrooms.subjects.form.teacherLabel")}
        value={form.teacherId}
        onChange={v => setForm(f => ({ ...f, teacherId: v }))}
        options={teacherOptions}
        placeholder={t("subjectsClassrooms.subjects.form.teacherPlaceholder")}
      />
    </>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="text-sm text-gray-500 shrink-0">{t("subjectsClassrooms.subjects.countLabel", { count: subjects.length })}</p>
        <button onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#185FA5] text-white text-sm font-semibold rounded-xl hover:bg-[#134d8a] transition shadow shrink-0">
          <span className="text-lg leading-none">+</span> {t("subjectsClassrooms.subjects.addButton")}
        </button>
      </div>

      {loading ? <Spinner /> : error ? (
        <div className="text-center py-10 text-red-500 text-sm">{error}</div>
      ) : subjects.length === 0 ? (
        <EmptyState message={t("subjectsClassrooms.subjects.emptyMessage")} />
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {subjects.map(s => (
              <motion.div key={s.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                dir={dir}>
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
                      <p className="text-xs text-gray-400 mt-0.5 sm:truncate sm:max-w-xs">{s.description}</p>
                    )}
                    {s.teacherName ? (
                      <p className="text-xs text-[#185FA5] mt-1">👨‍🏫 {s.teacherName}</p>
                    ) : (
                      <p className="text-xs text-gray-300 mt-1">{t("subjectsClassrooms.subjects.noTeacher")}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(s)}
                    className="flex-1 sm:flex-none text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#185FA5] hover:text-[#185FA5] transition">
                    {t("subjectsClassrooms.subjects.editButton")}
                  </button>
                  <button onClick={() => setArchiveTarget(s)}
                    className="flex-1 sm:flex-none text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition">
                    {t("subjectsClassrooms.subjects.archiveButton")}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={createOpen} title={t("subjectsClassrooms.subjects.createTitle")}
        onClose={() => setCreateOpen(false)} onConfirm={handleCreate}
        confirmLabel={submitting ? t("subjectsClassrooms.subjects.saving") : t("subjectsClassrooms.subjects.save")}>
        {subjectForm}
      </Modal>

      <Modal open={!!editTarget} title={t("subjectsClassrooms.subjects.editTitle")}
        onClose={() => setEditTarget(null)} onConfirm={handleEdit}
        confirmLabel={submitting ? t("subjectsClassrooms.subjects.saving") : t("subjectsClassrooms.subjects.saveChanges")}>
        {subjectForm}
      </Modal>

      <Modal open={!!archiveTarget} title={t("subjectsClassrooms.subjects.archiveTitle")}
        onClose={() => setArchiveTarget(null)} onConfirm={handleArchive}
        confirmLabel={submitting ? t("subjectsClassrooms.subjects.archiving") : t("subjectsClassrooms.subjects.archiveConfirm")} confirmColor="red">
        <p className="text-sm text-gray-600">
          {t("subjectsClassrooms.subjects.archiveConfirmText", { name: archiveTarget?.name })}
          <br />{t("subjectsClassrooms.subjects.archiveConfirmNote")}
        </p>
      </Modal>
    </div>
  );
}

// ─── CLASSROOMS TAB ───────────────────────────────────────────────────────────
function ClassroomsTab() {
  const { t, dir } = useLanguage();
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
    } catch { setError(t("subjectsClassrooms.classrooms.loadError")); }
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
    } catch (err) { alert(err?.response?.data || t("subjectsClassrooms.classrooms.createError")); }
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
    } catch { alert(t("subjectsClassrooms.classrooms.editError")); }
    finally { setSubmitting(false); }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="text-sm text-gray-500 shrink-0">{t("subjectsClassrooms.classrooms.countLabel", { count: classrooms.length })}</p>
        <button onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0F6E56] text-white text-sm font-semibold rounded-xl hover:bg-[#0a5540] transition shadow shrink-0">
          <span className="text-lg leading-none">+</span> {t("subjectsClassrooms.classrooms.addButton")}
        </button>
      </div>

      {loading ? <Spinner /> : error ? (
        <div className="text-center py-10 text-red-500 text-sm">{error}</div>
      ) : classrooms.length === 0 ? (
        <EmptyState message={t("subjectsClassrooms.classrooms.emptyMessage")} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {classrooms.map(c => (
              <motion.div key={c.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4" dir={dir}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#0F6E56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <button onClick={() => openEdit(c)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#0F6E56] hover:text-[#0F6E56] transition">
                    {t("subjectsClassrooms.classrooms.editButton")}
                  </button>
                </div>
                <p className="font-bold text-gray-800 text-base">{c.name}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs text-gray-500">{t("subjectsClassrooms.classrooms.capacityLabel", { capacity: c.capacity })}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={createOpen} title={t("subjectsClassrooms.classrooms.createTitle")}
        onClose={() => setCreateOpen(false)} onConfirm={handleCreate}
        confirmLabel={submitting ? t("subjectsClassrooms.classrooms.saving") : t("subjectsClassrooms.classrooms.save")} confirmColor="green">
        <Input label={t("subjectsClassrooms.classrooms.form.nameLabel")} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder={t("subjectsClassrooms.classrooms.form.namePlaceholder")} />
        <Input label={t("subjectsClassrooms.classrooms.form.capacityLabel")} type="number" value={form.capacity} onChange={v => setForm(f => ({ ...f, capacity: v }))} placeholder={t("subjectsClassrooms.classrooms.form.capacityPlaceholder")} />
      </Modal>

      <Modal open={!!editTarget} title={t("subjectsClassrooms.classrooms.editTitle")}
        onClose={() => setEditTarget(null)} onConfirm={handleEdit}
        confirmLabel={submitting ? t("subjectsClassrooms.classrooms.saving") : t("subjectsClassrooms.classrooms.saveChanges")} confirmColor="green">
        <Input label={t("subjectsClassrooms.classrooms.form.nameLabel")} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <Input label={t("subjectsClassrooms.classrooms.form.capacityLabel")} type="number" value={form.capacity} onChange={v => setForm(f => ({ ...f, capacity: v }))} />
      </Modal>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SubjectsAndClassrooms() {
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState("subjects");

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6" dir={dir}>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t("subjectsClassrooms.page.title")}</h1>
        <p className="text-sm text-gray-400 mt-1">{t("subjectsClassrooms.page.subtitle")}</p>
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