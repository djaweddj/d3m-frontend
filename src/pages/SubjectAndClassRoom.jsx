import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Building2, GraduationCap, Users, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import api from "../api";
import { useLanguage } from "../context/LanguageContext";

import NButton from "../components/home/NButton";
import Reveal from "../components/home/Reveal";
import { Diamond } from "../components/home/Marks";
import EmptyState from "../components/BrowseSchools/EmptyState";
import ItemCard, { Chip, CardAction } from "../components/Subject&Classroom/ItemCard";
import ItemCardSkeleton from "../components/Subject&Classroom/ItemCardSkeleton";
import Modal from "../components/Subject&Classroom/Modal";
import { FormInput, FormTextarea, FormSelect } from "../components/Subject&Classroom/Inputs";

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
const GRID = "grid gap-6 sm:grid-cols-2 xl:grid-cols-3";

// ─── Local pieces ─────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const { t } = useLanguage();
  const tabs = [
    { key: "subjects",   label: t("subjectsClassrooms.tabs.subjects")   },
    { key: "classrooms", label: t("subjectsClassrooms.tabs.classrooms") },
  ];
  return (
    <div role="tablist" className="mb-8 flex border-b border-gold/25">
      {tabs.map(tab => (
        <button
          key={tab.key}
          role="tab"
          type="button"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`-mb-px h-12 border-b-2 px-6 text-sm font-bold transition-colors ${
            active === tab.key
              ? "border-gold text-green-deep"
              : "border-transparent text-green-deep/50 hover:text-green-deep"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function Toolbar({ countLabel, addLabel, onAdd }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <span className="inline-flex items-center gap-2 text-sm font-bold tabular-nums text-gold-deep">
        <Diamond className="size-2" />
        {countLabel}
      </span>
      <NButton variant="gold" onClick={onAdd}>
        <Plus className="size-4" />
        {addLabel}
      </NButton>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className={GRID}>
      {[0, 1, 2].map(i => <ItemCardSkeleton key={i} />)}
    </div>
  );
}

// ─── SUBJECTS TAB ─────────────────────────────────────────────────────────────
function SubjectsTab() {
  const { t } = useLanguage();
  const [subjects,      setSubjects]      = useState([]);
  const [teachers,      setTeachers]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [createOpen,    setCreateOpen]    = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [form,          setForm]          = useState(EMPTY_SUBJECT);
  const [submitting,    setSubmitting]    = useState(false);

  const cancelLabel = t("subjectsClassrooms.modal.cancel");

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

  const buildPayload = () => ({
    name:        form.name.trim(),
    description: form.description.trim(),
    teacherId:   form.teacherId ? Number(form.teacherId) : null,
  });

  function openCreate() { setForm(EMPTY_SUBJECT); setCreateOpen(true); }

  function openEdit(s) {
    setForm({ name: s.name, description: s.description || "", teacherId: s.teacherId ? String(s.teacherId) : "" });
    setEditTarget(s);
  }

  function closeForm() { setCreateOpen(false); setEditTarget(null); }

  async function handleCreate() {
    if (!form.name.trim()) return;
    try {
      setSubmitting(true);
      const created = await createSubject(buildPayload());
      setSubjects(prev => [created, ...prev]);
      closeForm();
    } catch { toast.error(t("subjectsClassrooms.subjects.createError")); }
    finally { setSubmitting(false); }
  }

  async function handleEdit() {
    if (!form.name.trim()) return;
    try {
      setSubmitting(true);
      const updated = await updateSubject(editTarget.id, buildPayload());
      setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s));
      closeForm();
    } catch { toast.error(t("subjectsClassrooms.subjects.editError")); }
    finally { setSubmitting(false); }
  }

  async function handleArchive() {
    try {
      setSubmitting(true);
      await archiveSubject(archiveTarget.id);
      setSubjects(prev => prev.filter(s => s.id !== archiveTarget.id));
      setArchiveTarget(null);
    } catch { toast.error(t("subjectsClassrooms.subjects.archiveError")); }
    finally { setSubmitting(false); }
  }

  const isEditing = !!editTarget;
  const savingLabel = t("subjectsClassrooms.subjects.saving");

  return (
    <div>
      <Toolbar
        countLabel={t("subjectsClassrooms.subjects.countLabel", { count: subjects.length })}
        addLabel={t("subjectsClassrooms.subjects.addButton")}
        onAdd={openCreate} />

      {loading ? <SkeletonGrid /> : error ? (
        <EmptyState icon={AlertCircle} title={error} tone="error" />
      ) : subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title={t("subjectsClassrooms.subjects.emptyMessage")} />
      ) : (
        <div className={GRID}>
          <AnimatePresence>
            {subjects.map(s => (
              <ItemCard key={s.id} icon={BookOpen} title={s.name} description={s.description}
                actions={<>
                  <CardAction onClick={() => openEdit(s)}>
                    {t("subjectsClassrooms.subjects.editButton")}
                  </CardAction>
                  <CardAction tone="danger" onClick={() => setArchiveTarget(s)}>
                    {t("subjectsClassrooms.subjects.archiveButton")}
                  </CardAction>
                </>}
                footer={s.teacherName ? (
                  <Chip tone="gold" icon={GraduationCap}>{s.teacherName}</Chip>
                ) : (
                  <Chip tone="muted">{t("subjectsClassrooms.subjects.noTeacher")}</Chip>
                )} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create + edit share one modal */}
      <Modal open={createOpen || isEditing}
        title={isEditing ? t("subjectsClassrooms.subjects.editTitle") : t("subjectsClassrooms.subjects.createTitle")}
        onClose={closeForm} onConfirm={isEditing ? handleEdit : handleCreate}
        cancelLabel={cancelLabel} disabled={submitting}
        confirmLabel={submitting ? savingLabel : isEditing
          ? t("subjectsClassrooms.subjects.saveChanges")
          : t("subjectsClassrooms.subjects.save")}>
        <FormInput req label={t("subjectsClassrooms.subjects.form.nameLabel")} value={form.name}
          onChange={v => setForm(f => ({ ...f, name: v }))}
          placeholder={t("subjectsClassrooms.subjects.form.namePlaceholder")} />
        <FormTextarea label={t("subjectsClassrooms.subjects.form.descriptionLabel")} value={form.description}
          onChange={v => setForm(f => ({ ...f, description: v }))}
          placeholder={t("subjectsClassrooms.subjects.form.descriptionPlaceholder")} />
        <FormSelect label={t("subjectsClassrooms.subjects.form.teacherLabel")} value={form.teacherId}
          onChange={v => setForm(f => ({ ...f, teacherId: v }))}
          options={teacherOptions}
          placeholder={t("subjectsClassrooms.subjects.form.teacherPlaceholder")} />
      </Modal>

      <Modal open={!!archiveTarget} title={t("subjectsClassrooms.subjects.archiveTitle")}
        onClose={() => setArchiveTarget(null)} onConfirm={handleArchive}
        cancelLabel={cancelLabel} confirmVariant="danger" disabled={submitting}
        confirmLabel={submitting ? t("subjectsClassrooms.subjects.archiving") : t("subjectsClassrooms.subjects.archiveConfirm")}>
        <p className="text-sm leading-7 text-green-deep/70">
          {t("subjectsClassrooms.subjects.archiveConfirmText", { name: archiveTarget?.name })}
          <br />{t("subjectsClassrooms.subjects.archiveConfirmNote")}
        </p>
      </Modal>
    </div>
  );
}

// ─── CLASSROOMS TAB ───────────────────────────────────────────────────────────
function ClassroomsTab() {
  const { t } = useLanguage();
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

  const buildPayload = () => ({ name: form.name.trim(), capacity: Number(form.capacity) });
  const isInvalid    = () => !form.name.trim() || !form.capacity;

  function openCreate() { setForm(EMPTY_CLASSROOM); setCreateOpen(true); }

  function openEdit(c) {
    setForm({ name: c.name, capacity: String(c.capacity) });
    setEditTarget(c);
  }

  function closeForm() { setCreateOpen(false); setEditTarget(null); }

  async function handleCreate() {
    if (isInvalid()) return;
    try {
      setSubmitting(true);
      const created = await createClassroom(buildPayload());
      setClassrooms(prev => [created, ...prev]);
      closeForm();
    } catch (err) {
      const msg = err?.response?.data;
      toast.error(typeof msg === "string" && msg ? msg : t("subjectsClassrooms.classrooms.createError"));
    }
    finally { setSubmitting(false); }
  }

  async function handleEdit() {
    if (isInvalid()) return;
    try {
      setSubmitting(true);
      const updated = await updateClassroom(editTarget.id, buildPayload());
      setClassrooms(prev => prev.map(c => c.id === updated.id ? updated : c));
      closeForm();
    } catch { toast.error(t("subjectsClassrooms.classrooms.editError")); }
    finally { setSubmitting(false); }
  }

  const isEditing = !!editTarget;

  return (
    <div>
      <Toolbar
        countLabel={t("subjectsClassrooms.classrooms.countLabel", { count: classrooms.length })}
        addLabel={t("subjectsClassrooms.classrooms.addButton")}
        onAdd={openCreate} />

      {loading ? <SkeletonGrid /> : error ? (
        <EmptyState icon={AlertCircle} title={error} tone="error" />
      ) : classrooms.length === 0 ? (
        <EmptyState icon={Building2} title={t("subjectsClassrooms.classrooms.emptyMessage")} />
      ) : (
        <div className={GRID}>
          <AnimatePresence>
            {classrooms.map(c => (
              <ItemCard key={c.id} icon={Building2} title={c.name}
                actions={
                  <CardAction onClick={() => openEdit(c)}>
                    {t("subjectsClassrooms.classrooms.editButton")}
                  </CardAction>
                }
                footer={
                  <Chip tone="green" icon={Users}>
                    {t("subjectsClassrooms.classrooms.capacityLabel", { capacity: c.capacity })}
                  </Chip>
                } />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={createOpen || isEditing}
        title={isEditing ? t("subjectsClassrooms.classrooms.editTitle") : t("subjectsClassrooms.classrooms.createTitle")}
        onClose={closeForm} onConfirm={isEditing ? handleEdit : handleCreate}
        cancelLabel={t("subjectsClassrooms.modal.cancel")} disabled={submitting}
        confirmLabel={submitting ? t("subjectsClassrooms.classrooms.saving") : isEditing
          ? t("subjectsClassrooms.classrooms.saveChanges")
          : t("subjectsClassrooms.classrooms.save")}>
        <FormInput req label={t("subjectsClassrooms.classrooms.form.nameLabel")} value={form.name}
          onChange={v => setForm(f => ({ ...f, name: v }))}
          placeholder={t("subjectsClassrooms.classrooms.form.namePlaceholder")} />
        <FormInput req label={t("subjectsClassrooms.classrooms.form.capacityLabel")} type="number" min="1" inputMode="numeric"
          value={form.capacity}
          onChange={v => setForm(f => ({ ...f, capacity: v }))}
          placeholder={t("subjectsClassrooms.classrooms.form.capacityPlaceholder")} />
      </Modal>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SubjectsAndClassrooms() {
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState("subjects");

  return (
    <div dir={dir} className="min-h-screen bg-ivory p-4 font-body sm:p-8">
      <Reveal className="mb-8">
        <h1 className="font-display text-2xl text-green-deep sm:text-3xl">{t("subjectsClassrooms.page.title")}</h1>
        <p className="mt-2 text-sm text-green-deep/60">{t("subjectsClassrooms.page.subtitle")}</p>
        <span className="nm-rule mt-4 block w-24" />
      </Reveal>

      <TabBar active={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} role="tabpanel"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}>
          {activeTab === "subjects" ? <SubjectsTab /> : <ClassroomsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}