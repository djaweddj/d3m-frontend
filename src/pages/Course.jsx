import { useState, useEffect, useCallback } from "react";
import {
  Plus, Users, Check, XCircle, RefreshCw, AlertCircle, BookOpen,
  ChevronLeft, ChevronRight, Search, Wallet, ReceiptText, Inbox,
  GraduationCap, Phone, User as UserIcon, CircleDollarSign, CalendarClock,
  Archive, MessageSquareText, Percent, X, Clock, Layers,
} from "lucide-react";
import api from "../api";
import { useLanguage } from "../context/LanguageContext";

import Reveal from "../components/home/Reveal";
import AnimatedText from "../components/home/AnimatedText";
import NButton from "../components/home/NButton";
import { Field } from "../components/SchoolRegister/FormField";
import FormSection from "../components/SchoolRegister/FromSection";
import { Diamond, ColumnMark } from "../components/home/Marks";
import {
  CARD_SHADOW, fieldCls, Spinner, TextInput, TextArea, SelectInput, ErrorNote,
  Pill, Avatar, IconTile, ProgressBar, EmptyState, PillTabs, SoftStat,
  Modal, ModalHeader, ModalBody, ModalFooter,
} from "../components/home/ui";

// ══════════════════════════════════════════════════════════════════
//  API — SchoolAdmin course endpoints only (unchanged)
// ══════════════════════════════════════════════════════════════════
const courseApi = {
  getSchoolCourses:    ()                   => api.get("/api/courses"),
  getCourseById:       (id)                 => api.get(`/api/courses/${id}`),
  createCourse:        (data)               => api.post("/api/courses", data),
  archiveCourse:       (id)                 => api.patch(`/api/courses/${id}/archive`),
  getTeachers:         ()                   => api.get("/api/teachers"),

  getSchoolRequests:   (status, page, size) =>
    api.get("/api/courses/requests", { params: { status: status || undefined, page, size } }),
  getRequestsByCourse: (courseId, status)   =>
    api.get(`/api/courses/${courseId}/requests`, { params: { status: status || undefined } }),
  countPending:        ()                   => api.get("/api/courses/requests/count"),
  approveEnrollment:   (id)                 => api.post(`/api/courses/enrollments/${id}/approve`),
  rejectEnrollment:    (id, comment)        => api.post(`/api/courses/enrollments/${id}/reject`, null, { params: { comment: comment || undefined } }),

  markAttendance:      (sessionId, entries) => api.post(`/api/courses/sessions/${sessionId}/attendance`, entries),
  getAttendanceSheet:  (sessionId)          => api.get(`/api/courses/sessions/${sessionId}/attendance-sheet`),

  calculatePayout:     (courseId)           => api.post(`/api/courses/${courseId}/calculate-payout`),
  markPayoutPaid:      (id)                 => api.post(`/api/courses/payouts/${id}/pay`),
  getPayoutSummary:    ()                   => api.get("/api/courses/payouts/summary"),

  markInvoicePaid:     (id)                 => api.post(`/api/courses/invoices/${id}/pay`),
  getInvoicesByCourse: (courseId)           => api.get(`/api/courses/${courseId}/invoices`),
  getRevenue:          ()                   => api.get("/api/courses/revenue"),
  createManualInvoice: (data)               => api.post("/api/courses/invoices/manual", data),
};

// ══════════════════════════════════════════════════════════════════
//  CONSTANTS & HELPERS
// ══════════════════════════════════════════════════════════════════
const LEVEL_KEYS = [
  "primary1", "primary2", "primary3", "primary4", "primary5",
  "middle1", "middle2", "middle3", "middle4",
  "secondary1", "secondary2", "secondary3", "bac",
];

const fmtDate = (d, locale) =>
  d ? new Date(d).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) : "—";
const fmtDateTime = (d, locale) =>
  d ? new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const fmtTime = (v) => (v ? String(v).slice(0, 5) : "—");
const interp = (str, vars = {}) =>
  Object.keys(vars).reduce((acc, k) => acc.replaceAll(`{${k}}`, vars[k]), str);

const REQUEST_TONE = { PENDING: "gold", ACCEPTED: "green", REJECTED: "red" };
const PAYOUT_TONE  = { PENDING: "gold", PAID: "green" };
const INVOICE_TONE = { PENDING: "gold", PAID: "green", OVERDUE: "red" };

const rowCls = `bg-white p-4 ${CARD_SHADOW}`;
const centered = "flex justify-center py-16 text-gold-deep";

function RefreshButton({ onClick, label }) {
  return <NButton variant="soft" size="sm" icon={RefreshCw} onClick={onClick}>{label}</NButton>;
}

function SectionTitle({ icon, children, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <IconTile icon={icon} className="size-9" />
        <h3 className="font-display text-lg text-green-deep">{children}</h3>
      </div>
      {action}
    </div>
  );
}

function PagerButton({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid size-10 place-items-center rounded-sm bg-white text-green-deep shadow-sm transition-colors hover:bg-gold disabled:opacity-40 disabled:hover:bg-white"
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════
//  COURSES TAB
// ══════════════════════════════════════════════════════════════════
const EMPTY_SESSION = { date: "", startTime: "08:00", endTime: "09:30" };
const EMPTY_COURSE = {
  name: "", subjectName: "", description: "",
  teacherId: "", externalTeacherName: "", externalTeacherPhone: "",
  level: "", maxStudents: "", totalPrice: "", teacherPercentage: "",
  sessions: [],
};

function CourseCard({ course, onArchive, onOpenPayout, t, fmtMoney, index }) {
  const pct = course.enrolledCount != null && course.maxStudents
    ? Math.min(100, Math.round((course.enrolledCount / course.maxStudents) * 100))
    : 0;
  const levelLabel = course.level ? (t(`courses.levels.${course.level}`) || course.level) : null;

  return (
    <Reveal delay={Math.min(index, 6) * 0.06} className="h-full">
      <article className={`group flex h-full flex-col bg-white p-7 transition duration-500 hover:-translate-y-1 ${CARD_SHADOW} hover:shadow-[0_28px_50px_-26px_rgba(10,40,25,.55)]`}>
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-sm bg-green-deep text-gold transition-colors group-hover:bg-gold group-hover:text-green-deep">
            <BookOpen className="size-6" strokeWidth={1.5} />
          </span>
          <button
            onClick={() => onArchive(course)}
            title={t("courses.coursesTab.archivedBadge")}
            className="grid size-9 place-items-center rounded-sm bg-algeria-red/10 text-algeria-red transition-colors hover:bg-algeria-red hover:text-white"
          >
            <Archive className="size-4" />
          </button>
        </div>

        <h4 className="mt-6 font-display text-xl text-green-deep">{course.name}</h4>
        <p className="mt-1 text-sm text-gold-deep">{course.subjectName}</p>
        {course.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-7 text-green-deep/60">{course.description}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {levelLabel && <Pill tone="sand">{levelLabel}</Pill>}
          <Pill tone={course.externalTeacher ? "gold" : "green"}>
            {course.externalTeacher ? <UserIcon className="size-3" /> : <GraduationCap className="size-3" />}
            {course.teacherName || (course.externalTeacher ? t("courses.coursesTab.externalTeacherFallback") : "—")}
          </Pill>
          {course.archived && <Pill tone="sand">{t("courses.coursesTab.archivedBadge")}</Pill>}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs text-green-deep/60">
            <span>{course.enrolledCount ?? 0} / {course.maxStudents ?? "∞"} {t("courses.coursesTab.studentsSuffix")}</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <ProgressBar pct={pct} />
        </div>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-4 bg-ivory p-4 lg:mt-auto">
          <div className="flex gap-6">
            <div>
              <p className="text-[11px] text-green-deep/50">{t("courses.coursesTab.totalPriceLabel")}</p>
              <p className="mt-0.5 font-display text-base text-green-deep">{fmtMoney(course.totalPrice)}</p>
            </div>
            <div>
              <p className="text-[11px] text-green-deep/50">{t("courses.coursesTab.teacherPercentageLabel")}</p>
              <p className="mt-0.5 font-display text-base text-green-deep">
                {course.teacherPercentage != null ? `${course.teacherPercentage}%` : "—"}
              </p>
            </div>
          </div>
          <NButton variant="green" size="sm" icon={Wallet} onClick={() => onOpenPayout(course)}>
            {t("courses.coursesTab.teacherSharePayoutButton")}
          </NButton>
        </div>
      </article>
    </Reveal>
  );
}

function SessionRow({ session, onChange, onRemove }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="date" className={`${fieldCls} flex-[2_1_150px]`} value={session.date}
        onChange={(e) => onChange({ ...session, date: e.target.value })} />
      <input type="time" className={`${fieldCls} flex-[1_1_100px]`} value={session.startTime}
        onChange={(e) => onChange({ ...session, startTime: e.target.value })} />
      <input type="time" className={`${fieldCls} flex-[1_1_100px]`} value={session.endTime}
        onChange={(e) => onChange({ ...session, endTime: e.target.value })} />
      <button onClick={onRemove}
        className="grid size-11 shrink-0 place-items-center rounded-sm bg-algeria-red/10 text-algeria-red transition-colors hover:bg-algeria-red hover:text-white">
        <X className="size-4" />
      </button>
    </div>
  );
}

function CreateCourseModal({ teachers, onClose, onCreated, t, dir }) {
  const [form, setForm] = useState(EMPTY_COURSE);
  const [teacherMode, setTeacherMode] = useState("internal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const teacherOptions = teachers.map((x) => ({ value: String(x.id), label: `${x.fullName}${x.specialization ? " — " + x.specialization : ""}` }));
  const levelOptions = LEVEL_KEYS.map((k) => ({ value: k, label: t(`courses.levels.${k}`) }));

  const addSession = () => setForm((f) => ({ ...f, sessions: [...f.sessions, { ...EMPTY_SESSION }] }));
  const updateSession = (i, s) => setForm((f) => ({ ...f, sessions: f.sessions.map((x, idx) => (idx === i ? s : x)) }));
  const removeSession = (i) => setForm((f) => ({ ...f, sessions: f.sessions.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.name.trim())        return setError(t("courses.createCourse.errors.name"));
    if (!form.subjectName.trim()) return setError(t("courses.createCourse.errors.subject"));
    if (teacherMode === "internal" && !form.teacherId) return setError(t("courses.createCourse.errors.teacher"));
    if (teacherMode === "external" && !form.externalTeacherName.trim()) return setError(t("courses.createCourse.errors.externalTeacherName"));
    if (!form.maxStudents) return setError(t("courses.createCourse.errors.maxStudents"));
    if (!form.totalPrice)  return setError(t("courses.createCourse.errors.totalPrice"));
    if (form.sessions.length === 0) return setError(t("courses.createCourse.errors.atLeastOneSession"));
    if (form.sessions.some((s) => !s.date || !s.startTime || !s.endTime)) return setError(t("courses.createCourse.errors.completeSessionFields"));
    if (form.sessions.some((s) => s.startTime >= s.endTime)) return setError(t("courses.createCourse.errors.sessionTimeOrder"));

    setSaving(true); setError("");
    try {
      const payload = {
        name: form.name.trim(),
        subjectName: form.subjectName.trim(),
        description: form.description.trim(),
        teacherId: teacherMode === "internal" ? Number(form.teacherId) : null,
        externalTeacherName: teacherMode === "external" ? form.externalTeacherName.trim() : null,
        externalTeacherPhone: teacherMode === "external" ? form.externalTeacherPhone.trim() : null,
        level: form.level || null,
        maxStudents: Number(form.maxStudents),
        totalPrice: Number(form.totalPrice),
        teacherPercentage: form.teacherPercentage ? Number(form.teacherPercentage) : null,
        sessions: form.sessions.map((s) => ({ date: s.date, startTime: s.startTime + ":00", endTime: s.endTime + ":00" })),
      };
      const res = await courseApi.createCourse(payload);
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t("courses.createCourse.errors.createFailed"));
    } finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl" dir={dir}>
      <ModalHeader title={t("courses.createCourse.title")} subtitle={t("courses.createCourse.subtitle")} onClose={onClose} />
      <ModalBody flush>
        <FormSection icon={BookOpen} label={t("courses.createCourse.nameLabel")} sub={t("courses.createCourse.subjectLabel")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="c-name" label={t("courses.createCourse.nameLabel")} req>
              <TextInput id="c-name" value={form.name} onChange={set("name")} placeholder={t("courses.createCourse.namePlaceholder")} />
            </Field>
            <Field id="c-subject" label={t("courses.createCourse.subjectLabel")} req>
              <TextInput id="c-subject" value={form.subjectName} onChange={set("subjectName")} placeholder={t("courses.createCourse.subjectPlaceholder")} />
            </Field>
          </div>
          <Field id="c-desc" label={t("courses.createCourse.descriptionLabel")}>
            <TextArea id="c-desc" value={form.description} onChange={set("description")} placeholder={t("courses.createCourse.descriptionPlaceholder")} />
          </Field>
        </FormSection>

        <FormSection icon={GraduationCap} label={t("courses.createCourse.teacherLabel")} sub={t("courses.createCourse.teacherModeInternal") + " / " + t("courses.createCourse.teacherModeExternal")}>
          <div className="flex gap-2 rounded-sm bg-sand/60 p-1.5">
            {[
              { key: "internal", label: t("courses.createCourse.teacherModeInternal") },
              { key: "external", label: t("courses.createCourse.teacherModeExternal") },
            ].map((m) => (
              <button key={m.key} onClick={() => setTeacherMode(m.key)}
                className={`h-10 flex-1 rounded-sm text-sm font-bold transition-colors ${teacherMode === m.key ? "bg-green-deep text-gold" : "text-green-deep/60 hover:bg-white"}`}>
                {m.label}
              </button>
            ))}
          </div>
          {teacherMode === "internal" ? (
            <Field id="c-teacher" label={t("courses.createCourse.teacherLabel")} req>
              <SelectInput value={form.teacherId} onChange={set("teacherId")} options={teacherOptions} placeholder={t("courses.createCourse.teacherSelectPlaceholder")} />
            </Field>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="c-ext-name" label={t("courses.createCourse.externalNamePlaceholder")} req>
                <TextInput id="c-ext-name" value={form.externalTeacherName} onChange={set("externalTeacherName")} placeholder={t("courses.createCourse.externalNamePlaceholder")} />
              </Field>
              <Field id="c-ext-phone" label={t("courses.createCourse.externalPhonePlaceholder")}>
                <TextInput id="c-ext-phone" dir="ltr" value={form.externalTeacherPhone} onChange={set("externalTeacherPhone")} placeholder={t("courses.createCourse.externalPhonePlaceholder")} />
              </Field>
            </div>
          )}
        </FormSection>

        <FormSection icon={CircleDollarSign} label={t("courses.createCourse.totalPriceLabel")} sub={t("courses.createCourse.teacherPercentageLabel")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="c-level" label={t("courses.createCourse.levelLabel")}>
              <SelectInput value={form.level} onChange={set("level")} options={levelOptions} placeholder={t("courses.levels.allLevels")} />
            </Field>
            <Field id="c-max" label={t("courses.createCourse.maxStudentsLabel")} req>
              <TextInput id="c-max" type="number" value={form.maxStudents} onChange={set("maxStudents")} placeholder={t("courses.createCourse.maxStudentsPlaceholder")} />
            </Field>
            <Field id="c-price" label={t("courses.createCourse.totalPriceLabel")} req>
              <TextInput id="c-price" type="number" value={form.totalPrice} onChange={set("totalPrice")} placeholder={t("courses.createCourse.totalPricePlaceholder")} />
            </Field>
            <Field id="c-pct" label={t("courses.createCourse.teacherPercentageLabel")}>
              <TextInput id="c-pct" type="number" value={form.teacherPercentage} onChange={set("teacherPercentage")} placeholder={t("courses.createCourse.teacherPercentagePlaceholder")} />
            </Field>
          </div>
        </FormSection>

        <FormSection icon={CalendarClock} label={t("courses.createCourse.sessionsLabel")} sub={t("courses.createCourse.addSession")}>
          <div className="space-y-3">
            {form.sessions.map((s, i) => (
              <SessionRow key={i} session={s} onChange={(x) => updateSession(i, x)} onRemove={() => removeSession(i)} />
            ))}
            <button onClick={addSession}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-gold/15 text-sm font-bold text-gold-deep transition-colors hover:bg-gold hover:text-green-deep">
              <Plus className="size-4" /> {t("courses.createCourse.addSession")}
            </button>
          </div>
          <ErrorNote msg={error} />
        </FormSection>
      </ModalBody>
      <ModalFooter>
        <NButton variant="ghost" onClick={onClose} className="flex-1">{t("courses.createCourse.cancel")}</NButton>
        <NButton variant="gold" icon={Plus} loading={saving} onClick={handleSave} className="flex-[2]">
          {saving ? t("courses.createCourse.submitting") : t("courses.createCourse.submit")}
        </NButton>
      </ModalFooter>
    </Modal>
  );
}

function ArchiveCourseModal({ course, onClose, onConfirm, t, dir }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setSaving(true); setError("");
    try {
      await courseApi.archiveCourse(course.id);
      onConfirm(course);
    } catch (err) {
      setError(err?.response?.data?.message || t("courses.archiveCourse.archiveFailed"));
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-sm" dir={dir}>
      <ModalHeader title={t("courses.archiveCourse.title")} onClose={onClose} />
      <ModalBody className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-algeria-red/10 text-algeria-red">
          <Archive className="size-7" strokeWidth={1.5} />
        </span>
        <p className="text-sm leading-8 text-green-deep">
          {interp(t("courses.archiveCourse.confirmText"), { name: course.name })}
          <br />
          <span className="text-xs text-green-deep/55">{t("courses.archiveCourse.confirmNote")}</span>
        </p>
        <ErrorNote msg={error} />
      </ModalBody>
      <ModalFooter>
        <NButton variant="ghost" onClick={onClose} className="flex-1">{t("courses.archiveCourse.cancel")}</NButton>
        <NButton variant="danger" icon={Archive} loading={saving} onClick={handleConfirm} className="flex-[2]">
          {saving ? t("courses.archiveCourse.archiving") : t("courses.archiveCourse.confirm")}
        </NButton>
      </ModalFooter>
    </Modal>
  );
}

function CoursesTab({ courses, teachers, loading, error, onReload, onOpenPayout, t, dir, fmtMoney }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const levelOptions = LEVEL_KEYS.map((k) => ({ value: k, label: t(`courses.levels.${k}`) }));
  const filtered = courses.filter((c) => {
    if (levelFilter && c.level !== levelFilter) return false;
    if (search && !`${c.name} ${c.subjectName} ${c.teacherName || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap gap-3">
          <div className="relative min-w-48 max-w-xs flex-1">
            <Search className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-gold-deep" strokeWidth={1.5} />
            <input className={`${fieldCls} bg-white pe-11 shadow-sm`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("courses.coursesTab.searchPlaceholder")} />
          </div>
          <div className="w-44">
            <SelectInput className="bg-white shadow-sm" value={levelFilter} onChange={setLevelFilter} options={levelOptions} placeholder={t("courses.levels.allLevels")} />
          </div>
        </div>
        <div className="flex gap-2">
          <RefreshButton onClick={onReload} label={t("courses.coursesTab.refresh")} />
          <NButton variant="gold" size="sm" icon={Plus} onClick={() => setCreateOpen(true)}>{t("courses.coursesTab.addCourse")}</NButton>
        </div>
      </div>

      {loading ? (
        <div className={centered}><Spinner className="size-8" /></div>
      ) : error ? (
        <EmptyState icon={AlertCircle} title={error} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen}
          title={courses.length === 0 ? t("courses.coursesTab.emptyNoCourses") : t("courses.coursesTab.emptyNoResults")}
          subtitle={courses.length === 0 ? t("courses.coursesTab.emptyNoCoursesSub") : t("courses.coursesTab.emptyNoResultsSub")} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c, i) => (
            <CourseCard key={c.id} index={i} course={c} onArchive={setArchiveTarget} onOpenPayout={onOpenPayout} t={t} fmtMoney={fmtMoney} />
          ))}
        </div>
      )}

      {createOpen && <CreateCourseModal teachers={teachers} onClose={() => setCreateOpen(false)} onCreated={onReload} t={t} dir={dir} />}
      {archiveTarget && (
        <ArchiveCourseModal course={archiveTarget} onClose={() => setArchiveTarget(null)}
          onConfirm={() => { setArchiveTarget(null); onReload(); }} t={t} dir={dir} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ENROLLMENT REQUESTS TAB
// ══════════════════════════════════════════════════════════════════
function RejectModal({ request, onClose, onRejected, t, dir }) {
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleReject = async () => {
    setSaving(true); setError("");
    try {
      await courseApi.rejectEnrollment(request.id, comment.trim());
      onRejected(request);
    } catch (err) {
      setError(err?.response?.data?.message || t("courses.rejectModal.rejectFailed"));
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-md" dir={dir}>
      <ModalHeader title={t("courses.rejectModal.title")} subtitle={request.studentName} onClose={onClose} />
      <ModalBody>
        <Field id="r-comment" label={t("courses.rejectModal.commentLabel")}>
          <TextArea id="r-comment" rows={4} value={comment} onChange={setComment} placeholder={t("courses.rejectModal.commentPlaceholder")} />
        </Field>
        <ErrorNote msg={error} />
      </ModalBody>
      <ModalFooter>
        <NButton variant="ghost" onClick={onClose} className="flex-1">{t("courses.rejectModal.cancel")}</NButton>
        <NButton variant="danger" icon={XCircle} loading={saving} onClick={handleReject} className="flex-[2]">
          {saving ? t("courses.rejectModal.confirming") : t("courses.rejectModal.confirm")}
        </NButton>
      </ModalFooter>
    </Modal>
  );
}

function RequestRow({ request, onApprove, onReject, approving, t, fmtMoney, locale }) {
  const tone = REQUEST_TONE[request.status] || "gold";
  const stLabel = t(`courses.enrollmentStatus.${request.status}`) || t("courses.enrollmentStatus.PENDING");

  return (
    <div className={`flex flex-wrap items-center gap-5 ${rowCls}`}>
      <Avatar name={request.studentName} className="size-11" />

      <div className="min-w-48 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-base text-green-deep">{request.studentName}</span>
          {request.studentLevel && <Pill tone="sand">{t(`courses.levels.${request.studentLevel}`) || request.studentLevel}</Pill>}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-green-deep/60">
          <span className="flex items-center gap-1.5"><BookOpen className="size-3 text-gold-deep" />{request.courseName}{request.subjectName ? ` — ${request.subjectName}` : ""}</span>
          {request.parentName && <span className="flex items-center gap-1.5"><UserIcon className="size-3 text-gold-deep" />{request.parentName}</span>}
          {request.parentPhone && <span dir="ltr" className="flex items-center gap-1.5"><Phone className="size-3 text-gold-deep" />{request.parentPhone}</span>}
        </div>
      </div>

      <div className="text-center">
        <p className="text-[11px] text-green-deep/50">{t("courses.requestRow.priceLabel")}</p>
        <p className="font-display text-sm text-green-deep">{fmtMoney(request.totalPrice)}</p>
      </div>
      <div className="min-w-24 text-center">
        <p className="text-[11px] text-green-deep/50">{t("courses.requestRow.requestDateLabel")}</p>
        <p className="text-xs text-green-deep/80">{fmtDateTime(request.createdAt, locale)}</p>
      </div>

      <Pill tone={tone}>{stLabel}</Pill>

      {request.status === "PENDING" ? (
        <div className="flex gap-2">
          <NButton variant="green" size="sm" icon={Check} loading={approving} onClick={() => onApprove(request)}>
            {t("courses.requestsTab.approve")}
          </NButton>
          <NButton variant="danger" size="sm" icon={XCircle} onClick={() => onReject(request)}>
            {t("courses.requestsTab.reject")}
          </NButton>
        </div>
      ) : request.reviewComment ? (
        <p className="flex max-w-40 items-center gap-1.5 text-xs text-green-deep/55">
          <MessageSquareText className="size-3.5 shrink-0" /> {request.reviewComment}
        </p>
      ) : null}
    </div>
  );
}

function RequestsTab({ courses, onPendingCountChange, t, dir, fmtMoney, locale }) {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [courseFilter, setCourseFilter] = useState("");
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const size = 10;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (courseFilter) {
        const res = await courseApi.getRequestsByCourse(courseFilter, statusFilter || undefined);
        setRequests(res.data ?? []);
        setTotalPages(1);
        setTotalElements((res.data ?? []).length);
      } else {
        const res = await courseApi.getSchoolRequests(statusFilter || undefined, page, size);
        const data = res.data;
        setRequests(data.content ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotalElements(data.totalElements ?? 0);
      }
    } catch (err) {
      setError(err?.response?.data?.message || t("courses.requestsTab.loadError"));
    } finally { setLoading(false); }
  }, [statusFilter, courseFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [statusFilter, courseFilter]);

  const refreshPendingBadge = async () => {
    try {
      const res = await courseApi.countPending();
      onPendingCountChange(res.data?.pendingCount ?? 0);
    } catch { /* non-critical */ }
  };

  const handleApprove = async (request) => {
    setApprovingId(request.id);
    try {
      await courseApi.approveEnrollment(request.id);
      setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: "ACCEPTED", reviewedAt: new Date().toISOString() } : r)));
      refreshPendingBadge();
    } catch (err) {
      alert(err?.response?.data?.message || t("courses.requestsTab.approveFailed"));
    } finally { setApprovingId(null); }
  };

  const handleRejected = (request) => {
    setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: "REJECTED" } : r)));
    setRejectTarget(null);
    refreshPendingBadge();
  };

  const courseOptions = courses.map((c) => ({ value: String(c.id), label: c.name }));
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="w-44">
            <SelectInput className="bg-white shadow-sm" value={statusFilter} onChange={setStatusFilter}
              options={["PENDING", "ACCEPTED", "REJECTED"].map((s) => ({ value: s, label: t(`courses.enrollmentStatus.${s}`) }))}
              placeholder={t("courses.requestsTab.statusAll")} />
          </div>
          <div className="w-52">
            <SelectInput className="bg-white shadow-sm" value={courseFilter} onChange={setCourseFilter} options={courseOptions} placeholder={t("courses.requestsTab.allCourses")} />
          </div>
        </div>
        <RefreshButton onClick={load} label={t("courses.requestsTab.refresh")} />
      </div>

      {loading ? (
        <div className={centered}><Spinner className="size-8" /></div>
      ) : error ? (
        <EmptyState icon={AlertCircle} title={error} />
      ) : requests.length === 0 ? (
        <EmptyState icon={Inbox} title={t("courses.requestsTab.emptyTitle")} subtitle={t("courses.requestsTab.emptySubtitle")} />
      ) : (
        <>
          <p className="mb-4 flex items-center gap-2 text-xs text-green-deep/60">
            <Diamond className="size-2 text-gold" /> {totalElements} {t("courses.requestsTab.countSuffix")}
          </p>
          <div className="space-y-3">
            {requests.map((r) => (
              <RequestRow key={r.id} request={r} approving={approvingId === r.id}
                onApprove={handleApprove} onReject={setRejectTarget} t={t} fmtMoney={fmtMoney} locale={locale} />
            ))}
          </div>

          {!courseFilter && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <PagerButton onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}><Prev className="size-4" /></PagerButton>
              <span className="font-display text-sm tabular-nums text-green-deep">{page + 1} / {totalPages}</span>
              <PagerButton onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}><Next className="size-4" /></PagerButton>
            </div>
          )}
        </>
      )}

      {rejectTarget && <RejectModal request={rejectTarget} onClose={() => setRejectTarget(null)} onRejected={handleRejected} t={t} dir={dir} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ATTENDANCE TAB
// ══════════════════════════════════════════════════════════════════
function SessionPickerCard({ course, session, onClick, t, dir, locale }) {
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  const d = session.date ? new Date(session.date) : null;
  const dayLabel = t(`courses.days.${session.day}`) || session.day || "";

  return (
    <button onClick={onClick}
      className={`group flex w-full items-center gap-4 bg-white p-4 text-start transition duration-300 hover:-translate-y-0.5 ${CARD_SHADOW}`}>
      <span className="grid size-14 shrink-0 place-items-center rounded-sm bg-green-deep text-gold transition-colors group-hover:bg-gold group-hover:text-green-deep">
        {d ? (
          <span className="text-center leading-tight">
            <span className="block font-display text-xl tabular-nums">{d.getDate()}</span>
            <span className="block text-[10px]">{d.toLocaleDateString(locale, { month: "short" })}</span>
          </span>
        ) : (
          <span className="px-1 text-center text-[11px] font-bold">{String(dayLabel).slice(0, 6)}</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base text-green-deep">{course.name}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-green-deep/60">
          <span>{course.subjectName}</span>
          <span className="flex items-center gap-1.5"><Clock className="size-3 text-gold-deep" />{fmtTime(session.startTime)} – {fmtTime(session.endTime)}</span>
          <span className="flex items-center gap-1.5"><GraduationCap className="size-3 text-gold-deep" />{course.teacherName}</span>
        </p>
      </div>
      <Chevron className="size-5 shrink-0 text-gold-deep" />
    </button>
  );
}

function AttendanceModal({ course, session, onClose, t, dir, locale }) {
  const [sheet, setSheet] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const loadSheet = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await courseApi.getAttendanceSheet(session.id);
      const data = res.data;
      setSheet(data);
      const initial = {};
      (data.students ?? []).forEach((s) => { if (s.status) initial[s.studentId] = s.status; });
      setMarks(initial);
    } catch (err) {
      setLoadError(err?.response?.data?.message || t("courses.attendanceModal.loadError"));
    }
  }, [session.id]);

  useEffect(() => { loadSheet(); }, [loadSheet]);

  const mark = (id, status) => setMarks((prev) => ({ ...prev, [id]: prev[id] === status ? null : status }));
  const markAll = (status) => {
    const all = {};
    (sheet?.students ?? []).forEach((s) => { all[s.studentId] = status; });
    setMarks(all);
  };

  const list = sheet?.students ?? [];
  const presentCount = Object.values(marks).filter((v) => v === "PRESENT").length;
  const absentCount  = Object.values(marks).filter((v) => v === "ABSENT").length;
  const markedCount  = Object.values(marks).filter(Boolean).length;

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const entries = list.filter((s) => marks[s.studentId]).map((s) => ({ studentId: s.studentId, status: marks[s.studentId] }));
      if (entries.length === 0) { setError(t("courses.attendanceModal.atLeastOneRequired")); setSaving(false); return; }
      await courseApi.markAttendance(session.id, entries);
      setSubmitted(true);
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err?.response?.data?.message || t("courses.attendanceModal.saveFailed"));
    } finally { setSaving(false); }
  };

  const STATUS_BTNS = [
    { key: "PRESENT", Icon: Check,   on: "bg-green-deep text-gold",    title: t("courses.attendanceStatus.PRESENT") },
    { key: "ABSENT",  Icon: XCircle, on: "bg-algeria-red text-white", title: t("courses.attendanceStatus.ABSENT") },
  ];

  const dateLabel = sheet?.date ? fmtDate(sheet.date, locale) : (t(`courses.days.${session.day}`) || session.day || "");

  return (
    <Modal onClose={onClose} maxWidth="max-w-xl" dir={dir}>
      <ModalHeader
        title={sheet?.moduleName || course.name}
        subtitle={`${sheet?.teacherName || course.teacherName || ""} · ${fmtTime(sheet?.startTime || session.startTime)} – ${fmtTime(sheet?.endTime || session.endTime)} · ${dateLabel}`}
        onClose={onClose}
      >
        {list.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="dark" className="!bg-ivory/10 !text-ivory"><Users className="size-3" />{sheet?.totalEnrolled ?? list.length} {t("courses.attendanceModal.totalEnrolledSuffix")}</Pill>
            <Pill tone="gold"><Check className="size-3" />{presentCount} {t("courses.attendanceModal.presentSuffix")}</Pill>
            <Pill tone="red" className="!bg-algeria-red !text-white"><X className="size-3" />{absentCount} {t("courses.attendanceModal.absentSuffix")}</Pill>
            <button onClick={() => markAll("PRESENT")} className="rounded-full bg-gold px-3 py-1 text-[11px] font-bold text-green-deep transition-colors hover:bg-gold-deep hover:text-ivory">{t("courses.attendanceModal.markAllPresent")}</button>
            <button onClick={() => markAll("ABSENT")} className="rounded-full bg-ivory/15 px-3 py-1 text-[11px] font-bold text-ivory transition-colors hover:bg-algeria-red">{t("courses.attendanceModal.markAllAbsent")}</button>
          </div>
        )}
      </ModalHeader>

      <ModalBody flush className="px-4 py-4">
        {sheet === null && !loadError ? (
          <div className={centered}><Spinner className="size-7" /></div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-sm text-algeria-red"><AlertCircle className="size-7" />{loadError}</div>
        ) : list.length === 0 ? (
          <EmptyState icon={Users} title={t("courses.attendanceModal.emptyStudents")} />
        ) : (
          <div className="space-y-2">
            {list.map((s) => {
              const status = marks[s.studentId];
              const tint = status === "PRESENT" ? "bg-green-deep/10" : status === "ABSENT" ? "bg-algeria-red/10" : "bg-white";
              return (
                <div key={s.studentId} className={`flex items-center gap-3 rounded-sm px-4 py-3 transition-colors ${tint}`}>
                  <Avatar name={s.fullName} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-green-deep">{s.fullName}</p>
                    <p className="text-[11px] text-green-deep/50">{s.level ? (t(`courses.levels.${s.level}`) || s.level) : s.parentPhone ?? ""}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {STATUS_BTNS.map(({ key, Icon, on, title }) => (
                      <button key={key} title={title} onClick={() => mark(s.studentId, key)}
                        className={`grid size-10 place-items-center rounded-sm transition-colors ${status === key ? on : "bg-sand text-green-deep/35 hover:bg-gold/30"}`}>
                        <Icon className="size-4" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ModalBody>

      {error && <div className="px-6 pb-3"><ErrorNote msg={error} /></div>}

      <ModalFooter>
        <span className="flex-1 text-xs text-green-deep/60">{markedCount} / {list.length} {t("courses.attendanceModal.markedCountSuffix")}</span>
        <NButton variant={submitted ? "green" : "gold"} icon={submitted ? Check : undefined} loading={saving}
          disabled={submitted || list.length === 0} onClick={handleSave}>
          {submitted ? t("courses.attendanceModal.saved") : t("courses.attendanceModal.save")}
        </NButton>
      </ModalFooter>
    </Modal>
  );
}

function AttendanceTab({ courses, t, dir, locale }) {
  const [courseFilter, setCourseFilter] = useState("");
  const [target, setTarget] = useState(null);

  const rows = [];
  courses.forEach((c) => {
    if (courseFilter && String(c.id) !== courseFilter) return;
    (c.sessions ?? []).forEach((s) => rows.push({ course: c, session: s }));
  });
  const courseOptions = courses.map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="w-60">
          <SelectInput className="bg-white shadow-sm" value={courseFilter} onChange={setCourseFilter} options={courseOptions} placeholder={t("courses.attendanceTab.allCourses")} />
        </div>
        <p className="flex items-center gap-2 text-xs text-green-deep/60"><Diamond className="size-2 text-gold" />{t("courses.attendanceTab.hint")}</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={CalendarClock} title={t("courses.attendanceTab.emptyTitle")} subtitle={t("courses.attendanceTab.emptySubtitle")} />
      ) : (
        <div className="space-y-3">
          {rows.map(({ course, session }) => (
            <SessionPickerCard key={`${course.id}_${session.id ?? session.day + session.startTime}`}
              course={course} session={session} onClick={() => setTarget({ course, session })} t={t} dir={dir} locale={locale} />
          ))}
        </div>
      )}

      {target && <AttendanceModal course={target.course} session={target.session} onClose={() => setTarget(null)} t={t} dir={dir} locale={locale} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  PAYOUTS & INVOICES TAB
// ══════════════════════════════════════════════════════════════════
function PayoutPanel({ course, onClose, t, dir, fmtMoney, locale }) {
  const [payout, setPayout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  const handleCalculate = async () => {
    setLoading(true); setError("");
    try {
      const res = await courseApi.calculatePayout(course.id);
      setPayout(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || t("courses.payoutPanel.calculateFailed"));
    } finally { setLoading(false); }
  };

  const handleMarkPaid = async () => {
    if (!payout) return;
    setPaying(true); setError("");
    try {
      const res = await courseApi.markPayoutPaid(payout.id);
      setPayout(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || t("courses.payoutPanel.confirmPaymentFailed"));
    } finally { setPaying(false); }
  };

  const stLabel = payout ? (t(`courses.payoutStatus.${payout.status}`) || t("courses.payoutStatus.PENDING")) : "";

  return (
    <Modal onClose={onClose} maxWidth="max-w-md" dir={dir}>
      <ModalHeader title={t("courses.payoutPanel.title")} subtitle={course.name} onClose={onClose} />
      <ModalBody>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4">
            <p className="text-[11px] text-green-deep/50">{t("courses.payoutPanel.teacherLabel")}</p>
            <p className="mt-1 truncate font-display text-base text-green-deep">{course.teacherName || "—"}</p>
          </div>
          <div className="bg-white p-4">
            <p className="text-[11px] text-green-deep/50">{t("courses.payoutPanel.teacherPercentageLabel")}</p>
            <p className="mt-1 flex items-center gap-1 font-display text-base text-green-deep"><Percent className="size-3.5 text-gold-deep" />{course.teacherPercentage ?? "—"}</p>
          </div>
        </div>

        {!payout ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-sand text-gold-deep"><CircleDollarSign className="size-7" strokeWidth={1.5} /></span>
            <p className="max-w-xs text-sm leading-7 text-green-deep/60">{t("courses.payoutPanel.calculateHint")}</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white">
            <div className="flex items-center justify-between bg-green-deep px-5 py-3 text-ivory">
              <span className="text-xs font-bold">{t("courses.payoutPanel.paymentStatusLabel")}</span>
              <Pill tone={PAYOUT_TONE[payout.status] || "gold"}>{stLabel}</Pill>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <div className="flex justify-between"><span className="text-green-deep/60">{t("courses.payoutPanel.totalCourseRevenue")}</span><span className="font-bold text-green-deep">{fmtMoney(payout.totalCourseRevenue)}</span></div>
              <div className="flex justify-between"><span className="text-green-deep/60">{t("courses.payoutPanel.percentageLabel")}</span><span className="font-bold text-green-deep">{payout.percentage}%</span></div>
              <div className="flex items-center justify-between bg-gold/15 px-4 py-3">
                <span className="font-bold text-green-deep">{t("courses.payoutPanel.payoutAmountLabel")}</span>
                <span className="font-display text-xl text-gold-deep">{fmtMoney(payout.payoutAmount)}</span>
              </div>
              {payout.paidAt && <p className="text-xs text-green-deep/50">{interp(t("courses.payoutPanel.paidAtLabel"), { date: fmtDateTime(payout.paidAt, locale) })}</p>}
            </div>
          </div>
        )}
        <ErrorNote msg={error} />
      </ModalBody>
      <ModalFooter>
        <NButton variant="ghost" onClick={onClose} className="flex-1">{t("courses.payoutPanel.close")}</NButton>
        {!payout ? (
          <NButton variant="gold" icon={CircleDollarSign} loading={loading} onClick={handleCalculate} className="flex-[2]">
            {loading ? t("courses.payoutPanel.calculating") : t("courses.payoutPanel.calculate")}
          </NButton>
        ) : payout.status !== "PAID" ? (
          <NButton variant="green" icon={Check} loading={paying} onClick={handleMarkPaid} className="flex-[2]">
            {paying ? t("courses.payoutPanel.confirming") : t("courses.payoutPanel.confirmPayment")}
          </NButton>
        ) : (
          <NButton variant="gold" icon={RefreshCw} loading={loading} onClick={handleCalculate} className="flex-[2]">
            {t("courses.payoutPanel.recalculate")}
          </NButton>
        )}
      </ModalFooter>
    </Modal>
  );
}

function InvoiceRow({ invoice, onPaid, t, fmtMoney, locale }) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const status = invoice.status || "PENDING";
  const stLabel = t(`courses.invoiceStatus.${status}`) || t("courses.invoiceStatus.PENDING");

  const handlePay = async () => {
    setPaying(true); setError("");
    try {
      await courseApi.markInvoicePaid(invoice.id);
      onPaid(invoice);
    } catch (err) {
      setError(err?.response?.data?.message || t("courses.payoutsTab.confirmPaymentFailed"));
    } finally { setPaying(false); }
  };

  return (
    <div className={`flex flex-wrap items-center gap-5 ${rowCls}`}>
      <IconTile icon={ReceiptText} tone="gold" />
      <div className="min-w-40 flex-1">
        <p className="font-display text-base text-green-deep">{invoice.studentName}</p>
        <p className="mt-0.5 text-xs text-green-deep/60">{invoice.courseName}</p>
      </div>
      {invoice.dueDate && (
        <div className="text-center">
          <p className="text-[11px] text-green-deep/50">{t("courses.payoutsTab.dueDateLabel")}</p>
          <p className="text-xs text-green-deep/80">{fmtDate(invoice.dueDate, locale)}</p>
        </div>
      )}
      <div className="text-center">
        <p className="text-[11px] text-green-deep/50">{t("courses.payoutsTab.amountLabel")}</p>
        <p className="font-display text-sm text-green-deep">{fmtMoney(invoice.amount)}</p>
      </div>
      <Pill tone={INVOICE_TONE[status] || "gold"}>{stLabel}</Pill>
      {status !== "PAID" && (
        <NButton variant="green" size="sm" icon={Check} loading={paying} onClick={handlePay}>{t("courses.payoutsTab.confirmPayment")}</NButton>
      )}
      {error && <div className="w-full"><ErrorNote msg={error} /></div>}
    </div>
  );
}

function ManualInvoiceModal({ courses, onClose, onCreated, t, dir, fmtMoney }) {
  const [courseId, setCourseId] = useState("");
  const [requests, setRequests] = useState([]);
  const [loadingReq, setLoadingReq] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId) { setRequests([]); setEnrollmentId(""); return; }
    setLoadingReq(true);
    courseApi.getRequestsByCourse(courseId, "ACCEPTED")
      .then((res) => setRequests(res.data ?? []))
      .catch(() => setRequests([]))
      .finally(() => setLoadingReq(false));
  }, [courseId]);

  const selectedRequest = requests.find((r) => String(r.id) === enrollmentId);
  const courseOptions = courses.map((c) => ({ value: String(c.id), label: c.name }));
  const requestOptions = requests.map((r) => ({ value: String(r.id), label: `${r.studentName} — ${fmtMoney(r.totalPrice)}` }));

  const handleSave = async () => {
    if (!enrollmentId) return setError(t("courses.manualInvoiceModal.selectStudentRequired"));
    setSaving(true); setError("");
    try {
      const res = await courseApi.createManualInvoice({
        enrollmentId: Number(enrollmentId),
        amount: amount ? Number(amount) : undefined,
        dueDate: dueDate || undefined,
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t("courses.manualInvoiceModal.createFailed"));
    } finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-md" dir={dir}>
      <ModalHeader title={t("courses.manualInvoiceModal.title")} subtitle={t("courses.manualInvoiceModal.subtitle")} onClose={onClose} />
      <ModalBody>
        <Field id="m-course" label={t("courses.manualInvoiceModal.courseLabel")} req>
          <SelectInput value={courseId} onChange={setCourseId} options={courseOptions} placeholder={t("courses.manualInvoiceModal.coursePlaceholder")} />
        </Field>
        <Field id="m-student" label={t("courses.manualInvoiceModal.studentLabel")} req>
          {loadingReq ? (
            <div className="flex h-11 items-center text-gold-deep"><Spinner /></div>
          ) : (
            <SelectInput value={enrollmentId} onChange={setEnrollmentId} options={requestOptions}
              placeholder={courseId
                ? (requests.length === 0 ? t("courses.manualInvoiceModal.studentPlaceholderNoStudents") : t("courses.manualInvoiceModal.studentPlaceholder"))
                : t("courses.manualInvoiceModal.studentPlaceholderNoCourse")} />
          )}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="m-amount" label={t("courses.manualInvoiceModal.amountLabel")}>
            <TextInput id="m-amount" type="number" value={amount} onChange={setAmount}
              placeholder={selectedRequest ? String(selectedRequest.totalPrice) : t("courses.manualInvoiceModal.amountDefaultHint")} />
          </Field>
          <Field id="m-due" label={t("courses.manualInvoiceModal.dueDateLabel")}>
            <input id="m-due" type="date" className={fieldCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
        </div>
        <ErrorNote msg={error} />
      </ModalBody>
      <ModalFooter>
        <NButton variant="ghost" onClick={onClose} className="flex-1">{t("courses.manualInvoiceModal.cancel")}</NButton>
        <NButton variant="gold" icon={ReceiptText} loading={saving} onClick={handleSave} className="flex-[2]">
          {saving ? t("courses.manualInvoiceModal.submitting") : t("courses.manualInvoiceModal.submit")}
        </NButton>
      </ModalFooter>
    </Modal>
  );
}

function PayoutsTab({ courses, initialCourse, onConsumeInitial, t, dir, fmtMoney, locale }) {
  const [payoutCourse, setPayoutCourse] = useState(null);
  const [invoiceCourse, setInvoiceCourse] = useState("");
  const [manualInvoiceOpen, setManualInvoiceOpen] = useState(false);
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (initialCourse) { setPayoutCourse(initialCourse); onConsumeInitial(); }
  }, [initialCourse, onConsumeInitial]);

  const [payoutSummary, setPayoutSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [errorSummary, setErrorSummary] = useState(null);
  const loadPayoutSummary = useCallback(async () => {
    setLoadingSummary(true); setErrorSummary(null);
    try { setPayoutSummary((await courseApi.getPayoutSummary()).data); }
    catch (err) { setErrorSummary(err?.response?.data?.message || t("courses.payoutsTab.summaryLoadError")); }
    finally { setLoadingSummary(false); }
  }, []);
  useEffect(() => { loadPayoutSummary(); }, [loadPayoutSummary]);

  const [revenue, setRevenue] = useState(null);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [errorRevenue, setErrorRevenue] = useState(null);
  const loadRevenue = useCallback(async () => {
    setLoadingRevenue(true); setErrorRevenue(null);
    try { setRevenue((await courseApi.getRevenue()).data); }
    catch (err) { setErrorRevenue(err?.response?.data?.message || t("courses.payoutsTab.revenueLoadError")); }
    finally { setLoadingRevenue(false); }
  }, []);
  useEffect(() => { loadRevenue(); }, [loadRevenue]);

  const [invoices, setInvoices] = useState([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [errorInv, setErrorInv] = useState(null);
  const loadInvoices = useCallback(async () => {
    if (!invoiceCourse) { setInvoices([]); return; }
    setLoadingInv(true); setErrorInv(null);
    try { setInvoices((await courseApi.getInvoicesByCourse(invoiceCourse)).data ?? []); }
    catch (err) { setErrorInv(err?.response?.data?.message || t("courses.payoutsTab.invoicesLoadError")); }
    finally { setLoadingInv(false); }
  }, [invoiceCourse]);
  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const refreshAll = () => { loadPayoutSummary(); loadRevenue(); loadInvoices(); };
  const courseOptions = courses.map((c) => ({ value: String(c.id), label: c.name }));

  const PayoutLine = ({ icon, title, meta, amount, status, onClick }) => (
    <button onClick={onClick}
      className={`group flex w-full flex-wrap items-center gap-4 bg-white p-4 text-start transition duration-300 hover:-translate-y-0.5 ${CARD_SHADOW}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-green-deep text-gold transition-colors group-hover:bg-gold group-hover:text-green-deep">
        {icon}
      </span>
      <div className="min-w-32 flex-1">
        <p className="truncate font-display text-sm text-green-deep">{title}</p>
        <p className="mt-0.5 text-xs text-green-deep/55">{meta}</p>
      </div>
      {amount != null && <p className="font-display text-sm text-green-deep">{amount}</p>}
      {status}
      <Chevron className="size-4 shrink-0 text-gold-deep" />
    </button>
  );

  return (
    <div className="space-y-14">
      {/* Revenue */}
      <section>
        <SectionTitle icon={CircleDollarSign}>{t("courses.payoutsTab.revenueOverviewTitle")}</SectionTitle>
        {loadingRevenue ? <div className={centered}><Spinner className="size-7" /></div>
          : errorRevenue ? <ErrorNote msg={errorRevenue} />
          : revenue && (
            <div className="flex flex-wrap gap-4">
              <SoftStat icon={CircleDollarSign} tone="dark" label={t("courses.payoutsTab.expectedRevenue")} value={fmtMoney(revenue.totalExpected)} />
              <SoftStat icon={Check} tone="sand" label={t("courses.payoutsTab.collected")} value={fmtMoney(revenue.totalCollected)} />
              <SoftStat icon={CalendarClock} tone="gold" label={t("courses.payoutsTab.pending")} value={fmtMoney(revenue.totalPending)} />
              <SoftStat icon={AlertCircle} tone="red" label={t("courses.payoutsTab.overdue")} value={fmtMoney(revenue.totalOverdue)} />
            </div>
          )}
      </section>

      {/* Teacher payouts */}
      <section>
        <SectionTitle icon={Wallet}>{t("courses.payoutsTab.teacherPayoutsTitle")}</SectionTitle>
        {loadingSummary ? <div className={centered}><Spinner className="size-7" /></div>
          : errorSummary ? <ErrorNote msg={errorSummary} />
          : payoutSummary && (
            <div className="mb-6 flex flex-wrap gap-4">
              <SoftStat icon={CalendarClock} tone="gold" label={t("courses.payoutsTab.duePayouts")} value={fmtMoney(payoutSummary.totalPayoutsDue)} />
              <SoftStat icon={Check} tone="dark" label={t("courses.payoutsTab.paidPayouts")} value={fmtMoney(payoutSummary.totalPayoutsPaid)} />
              <SoftStat icon={Layers} tone="sand" label={t("courses.payoutsTab.courseCount")} value={payoutSummary.courseCount ?? courses.length} />
            </div>
          )}

        {payoutSummary?.payouts?.length > 0 ? (
          <div className="space-y-3">
            {payoutSummary.payouts.map((p) => {
              const related = courses.find((c) => c.id === p.courseId) || { id: p.courseId, name: p.courseName, teacherName: p.teacherName, teacherPercentage: p.percentage };
              return (
                <PayoutLine key={p.id} icon={<Wallet className="size-4" />}
                  title={p.courseName} meta={`${p.teacherName || "—"} · ${p.percentage ?? "—"}%`}
                  amount={fmtMoney(p.payoutAmount)}
                  status={<Pill tone={PAYOUT_TONE[p.status] || "gold"}>{t(`courses.payoutStatus.${p.status}`) || t("courses.payoutStatus.PENDING")}</Pill>}
                  onClick={() => setPayoutCourse(related)} />
              );
            })}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState icon={Wallet} title={t("courses.payoutsTab.emptyNoCourses")} subtitle={t("courses.payoutsTab.emptyNoCoursesSub")} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((c) => (
              <PayoutLine key={c.id} icon={<Wallet className="size-4" />} title={c.name}
                meta={`${c.teacherName || "—"} · ${c.teacherPercentage ?? "—"}%`} onClick={() => setPayoutCourse(c)} />
            ))}
          </div>
        )}
      </section>

      {/* Invoices */}
      <section>
        <SectionTitle icon={ReceiptText}
          action={<NButton variant="gold" size="sm" icon={Plus} onClick={() => setManualInvoiceOpen(true)}>{t("courses.payoutsTab.manualInvoice")}</NButton>}>
          {t("courses.payoutsTab.invoicesTitle")}
        </SectionTitle>
        <div className="mb-6 w-60">
          <SelectInput className="bg-white shadow-sm" value={invoiceCourse} onChange={setInvoiceCourse} options={courseOptions} placeholder={t("courses.payoutsTab.chooseCoursePlaceholder")} />
        </div>

        {!invoiceCourse ? (
          <EmptyState icon={ReceiptText} title={t("courses.payoutsTab.chooseCourseTitle")} subtitle={t("courses.payoutsTab.chooseCourseSub")} />
        ) : loadingInv ? (
          <div className={centered}><Spinner className="size-7" /></div>
        ) : errorInv ? (
          <ErrorNote msg={errorInv} />
        ) : invoices.length === 0 ? (
          <EmptyState icon={ReceiptText} title={t("courses.payoutsTab.emptyInvoicesTitle")} subtitle={t("courses.payoutsTab.emptyInvoicesSub")} />
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <InvoiceRow key={inv.id} invoice={inv} onPaid={() => { loadInvoices(); loadRevenue(); }} t={t} fmtMoney={fmtMoney} locale={locale} />
            ))}
          </div>
        )}
      </section>

      {payoutCourse && <PayoutPanel course={payoutCourse} onClose={() => { setPayoutCourse(null); refreshAll(); }} t={t} dir={dir} fmtMoney={fmtMoney} locale={locale} />}
      {manualInvoiceOpen && <ManualInvoiceModal courses={courses} onClose={() => setManualInvoiceOpen(false)} onCreated={() => { loadInvoices(); loadRevenue(); }} t={t} dir={dir} fmtMoney={fmtMoney} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function SchoolAdminCourses() {
  const { t, dir, locale } = useLanguage();
  const resolvedLocale = locale || "ar-DZ";

  const fmtMoney = useCallback((v) => {
    if (v == null) return "—";
    const amount = Number(v).toLocaleString(resolvedLocale, { maximumFractionDigits: 2 });
    return `${amount} ${t("studentDashboard.currency")}`;
  }, [resolvedLocale, t]);

  const [activeTab, setActiveTab] = useState("courses");
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [payoutCourseTarget, setPayoutCourseTarget] = useState(null);

  const loadCourses = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [coursesRes, teachersRes] = await Promise.all([
        courseApi.getSchoolCourses(),
        courseApi.getTeachers().catch(() => ({ data: [] })),
      ]);
      setCourses(coursesRes.data ?? []);
      setTeachers((teachersRes.data ?? []).filter((x) => !x.archived));
    } catch (err) {
      setError(err?.response?.data?.message || t("courses.coursesTab.loadError"));
    } finally { setLoading(false); }
  }, [t]);

  const loadPendingCount = useCallback(async () => {
    try { setPendingCount((await courseApi.countPending()).data?.pendingCount ?? 0); }
    catch { /* non-critical */ }
  }, []);

  useEffect(() => { loadCourses(); loadPendingCount(); }, [loadCourses, loadPendingCount]);

  const tabs = [
    { key: "courses",    label: t("courses.tabs.courses"),    icon: BookOpen,      badge: 0 },
    { key: "requests",   label: t("courses.tabs.requests"),   icon: Inbox,         badge: pendingCount },
    { key: "attendance", label: t("courses.tabs.attendance"), icon: GraduationCap, badge: 0 },
    { key: "payouts",    label: t("courses.tabs.payouts"),    icon: Wallet,        badge: 0 },
  ];

  const subtitle = loading
    ? "..."
    : `${interp(t("courses.activeCourseCount"), { count: courses.length })}${pendingCount > 0 ? interp(t("courses.pendingRequestsSuffix"), { count: pendingCount }) : ""}`;

  return (
    <div dir={dir} className="min-h-screen space-y-8 bg-ivory p-4 sm:p-8">
      {/* Header band */}
      <header className="relative overflow-hidden rounded-sm bg-green-deep px-6 py-10 sm:px-10 sm:py-12">
        <div className="nm-pattern pointer-events-none absolute inset-0 opacity-[0.08]" />
        <div className="pointer-events-none absolute -top-32 start-1/4 size-96 rounded-full bg-gold/10 blur-[110px]" />
        <ColumnMark className="pointer-events-none absolute -bottom-4 end-6 h-44 text-gold/10" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-gold">
            <Diamond className="size-2" />{subtitle}
          </span>
          <h1 className="mt-3 font-display text-3xl text-ivory sm:text-5xl">
            <AnimatedText text={t("courses.pageTitle")} />
          </h1>
        </div>
      </header>

      <PillTabs active={activeTab} onChange={setActiveTab} tabs={tabs} />

      <main>
        {activeTab === "courses" && (
          <CoursesTab courses={courses} teachers={teachers} loading={loading} error={error}
            onReload={() => { loadCourses(); loadPendingCount(); }}
            onOpenPayout={(c) => { setPayoutCourseTarget(c); setActiveTab("payouts"); }}
            t={t} dir={dir} fmtMoney={fmtMoney} />
        )}
        {activeTab === "requests" && (
          <RequestsTab courses={courses} onPendingCountChange={setPendingCount} t={t} dir={dir} fmtMoney={fmtMoney} locale={resolvedLocale} />
        )}
        {activeTab === "attendance" && <AttendanceTab courses={courses} t={t} dir={dir} locale={resolvedLocale} />}
        {activeTab === "payouts" && (
          <PayoutsTab courses={courses} initialCourse={payoutCourseTarget}
            onConsumeInitial={() => setPayoutCourseTarget(null)} t={t} dir={dir} fmtMoney={fmtMoney} locale={resolvedLocale} />
        )}
      </main>
    </div>
  );
}