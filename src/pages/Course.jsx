import { useState, useEffect, useCallback } from "react";
import {
  Plus, X, Users, Check, XCircle, RefreshCw, AlertCircle,
  BookOpen, ChevronLeft, ChevronRight, Search,
  Wallet, ReceiptText, Inbox, GraduationCap, Phone, User as UserIcon,
  CircleDollarSign, CalendarClock, Archive, MessageSquareText, Percent,
} from "lucide-react";
import api from "../api";
import { useLanguage } from "../context/LanguageContext";

// ══════════════════════════════════════════════════════════════════
//  API — SchoolAdmin course endpoints only (student-facing endpoints
//  such as /browse, /enroll-request, /mine are intentionally excluded)
// ══════════════════════════════════════════════════════════════════
const courseApi = {
  // Courses
  getSchoolCourses:   ()               => api.get("/api/courses"),
  getCourseById:      (id)             => api.get(`/api/courses/${id}`),
  createCourse:       (data)           => api.post("/api/courses", data),
  archiveCourse:      (id)             => api.patch(`/api/courses/${id}/archive`),

  // Teachers (reused from the school's teacher list, same as SubjectsAndClassrooms page)
  getTeachers:        ()               => api.get("/api/teachers"),

  // Enrollment requests
  getSchoolRequests:  (status, page, size) =>
    api.get("/api/courses/requests", { params: { status: status || undefined, page, size } }),
  getRequestsByCourse: (courseId, status) =>
    api.get(`/api/courses/${courseId}/requests`, { params: { status: status || undefined } }),
  countPending:       ()               => api.get("/api/courses/requests/count"),
  approveEnrollment:  (id)             => api.post(`/api/courses/enrollments/${id}/approve`),
  rejectEnrollment:   (id, comment)    => api.post(`/api/courses/enrollments/${id}/reject`, null, { params: { comment: comment || undefined } }),

  // Attendance
  markAttendance:      (sessionId, entries) => api.post(`/api/courses/sessions/${sessionId}/attendance`, entries),
  getAttendanceSheet:  (sessionId)          => api.get(`/api/courses/sessions/${sessionId}/attendance-sheet`),

  // Payouts
  calculatePayout:    (courseId)       => api.post(`/api/courses/${courseId}/calculate-payout`),
  markPayoutPaid:     (id)             => api.post(`/api/courses/payouts/${id}/pay`),
  getPayoutSummary:   ()               => api.get("/api/courses/payouts/summary"),

  // Invoices & revenue
  markInvoicePaid:    (id)             => api.post(`/api/courses/invoices/${id}/pay`),
  getInvoicesByCourse:(courseId)       => api.get(`/api/courses/${courseId}/invoices`),
  getRevenue:         ()               => api.get("/api/courses/revenue"),
  createManualInvoice:(data)           => api.post("/api/courses/invoices/manual", data),
};

// ══════════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════════
const P = "#185FA5";
const P_DARK = "#134d8a";
const GREEN = "#0F6E56";

// Canonical (untranslated) level keys, used as values sent to the API.
// Display labels come from t(`courses.levels.${key}`).
const LEVEL_KEYS = [
  "primary1", "primary2", "primary3", "primary4", "primary5",
  "middle1", "middle2", "middle3", "middle4",
  "secondary1", "secondary2", "secondary3", "bac",
];

const DAY_KEYS = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const inp = {
  padding: "9px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0",
  fontSize: 13, fontFamily: "'Cairo',sans-serif", color: "#0F172A",
  background: "#FAFCFF", outline: "none", width: "100%", boxSizing: "border-box",
};

const fmtDate  = (d, locale) => d ? new Date(d).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) : "—";
const fmtDateTime = (d, locale) => d ? new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

// Simple {token} interpolation helper for places where we build a
// string outside of t() (e.g. combining several t() calls).
const interp = (str, vars = {}) =>
  Object.keys(vars).reduce((acc, k) => acc.replaceAll(`{${k}}`, vars[k]), str);

// ══════════════════════════════════════════════════════════════════
//  SHARED PRIMITIVES (matching Schedule.jsx conventions)
// ══════════════════════════════════════════════════════════════════
function Spinner({ size = 18, color = P }) {
  return (
    <>
      <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${color}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

function ModalWrap({ onClose, children, maxWidth = 440, dir }) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "1rem", backdropFilter: "blur(2px)" }}>
      <div dir={dir} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth, border: "1.5px solid #E2E8F0", overflow: "hidden", fontFamily: "'Cairo',sans-serif", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.18)" }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1.5px solid #F1F5F9", background: "#FAFCFF", flexShrink: 0 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <X size={14} color="#64748B" />
      </button>
    </div>
  );
}

function ModalFooter({ children }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "1rem 1.25rem", borderTop: "1.5px solid #F1F5F9", background: "#FAFCFF", flexShrink: 0 }}>
      {children}
    </div>
  );
}

function BtnPrimary({ onClick, disabled, loading, icon: Icon, label, danger, color }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px", borderRadius: 10, border: "none", background: disabled || loading ? "#CBD5E1" : danger ? "#E24B4A" : (color || P), color: "#fff", fontSize: 13, fontWeight: 600, cursor: disabled || loading ? "not-allowed" : "pointer", fontFamily: "'Cairo',sans-serif", transition: "background .15s" }}>
      {loading ? <Spinner size={14} color="#fff" /> : Icon ? <Icon size={14} /> : null}
      {label}
    </button>
  );
}

function BtnGhost({ onClick, label, flex = 1 }) {
  return (
    <button onClick={onClick} style={{ flex, padding: "9px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
      {label}
    </button>
  );
}

function ErrorBox({ msg }) {
  return msg ? (
    <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, padding: "8px 13px", display: "flex", alignItems: "center", gap: 6 }}>
      <AlertCircle size={13} style={{ flexShrink: 0 }} /> {msg}
    </div>
  ) : null;
}

function Field({ label, children, required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>{label}{required && <span style={{ color: "#DC2626" }}> *</span>}</label>}
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder = "", ...rest }) {
  return <input style={inp} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

function Textarea({ value, onChange, placeholder = "", rows = 3 }) {
  return <textarea style={{ ...inp, resize: "none" }} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select style={{ ...inp, cursor: "pointer" }} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Badge({ label, bg, color, border }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: bg, color, border: `1px solid ${border}`, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function EmptyState({ icon: Icon = Inbox, title, subtitle }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3.5rem 1rem", color: "#94A3B8", textAlign: "center" }}>
      <Icon size={36} color="#E2E8F0" style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, marginTop: 4, maxWidth: 320 }}>{subtitle}</div>}
    </div>
  );
}

function TabBar({ active, onChange, tabs }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: 4, borderRadius: 12, background: "#fff", border: "1.5px solid #E2E8F0", overflowX: "auto" }}>
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "none",
            cursor: "pointer", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap",
            background: active === t.key ? P : "transparent", color: active === t.key ? "#fff" : "#64748B",
            transition: "background .15s, color .15s", position: "relative",
          }}>
          <t.icon size={14} />
          {t.label}
          {t.badge > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 17, height: 17, padding: "0 4px",
              borderRadius: 20, fontSize: 9.5, fontWeight: 800,
              background: active === t.key ? "rgba(255,255,255,.25)" : "#E24B4A",
              color: "#fff",
            }}>
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  COURSES TAB
// ══════════════════════════════════════════════════════════════════
const EMPTY_SESSION = { day: "", startTime: "08:00", endTime: "09:30" };
const EMPTY_COURSE = {
  name: "", subjectName: "", description: "",
  teacherId: "", externalTeacherName: "", externalTeacherPhone: "",
  level: "", maxStudents: "", totalPrice: "", teacherPercentage: "",
  sessions: [],
};

function CourseCard({ course, onArchive, onOpenPayout, t, fmtMoney }) {
  const pct = course.enrolledCount != null && course.maxStudents
    ? Math.min(100, Math.round((course.enrolledCount / course.maxStudents) * 100))
    : 0;

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "1.1rem", boxShadow: "0 1px 4px rgba(0,0,0,.03)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", gap: 11, minWidth: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "#EBF4FE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BookOpen size={19} color={P} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{course.name}</div>
            <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>{course.subjectName}</div>
            {course.description && (
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {course.description}
              </div>
            )}
          </div>
        </div>
        <button onClick={() => onArchive(course)} title={t("courses.coursesTab.archivedBadge")}
          style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Archive size={13} color="#DC2626" />
        </button>
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
        <Badge label={course.level } bg="#F1F5F9" color="#475569" border="#E2E8F0" />
        <Badge
          label={course.externalTeacher ? `👤 ${course.teacherName || t("courses.coursesTab.externalTeacherFallback")}` : `👨‍🏫 ${course.teacherName || "—"}`}
          bg={course.externalTeacher ? "#F3E8FF" : "#EBF4FE"}
          color={course.externalTeacher ? "#6B21A8" : P}
          border={course.externalTeacher ? "#E9D5FF" : "#B5D4F4"}
        />
        {course.archived && <Badge label={t("courses.coursesTab.archivedBadge")} bg="#F1F5F9" color="#94A3B8" border="#E2E8F0" />}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginBottom: 4 }}>
          <span>{course.enrolledCount ?? 0} / {course.maxStudents ?? "∞"} {t("courses.coursesTab.studentsSuffix")}</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 20, background: "#F1F5F9", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? "#DC2626" : P, borderRadius: 20, transition: "width .3s" }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 13, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
        <div style={{ display: "flex", gap: 14 }}>
          <div>
            <div style={{ fontSize: 9.5, color: "#94A3B8" }}>{t("courses.coursesTab.totalPriceLabel")}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{fmtMoney(course.totalPrice)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9.5, color: "#94A3B8" }}>{t("courses.coursesTab.teacherPercentageLabel")}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{course.teacherPercentage != null ? `${course.teacherPercentage}%` : "—"}</div>
          </div>
        </div>
        <button onClick={() => onOpenPayout(course)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "none", background: GREEN, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          <Wallet size={12} /> {t("courses.coursesTab.teacherSharePayoutButton")}
        </button>
      </div>
    </div>
  );
}

function SessionRow({ session, onChange, onRemove }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <div style={{ flex: 1.3 }}>
      <input type="date" style={inp} value={session.date} onChange={(e)=>{onChange({...session,date:e.target.value})}} />
      </div>
      <div style={{ flex: 1 }}>
        <input style={inp} type="time" value={session.startTime} onChange={(e) => onChange({ ...session, startTime: e.target.value })} />
      </div>
      <div style={{ flex: 1 }}>
        <input style={inp} type="time" value={session.endTime} onChange={(e) => onChange({ ...session, endTime: e.target.value })} />
      </div>
      <button onClick={onRemove} style={{ width: 34, height: 34, borderRadius: 9, border: "1.5px solid #FECACA", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <X size={13} color="#DC2626" />
      </button>
    </div>
  );
}

function CreateCourseModal({ teachers, onClose, onCreated, t, dir }) {
  const [form, setForm] = useState(EMPTY_COURSE);
  const [teacherMode, setTeacherMode] = useState("internal"); // "internal" | "external"
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const teacherOptions = teachers.map((t2) => ({ value: String(t2.id), label: `${t2.fullName}${t2.specialization ? " — " + t2.specialization : ""}` }));
  const levelOptions = LEVEL_KEYS.map((k) => ({ value: k, label: t(`courses.levels.${k}`) }));

  const addSession = () => setForm((f) => ({ ...f, sessions: [...f.sessions, { ...EMPTY_SESSION }] }));
  const updateSession = (i, sess) => setForm((f) => ({ ...f, sessions: f.sessions.map((s, idx) => idx === i ? sess : s) }));
  const removeSession = (i) => setForm((f) => ({ ...f, sessions: f.sessions.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.name.trim())        return setError(t("courses.createCourse.errors.name"));
    if (!form.subjectName.trim()) return setError(t("courses.createCourse.errors.subject"));
    if (teacherMode === "internal" && !form.teacherId) return setError(t("courses.createCourse.errors.teacher"));
    if (teacherMode === "external" && !form.externalTeacherName.trim()) return setError(t("courses.createCourse.errors.externalTeacherName"));
    if (!form.maxStudents)  return setError(t("courses.createCourse.errors.maxStudents"));
    if (!form.totalPrice)   return setError(t("courses.createCourse.errors.totalPrice"));
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
    <ModalWrap onClose={onClose} maxWidth={560} dir={dir}>
      <ModalHeader title={t("courses.createCourse.title")} subtitle={t("courses.createCourse.subtitle")} onClose={onClose} />
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label={t("courses.createCourse.nameLabel")} required>
            <Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder={t("courses.createCourse.namePlaceholder")} />
          </Field>
          <Field label={t("courses.createCourse.subjectLabel")} required>
            <Input value={form.subjectName} onChange={(v) => setForm((f) => ({ ...f, subjectName: v }))} placeholder={t("courses.createCourse.subjectPlaceholder")} />
          </Field>
        </div>

        <Field label={t("courses.createCourse.descriptionLabel")}>
          <Textarea value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder={t("courses.createCourse.descriptionPlaceholder")} />
        </Field>

        <Field label={t("courses.createCourse.teacherLabel")} required>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[
              { key: "internal", label: t("courses.createCourse.teacherModeInternal") },
              { key: "external", label: t("courses.createCourse.teacherModeExternal") },
            ].map((m) => (
              <button key={m.key} onClick={() => setTeacherMode(m.key)}
                style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1.5px solid ${teacherMode === m.key ? P : "#E2E8F0"}`, background: teacherMode === m.key ? "#EBF4FE" : "#fff", color: teacherMode === m.key ? P : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {m.label}
              </button>
            ))}
          </div>
          {teacherMode === "internal" ? (
            <Select value={form.teacherId} onChange={(v) => setForm((f) => ({ ...f, teacherId: v }))} options={teacherOptions} placeholder={t("courses.createCourse.teacherSelectPlaceholder")} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Input value={form.externalTeacherName} onChange={(v) => setForm((f) => ({ ...f, externalTeacherName: v }))} placeholder={t("courses.createCourse.externalNamePlaceholder")} />
              <Input value={form.externalTeacherPhone} onChange={(v) => setForm((f) => ({ ...f, externalTeacherPhone: v }))} placeholder={t("courses.createCourse.externalPhonePlaceholder")} />
            </div>
          )}
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label={t("courses.createCourse.levelLabel")}>
            <Select value={form.level} onChange={(v) => setForm((f) => ({ ...f, level: v }))} options={levelOptions} placeholder={t("courses.levels.allLevels")} />
          </Field>
          <Field label={t("courses.createCourse.maxStudentsLabel")} required>
            <Input type="number" value={form.maxStudents} onChange={(v) => setForm((f) => ({ ...f, maxStudents: v }))} placeholder={t("courses.createCourse.maxStudentsPlaceholder")} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label={t("courses.createCourse.totalPriceLabel")} required>
            <Input type="number" value={form.totalPrice} onChange={(v) => setForm((f) => ({ ...f, totalPrice: v }))} placeholder={t("courses.createCourse.totalPricePlaceholder")} />
          </Field>
          <Field label={t("courses.createCourse.teacherPercentageLabel")}>
            <Input type="number" value={form.teacherPercentage} onChange={(v) => setForm((f) => ({ ...f, teacherPercentage: v }))} placeholder={t("courses.createCourse.teacherPercentagePlaceholder")} />
          </Field>
        </div>

        <Field label={t("courses.createCourse.sessionsLabel")} required>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {form.sessions.map((s, i) => (
              <SessionRow key={i} session={s} onChange={(sess) => updateSession(i, sess)} onRemove={() => removeSession(i)} />
            ))}
            <button onClick={addSession}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", borderRadius: 9, border: "1.5px dashed #CBD5E1", background: "transparent", color: "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              <Plus size={13} /> {t("courses.createCourse.addSession")}
            </button>
          </div>
        </Field>

        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label={t("courses.createCourse.cancel")} />
        <BtnPrimary onClick={handleSave} loading={saving} icon={Plus} label={saving ? t("courses.createCourse.submitting") : t("courses.createCourse.submit")} />
      </ModalFooter>
    </ModalWrap>
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
    <ModalWrap onClose={onClose} maxWidth={360} dir={dir}>
      <ModalHeader title={t("courses.archiveCourse.title")} onClose={onClose} />
      <div style={{ padding: "1.5rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF2F2", border: "2px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Archive size={22} color="#DC2626" />
        </div>
        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: 0 }}>
          {interp(t("courses.archiveCourse.confirmText"), { name: course.name })}
          <br />
          <span style={{ fontSize: 11, color: "#94A3B8" }}>{t("courses.archiveCourse.confirmNote")}</span>
        </p>
        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label={t("courses.archiveCourse.cancel")} />
        <BtnPrimary onClick={handleConfirm} loading={saving} icon={Archive} label={saving ? t("courses.archiveCourse.archiving") : t("courses.archiveCourse.confirm")} danger />
      </ModalFooter>
    </ModalWrap>
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 240 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
            <Search size={14} color="#94A3B8" style={{ position: "absolute", insetInlineEnd: 11, top: "50%", transform: "translateY(-50%)" }} />
            <input style={{ ...inp, paddingInlineEnd: 32 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("courses.coursesTab.searchPlaceholder")} />
          </div>
          <div style={{ width: 160 }}>
            <Select value={levelFilter} onChange={setLevelFilter} options={levelOptions} placeholder={t("courses.levels.allLevels")} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onReload} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <RefreshCw size={13} /> {t("courses.coursesTab.refresh")}
          </button>
          <button onClick={() => setCreateOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: "none", background: P, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            <Plus size={14} /> {t("courses.coursesTab.addCourse")}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3.5rem" }}><Spinner size={28} /></div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "2.5rem" }}>
          <AlertCircle size={32} color="#E2A84B" />
          <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen}
          title={courses.length === 0 ? t("courses.coursesTab.emptyNoCourses") : t("courses.coursesTab.emptyNoResults")}
          subtitle={courses.length === 0 ? t("courses.coursesTab.emptyNoCoursesSub") : t("courses.coursesTab.emptyNoResultsSub")} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} onArchive={setArchiveTarget} onOpenPayout={onOpenPayout} t={t} fmtMoney={fmtMoney} />
          ))}
        </div>
      )}

      {createOpen && (
        <CreateCourseModal teachers={teachers} onClose={() => setCreateOpen(false)} onCreated={() => { onReload(); }} t={t} dir={dir} />
      )}
      {archiveTarget && (
        <ArchiveCourseModal course={archiveTarget} onClose={() => setArchiveTarget(null)} onConfirm={() => { setArchiveTarget(null); onReload(); }} t={t} dir={dir} />
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
    <ModalWrap onClose={onClose} maxWidth={400} dir={dir}>
      <ModalHeader title={t("courses.rejectModal.title")} subtitle={request.studentName} onClose={onClose} />
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label={t("courses.rejectModal.commentLabel")}>
          <Textarea value={comment} onChange={setComment} placeholder={t("courses.rejectModal.commentPlaceholder")} />
        </Field>
        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label={t("courses.rejectModal.cancel")} />
        <BtnPrimary onClick={handleReject} loading={saving} icon={XCircle} label={saving ? t("courses.rejectModal.confirming") : t("courses.rejectModal.confirm")} danger />
      </ModalFooter>
    </ModalWrap>
  );
}

function RequestRow({ request, onApprove, onReject, approving, t, fmtMoney, locale }) {
  const stMap = {
    PENDING:  { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
    ACCEPTED: { bg: "#E1F5EE", color: "#0F6E56", border: "#A7F3D0" },
    REJECTED: { bg: "#FEE2E2", color: "#DC2626", border: "#FECACA" },
  };
  const st = stMap[request.status] || stMap.PENDING;
  const stLabel = t(`courses.enrollmentStatus.${request.status}`) || t("courses.enrollmentStatus.PENDING");

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #E2E8F0", padding: "12px 14px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#EBF4FE", border: "2px solid #B5D4F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0C447C", flexShrink: 0 }}>
        {request.studentName?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"}
      </div>

      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{request.studentName}</span>
          {request.studentLevel && <Badge label={t(`courses.levels.${request.studentLevel}`) || request.studentLevel} bg="#F1F5F9" color="#475569" border="#E2E8F0" />}
        </div>
        <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span>📘 {request.courseName}{request.subjectName ? ` — ${request.subjectName}` : ""}</span>
          {request.parentName && <span><UserIcon size={10} style={{ display: "inline", verticalAlign: -1 }} /> {request.parentName}</span>}
          {request.parentPhone && <span><Phone size={10} style={{ display: "inline", verticalAlign: -1 }} /> {request.parentPhone}</span>}
        </div>
      </div>

      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 9.5, color: "#94A3B8" }}>{t("courses.requestRow.priceLabel")}</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{fmtMoney(request.totalPrice)}</div>
      </div>

      <div style={{ textAlign: "center", flexShrink: 0, minWidth: 90 }}>
        <div style={{ fontSize: 9.5, color: "#94A3B8" }}>{t("courses.requestRow.requestDateLabel")}</div>
        <div style={{ fontSize: 11, color: "#475569" }}>{fmtDateTime(request.createdAt, locale)}</div>
      </div>

      <Badge label={stLabel} bg={st.bg} color={st.color} border={st.border} />

      {request.status === "PENDING" ? (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => onApprove(request)} disabled={approving}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: approving ? "default" : "pointer", fontFamily: "inherit", opacity: approving ? .6 : 1 }}>
            {approving ? <Spinner size={12} color="#fff" /> : <Check size={12} />} {t("courses.requestsTab.approve")}
          </button>
          <button onClick={() => onReject(request)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <XCircle size={12} /> {t("courses.requestsTab.reject")}
          </button>
        </div>
      ) : request.reviewComment ? (
        <div style={{ fontSize: 10.5, color: "#94A3B8", display: "flex", alignItems: "center", gap: 4, maxWidth: 160 }}>
          <MessageSquareText size={11} /> {request.reviewComment}
        </div>
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
      setRequests((prev) => prev.map((r) => r.id === request.id ? { ...r, status: "ACCEPTED", reviewedAt: new Date().toISOString() } : r));
      refreshPendingBadge();
    } catch (err) {
      alert(err?.response?.data?.message || t("courses.requestsTab.approveFailed"));
    } finally { setApprovingId(null); }
  };

  const handleRejected = (request) => {
    setRequests((prev) => prev.map((r) => r.id === request.id ? { ...r, status: "REJECTED" } : r));
    setRejectTarget(null);
    refreshPendingBadge();
  };

  const courseOptions = courses.map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ width: 170 }}>
            <Select value={statusFilter} onChange={setStatusFilter}
              options={[
                { value: "PENDING", label: t("courses.enrollmentStatus.PENDING") },
                { value: "ACCEPTED", label: t("courses.enrollmentStatus.ACCEPTED") },
                { value: "REJECTED", label: t("courses.enrollmentStatus.REJECTED") },
              ]}
              placeholder={t("courses.requestsTab.statusAll")} />
          </div>
          <div style={{ width: 200 }}>
            <Select value={courseFilter} onChange={setCourseFilter} options={courseOptions} placeholder={t("courses.requestsTab.allCourses")} />
          </div>
        </div>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          <RefreshCw size={13} /> {t("courses.requestsTab.refresh")}
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3.5rem" }}><Spinner size={28} /></div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "2.5rem", color: "#DC2626", fontSize: 13 }}>{error}</div>
      ) : requests.length === 0 ? (
        <EmptyState icon={Inbox} title={t("courses.requestsTab.emptyTitle")} subtitle={t("courses.requestsTab.emptySubtitle")} />
      ) : (
        <>
          <div style={{ fontSize: 11.5, color: "#94A3B8", marginBottom: 10 }}>{totalElements} {t("courses.requestsTab.countSuffix")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {requests.map((r) => (
              <RequestRow key={r.id} request={r} approving={approvingId === r.id} onApprove={handleApprove} onReject={setRejectTarget} t={t} fmtMoney={fmtMoney} locale={locale} />
            ))}
          </div>

          {!courseFilter && totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 18 }}>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", cursor: page === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === 0 ? .4 : 1 }}>
                {dir === "rtl" ? <ChevronRight size={14} color="#64748B" /> : <ChevronLeft size={14} color="#64748B" />}
              </button>
              <span style={{ fontSize: 12, color: "#64748B" }}>{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", cursor: page >= totalPages - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page >= totalPages - 1 ? .4 : 1 }}>
                {dir === "rtl" ? <ChevronLeft size={14} color="#64748B" /> : <ChevronRight size={14} color="#64748B" />}
              </button>
            </div>
          )}
        </>
      )}

      {rejectTarget && (
        <RejectModal request={rejectTarget} onClose={() => setRejectTarget(null)} onRejected={handleRejected} t={t} dir={dir} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ATTENDANCE TAB
// ══════════════════════════════════════════════════════════════════
function SessionPickerCard({ course, session, onClick, t, dir }) {
  return (
    <button onClick={onClick}
      style={{ textAlign: dir === "rtl" ? "right" : "left", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
      <div style={{ width: 44, textAlign: "center", flexShrink: 0, padding: "6px 4px", borderRadius: 9, background: "#EBF4FE" }}>
     
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{course.name}</div>
        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
          {course.subjectName} · 🕐 {fmtTime(session.startTime)} – {fmtTime(session.endTime)} · 👨‍🏫 {course.teacherName}
        </div>
      </div>
      {dir === "rtl" ? <ChevronLeft size={16} color="#94A3B8" style={{ flexShrink: 0 }} /> : <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />}
    </button>
  );
}

function fmtTime(t) { return t ? String(t).slice(0, 5) : "—"; }

function AttendanceModal({ course, session, onClose, t, dir, locale }) {
  const [sheet, setSheet] = useState(null);     // AttendanceSheetDto | null (not loaded yet)
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
      // Pre-fill marks from any existing attendance records
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
      const entries = list
        .filter((s) => marks[s.studentId])
        .map((s) => ({ studentId: s.studentId, status: marks[s.studentId] }));
      if (entries.length === 0) { setError(t("courses.attendanceModal.atLeastOneRequired")); setSaving(false); return; }
      await courseApi.markAttendance(session.id, entries);
      setSubmitted(true);
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err?.response?.data?.message || t("courses.attendanceModal.saveFailed"));
    } finally { setSaving(false); }
  };

  const STATUS_BTNS = [
    { key: "PRESENT", Icon: Check,   activeColor: GREEN, activeBg: "#E1F5EE", title: t("courses.attendanceStatus.PRESENT") },
    { key: "ABSENT",  Icon: XCircle, activeColor: "#DC2626", activeBg: "#FEE2E2", title: t("courses.attendanceStatus.ABSENT") },
  ];

  return (
    <ModalWrap onClose={onClose} maxWidth={560} dir={dir}>
      <div style={{ padding: "1.1rem 1.25rem", background: "#EBF4FE", borderBottom: "1.5px solid #B5D4F4", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: P }}>{sheet?.moduleName || course.name}</div>
            <div style={{ fontSize: 11, color: P, opacity: .8, marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span>👨‍🏫 {sheet?.teacherName || course.teacherName}</span>
              <span>🕐 {fmtTime(sheet?.startTime || session.startTime)} – {fmtTime(sheet?.endTime || session.endTime)}</span>
              <span>📅 {sheet?.date ? fmtDate(sheet.date, locale) : (t(`courses.days.${session.day}`) || session.day)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #B5D4F4", background: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={14} color={P} />
          </button>
        </div>

        {list.length > 0 && (
          <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
            <Badge label={`👥 ${sheet?.totalEnrolled ?? list.length} ${t("courses.attendanceModal.totalEnrolledSuffix")}`} bg="rgba(255,255,255,.6)" color={P} border="#B5D4F4" />
            <Badge label={`✓ ${presentCount} ${t("courses.attendanceModal.presentSuffix")}`} bg="rgba(16,185,129,.15)" color={GREEN} border="#A7F3D0" />
            <Badge label={`✗ ${absentCount} ${t("courses.attendanceModal.absentSuffix")}`} bg="rgba(239,68,68,.15)" color="#DC2626" border="#FECACA" />
            <button onClick={() => markAll("PRESENT")} style={{ fontSize: 10, fontWeight: 600, padding: "3px 11px", borderRadius: 20, background: "#E1F5EE", color: GREEN, border: "1px solid #A7F3D0", cursor: "pointer", fontFamily: "inherit" }}>{t("courses.attendanceModal.markAllPresent")}</button>
            <button onClick={() => markAll("ABSENT")} style={{ fontSize: 10, fontWeight: 600, padding: "3px 11px", borderRadius: 20, background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer", fontFamily: "inherit" }}>{t("courses.attendanceModal.markAllAbsent")}</button>
          </div>
        )}
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {sheet === null && !loadError ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2.5rem" }}><Spinner size={26} /></div>
        ) : loadError ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#DC2626", fontSize: 13 }}>
            <AlertCircle size={28} style={{ marginBottom: 8 }} />
            <div>{loadError}</div>
          </div>
        ) : list.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
            <Users size={32} color="#E2E8F0" style={{ marginBottom: 8 }} />
            <div>{t("courses.attendanceModal.emptyStudents")}</div>
          </div>
        ) : list.map((s, i) => {
          const id = s.studentId;
          const status = marks[id];
          const rowBg = status === "PRESENT" ? "rgba(225,245,238,.55)" : status === "ABSENT" ? "rgba(254,226,226,.45)" : "#fff";
          return (
            <div key={id} style={{ padding: "10px 1.25rem", borderBottom: i < list.length - 1 ? "1px solid #F8FAFC" : "none", background: rowBg, transition: "background .2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EBF4FE", border: "2px solid #B5D4F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0C447C", flexShrink: 0 }}>
                  {s.fullName?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{s.fullName}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{s.level ?? s.parentPhone ?? ""}</div>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {STATUS_BTNS.map(({ key, Icon, activeColor, activeBg, title }) => (
                    <button key={key} title={title} onClick={() => mark(id, key)}
                      style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", border: `1.5px solid ${status === key ? activeColor : "#E2E8F0"}`, background: status === key ? activeBg : "#fff", color: status === key ? activeColor : "#CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                      <Icon size={13} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && <div style={{ padding: "0 1.25rem", paddingTop: 10 }}><ErrorBox msg={error} /></div>}

      <div style={{ padding: ".85rem 1.25rem", borderTop: "1.5px solid #F1F5F9", background: "#FAFCFF", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>{markedCount} / {list.length} {t("courses.attendanceModal.markedCountSuffix")}</span>
        <button onClick={handleSave} disabled={submitted || saving || list.length === 0}
          style={{ padding: "8px 20px", borderRadius: 9, border: "none", background: submitted ? GREEN : P, color: "#fff", fontSize: 13, fontWeight: 600, cursor: submitted ? "default" : "pointer", fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "background .3s" }}>
          {saving ? <Spinner size={14} color="#fff" /> : submitted ? <><Check size={14} /> {t("courses.attendanceModal.saved")}</> : t("courses.attendanceModal.save")}
        </button>
      </div>
    </ModalWrap>
  );
}

function AttendanceTab({ courses, t, dir, locale }) {
  const [courseFilter, setCourseFilter] = useState("");
  const [target, setTarget] = useState(null); // { course, session }

  const rows = [];
  courses.forEach((c) => {
    if (courseFilter && String(c.id) !== courseFilter) return;
    (c.sessions ?? []).forEach((s) => rows.push({ course: c, session: s }));
  });

  const courseOptions = courses.map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ width: 220 }}>
          <Select value={courseFilter} onChange={setCourseFilter} options={courseOptions} placeholder={t("courses.attendanceTab.allCourses")} />
        </div>
        <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{t("courses.attendanceTab.hint")}</div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={CalendarClock} title={t("courses.attendanceTab.emptyTitle")} subtitle={t("courses.attendanceTab.emptySubtitle")} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map(({ course, session }) => (
            <SessionPickerCard key={`${course.id}_${session.id ?? session.day + session.startTime}`} course={course} session={session} onClick={() => setTarget({ course, session })} t={t} dir={dir} />
          ))}
        </div>
      )}

      {target && (
        <AttendanceModal course={target.course} session={target.session} onClose={() => setTarget(null)} t={t} dir={dir} locale={locale} />
      )}
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

  const stMap = {
    PENDING: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
    PAID:    { bg: "#E1F5EE", color: "#0F6E56", border: "#A7F3D0" },
  };
  const st = payout ? (stMap[payout.status] || stMap.PENDING) : null;
  const stLabel = payout ? (t(`courses.payoutStatus.${payout.status}`) || t("courses.payoutStatus.PENDING")) : "";

  return (
    <ModalWrap onClose={onClose} maxWidth={440} dir={dir}>
      <ModalHeader title={t("courses.payoutPanel.title")} subtitle={course.name} onClose={onClose} />
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 14 }}>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: "#94A3B8" }}>{t("courses.payoutPanel.teacherLabel")}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{course.teacherName || "—"}</div>
          </div>
          <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: "#94A3B8" }}>{t("courses.payoutPanel.teacherPercentageLabel")}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
              <Percent size={11} style={{ display: "inline", verticalAlign: -1 }} /> {course.teacherPercentage ?? "—"}
            </div>
          </div>
        </div>

        {!payout ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "1.5rem 0" }}>
            <CircleDollarSign size={32} color="#CBD5E1" />
            <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", margin: 0 }}>{t("courses.payoutPanel.calculateHint")}</p>
            <ErrorBox msg={error} />
          </div>
        ) : (
          <div style={{ border: `1.5px solid ${st.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: st.bg, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{t("courses.payoutPanel.paymentStatusLabel")}</span>
              <Badge label={stLabel} bg="rgba(255,255,255,.6)" color={st.color} border={st.border} />
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ color: "#64748B" }}>{t("courses.payoutPanel.totalCourseRevenue")}</span>
                <span style={{ fontWeight: 700, color: "#0F172A" }}>{fmtMoney(payout.totalCourseRevenue)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ color: "#64748B" }}>{t("courses.payoutPanel.percentageLabel")}</span>
                <span style={{ fontWeight: 700, color: "#0F172A" }}>{payout.percentage}%</span>
              </div>
              <div style={{ height: 1, background: "#F1F5F9" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ fontWeight: 700, color: "#0F172A" }}>{t("courses.payoutPanel.payoutAmountLabel")}</span>
                <span style={{ fontWeight: 800, color: P }}>{fmtMoney(payout.payoutAmount)}</span>
              </div>
              {payout.paidAt && (
                <div style={{ fontSize: 10.5, color: "#94A3B8" }}>{interp(t("courses.payoutPanel.paidAtLabel"), { date: fmtDateTime(payout.paidAt, locale) })}</div>
              )}
            </div>
          </div>
        )}
        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label={t("courses.payoutPanel.close")} />
        {!payout ? (
          <BtnPrimary onClick={handleCalculate} loading={loading} icon={CircleDollarSign} label={loading ? t("courses.payoutPanel.calculating") : t("courses.payoutPanel.calculate")} />
        ) : payout.status !== "PAID" ? (
          <BtnPrimary onClick={handleMarkPaid} loading={paying} icon={Check} label={paying ? t("courses.payoutPanel.confirming") : t("courses.payoutPanel.confirmPayment")} color={GREEN} />
        ) : (
          <BtnPrimary onClick={handleCalculate} loading={loading} icon={RefreshCw} label={loading ? "..." : t("courses.payoutPanel.recalculate")} />
        )}
      </ModalFooter>
    </ModalWrap>
  );
}

function StatCard({ icon: Icon, label, value, color = P, bg = "#EBF4FE" }) {
  return (
    <div style={{ flex: 1, minWidth: 140, background: "#fff", borderRadius: 12, border: "1.5px solid #E2E8F0", padding: "12px 14px", display: "flex", alignItems: "center", gap: 11 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 9.5, color: "#94A3B8" }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      </div>
    </div>
  );
}

function InvoiceRow({ invoice, onPaid, t, fmtMoney, locale }) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const status = invoice.status || "PENDING";
  const stMap = {
    PENDING: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
    PAID:    { bg: "#E1F5EE", color: "#0F6E56", border: "#A7F3D0" },
    OVERDUE: { bg: "#FEE2E2", color: "#DC2626", border: "#FECACA" },
  };
  const st = stMap[status] || stMap.PENDING;
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
    <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #E2E8F0", padding: "12px 14px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FAEEDA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ReceiptText size={16} color="#854F0B" />
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{invoice.studentName}</div>
        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{invoice.courseName}</div>
      </div>
      {invoice.dueDate && (
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 9.5, color: "#94A3B8" }}>{t("courses.payoutsTab.dueDateLabel")}</div>
          <div style={{ fontSize: 11, color: "#475569" }}>{fmtDate(invoice.dueDate, locale)}</div>
        </div>
      )}
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 9.5, color: "#94A3B8" }}>{t("courses.payoutsTab.amountLabel")}</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{fmtMoney(invoice.amount)}</div>
      </div>
      <Badge label={stLabel} bg={st.bg} color={st.color} border={st.border} />
      {status !== "PAID" && (
        <button onClick={handlePay} disabled={paying}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: paying ? "default" : "pointer", fontFamily: "inherit", opacity: paying ? .6 : 1 }}>
          {paying ? <Spinner size={12} color="#fff" /> : <Check size={12} />} {t("courses.payoutsTab.confirmPayment")}
        </button>
      )}
      {error && <div style={{ width: "100%" }}><ErrorBox msg={error} /></div>}
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
      const payload = {
        enrollmentId: Number(enrollmentId),
        amount: amount ? Number(amount) : undefined,
        dueDate: dueDate || undefined,
      };
      const res = await courseApi.createManualInvoice(payload);
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t("courses.manualInvoiceModal.createFailed"));
    } finally { setSaving(false); }
  };

  return (
    <ModalWrap onClose={onClose} maxWidth={440} dir={dir}>
      <ModalHeader title={t("courses.manualInvoiceModal.title")} subtitle={t("courses.manualInvoiceModal.subtitle")} onClose={onClose} />
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label={t("courses.manualInvoiceModal.courseLabel")} required>
          <Select value={courseId} onChange={setCourseId} options={courseOptions} placeholder={t("courses.manualInvoiceModal.coursePlaceholder")} />
        </Field>
        <Field label={t("courses.manualInvoiceModal.studentLabel")} required>
          {loadingReq ? (
            <div style={{ display: "flex", padding: "8px 0" }}><Spinner size={16} /></div>
          ) : (
            <Select value={enrollmentId} onChange={setEnrollmentId} options={requestOptions}
              placeholder={courseId ? (requests.length === 0 ? t("courses.manualInvoiceModal.studentPlaceholderNoStudents") : t("courses.manualInvoiceModal.studentPlaceholder")) : t("courses.manualInvoiceModal.studentPlaceholderNoCourse")} />
          )}
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label={t("courses.manualInvoiceModal.amountLabel")}>
            <Input type="number" value={amount} onChange={setAmount} placeholder={selectedRequest ? String(selectedRequest.totalPrice) : t("courses.manualInvoiceModal.amountDefaultHint")} />
          </Field>
          <Field label={t("courses.manualInvoiceModal.dueDateLabel")}>
            <input type="date" style={inp} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
        </div>
        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label={t("courses.manualInvoiceModal.cancel")} />
        <BtnPrimary onClick={handleSave} loading={saving} icon={ReceiptText} label={saving ? t("courses.manualInvoiceModal.submitting") : t("courses.manualInvoiceModal.submit")} />
      </ModalFooter>
    </ModalWrap>
  );
}

function PayoutsTab({ courses, initialCourse, onConsumeInitial, t, dir, fmtMoney, locale }) {
  const [payoutCourse, setPayoutCourse] = useState(null);
  const [invoiceCourse, setInvoiceCourse] = useState("");
  const [manualInvoiceOpen, setManualInvoiceOpen] = useState(false);

  useEffect(() => {
    if (initialCourse) {
      setPayoutCourse(initialCourse);
      onConsumeInitial();
    }
  }, [initialCourse, onConsumeInitial]);

  // ── School-wide payout summary ──────────────────────────────────
  const [payoutSummary, setPayoutSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [errorSummary, setErrorSummary] = useState(null);

  const loadPayoutSummary = useCallback(async () => {
    setLoadingSummary(true); setErrorSummary(null);
    try {
      const res = await courseApi.getPayoutSummary();
      setPayoutSummary(res.data);
    } catch (err) {
      setErrorSummary(err?.response?.data?.message || t("courses.payoutsTab.summaryLoadError"));
    } finally { setLoadingSummary(false); }
  }, []);

  useEffect(() => { loadPayoutSummary(); }, [loadPayoutSummary]);

  // ── School-wide revenue summary ─────────────────────────────────
  const [revenue, setRevenue] = useState(null);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [errorRevenue, setErrorRevenue] = useState(null);

  const loadRevenue = useCallback(async () => {
    setLoadingRevenue(true); setErrorRevenue(null);
    try {
      const res = await courseApi.getRevenue();
      setRevenue(res.data);
    } catch (err) {
      setErrorRevenue(err?.response?.data?.message || t("courses.payoutsTab.revenueLoadError"));
    } finally { setLoadingRevenue(false); }
  }, []);

  useEffect(() => { loadRevenue(); }, [loadRevenue]);

  // ── Per-course invoice list ─────────────────────────────────────
  const [invoices, setInvoices] = useState([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [errorInv, setErrorInv] = useState(null);

  const loadInvoices = useCallback(async () => {
    if (!invoiceCourse) { setInvoices([]); return; }
    setLoadingInv(true); setErrorInv(null);
    try {
      const res = await courseApi.getInvoicesByCourse(invoiceCourse);
      setInvoices(res.data ?? []);
    } catch (err) {
      setErrorInv(err?.response?.data?.message || t("courses.payoutsTab.invoicesLoadError"));
    } finally { setLoadingInv(false); }
  }, [invoiceCourse]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const refreshAll = () => { loadPayoutSummary(); loadRevenue(); loadInvoices(); };

  const courseOptions = courses.map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Revenue overview ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <CircleDollarSign size={15} color={P} />
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("courses.payoutsTab.revenueOverviewTitle")}</h3>
        </div>
        {loadingRevenue ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}><Spinner size={24} /></div>
        ) : errorRevenue ? (
          <ErrorBox msg={errorRevenue} />
        ) : revenue && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <StatCard icon={CircleDollarSign} label={t("courses.payoutsTab.expectedRevenue")} value={fmtMoney(revenue.totalExpected)} color={P} bg="#EBF4FE" />
            <StatCard icon={Check} label={t("courses.payoutsTab.collected")} value={fmtMoney(revenue.totalCollected)} color={GREEN} bg="#E1F5EE" />
            <StatCard icon={CalendarClock} label={t("courses.payoutsTab.pending")} value={fmtMoney(revenue.totalPending)} color="#92400E" bg="#FEF3C7" />
            <StatCard icon={AlertCircle} label={t("courses.payoutsTab.overdue")} value={fmtMoney(revenue.totalOverdue)} color="#DC2626" bg="#FEE2E2" />
          </div>
        )}
      </div>

      {/* ── Teacher payouts summary ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Wallet size={15} color={P} />
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("courses.payoutsTab.teacherPayoutsTitle")}</h3>
        </div>

        {loadingSummary ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}><Spinner size={24} /></div>
        ) : errorSummary ? (
          <ErrorBox msg={errorSummary} />
        ) : payoutSummary && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <StatCard icon={CalendarClock} label={t("courses.payoutsTab.duePayouts")} value={fmtMoney(payoutSummary.totalPayoutsDue)} color="#92400E" bg="#FEF3C7" />
            <StatCard icon={Check} label={t("courses.payoutsTab.paidPayouts")} value={fmtMoney(payoutSummary.totalPayoutsPaid)} color={GREEN} bg="#E1F5EE" />
            <StatCard icon={BookOpen} label={t("courses.payoutsTab.courseCount")} value={payoutSummary.courseCount ?? courses.length} color={P} bg="#EBF4FE" />
          </div>
        )}

        {payoutSummary?.payouts?.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {payoutSummary.payouts.map((p) => {
              const stMap = {
                PENDING: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
                PAID:    { bg: "#E1F5EE", color: "#0F6E56", border: "#A7F3D0" },
              };
              const st = stMap[p.status] || stMap.PENDING;
              const stLabel = t(`courses.payoutStatus.${p.status}`) || t("courses.payoutStatus.PENDING");
              const relatedCourse = courses.find((c) => c.id === p.courseId) || { id: p.courseId, name: p.courseName, teacherName: p.teacherName, teacherPercentage: p.percentage };
              return (
                <button key={p.id} onClick={() => setPayoutCourse(relatedCourse)}
                  style={{ textAlign: dir === "rtl" ? "right" : "left", display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Wallet size={16} color={GREEN} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.courseName}</div>
                    <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 1 }}>{p.teacherName || "—"} · {p.percentage ?? "—"}%</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", flexShrink: 0 }}>{fmtMoney(p.payoutAmount)}</div>
                  <Badge label={stLabel} bg={st.bg} color={st.color} border={st.border} />
                  {dir === "rtl" ? <ChevronLeft size={14} color="#CBD5E1" style={{ flexShrink: 0 }} /> : <ChevronRight size={14} color="#CBD5E1" style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState icon={Wallet} title={t("courses.payoutsTab.emptyNoCourses")} subtitle={t("courses.payoutsTab.emptyNoCoursesSub")} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {courses.map((c) => (
              <button key={c.id} onClick={() => setPayoutCourse(c)}
                style={{ textAlign: dir === "rtl" ? "right" : "left", display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Wallet size={16} color={GREEN} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 1 }}>{c.teacherName || "—"} · {c.teacherPercentage ?? "—"}%</div>
                </div>
                {dir === "rtl" ? <ChevronLeft size={14} color="#CBD5E1" style={{ flexShrink: 0 }} /> : <ChevronRight size={14} color="#CBD5E1" style={{ flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Student invoices ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ReceiptText size={15} color="#854F0B" />
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("courses.payoutsTab.invoicesTitle")}</h3>
          </div>
          <button onClick={() => setManualInvoiceOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "none", background: P, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <Plus size={13} /> {t("courses.payoutsTab.manualInvoice")}
          </button>
        </div>
        <div style={{ width: 220, marginBottom: 12 }}>
          <Select value={invoiceCourse} onChange={setInvoiceCourse} options={courseOptions} placeholder={t("courses.payoutsTab.chooseCoursePlaceholder")} />
        </div>

        {!invoiceCourse ? (
          <EmptyState icon={ReceiptText} title={t("courses.payoutsTab.chooseCourseTitle")} subtitle={t("courses.payoutsTab.chooseCourseSub")} />
        ) : loadingInv ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2.5rem" }}><Spinner size={26} /></div>
        ) : errorInv ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#DC2626", fontSize: 13 }}>{errorInv}</div>
        ) : invoices.length === 0 ? (
          <EmptyState icon={ReceiptText} title={t("courses.payoutsTab.emptyInvoicesTitle")} subtitle={t("courses.payoutsTab.emptyInvoicesSub")} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {invoices.map((inv) => (
              <InvoiceRow key={inv.id} invoice={inv} onPaid={() => { loadInvoices(); loadRevenue(); }} t={t} fmtMoney={fmtMoney} locale={locale} />
            ))}
          </div>
        )}
      </div>

      {payoutCourse && (
        <PayoutPanel course={payoutCourse} onClose={() => { setPayoutCourse(null); refreshAll(); }} t={t} dir={dir} fmtMoney={fmtMoney} locale={locale} />
      )}
      {manualInvoiceOpen && (
        <ManualInvoiceModal courses={courses} onClose={() => setManualInvoiceOpen(false)} onCreated={() => { loadInvoices(); loadRevenue(); }} t={t} dir={dir} fmtMoney={fmtMoney} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function SchoolAdminCourses() {
  const { t, dir, locale } = useLanguage();
  // `locale` (e.g. "ar-DZ" / "fr-FR" / "en-US") is expected from
  // LanguageContext for Intl.NumberFormat/toLocaleDateString use below.
  // Falls back to "ar-DZ" if the context doesn't expose it.
  const resolvedLocale = locale || "ar-DZ";
  const currency = t("courses.invoiceStatus") ? undefined : undefined; // no-op, keeps t referenced

  const fmtMoney = useCallback((v) => {
    if (v == null) return "—";
    const amount = Number(v).toLocaleString(resolvedLocale, { maximumFractionDigits: 2 });
    // Currency string lives under studentDashboard.currency in the
    // provided translations.js; reuse it so "DA / دج / DA" follows locale.
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
      setTeachers((teachersRes.data ?? []).filter((t2) => !t2.archived));
    } catch (err) {
      setError(err?.response?.data?.message || t("courses.coursesTab.loadError"));
    } finally { setLoading(false); }
  }, [t]);

  const loadPendingCount = useCallback(async () => {
    try {
      const res = await courseApi.countPending();
      setPendingCount(res.data?.pendingCount ?? 0);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { loadCourses(); loadPendingCount(); }, [loadCourses, loadPendingCount]);

  const tabs = [
    { key: "courses",    label: t("courses.tabs.courses"),   icon: BookOpen,      badge: 0 },
    { key: "requests",   label: t("courses.tabs.requests"),  icon: Inbox,         badge: pendingCount },
    { key: "attendance", label: t("courses.tabs.attendance"),icon: GraduationCap, badge: 0 },
    { key: "payouts",    label: t("courses.tabs.payouts"),   icon: Wallet,        badge: 0 },
  ];

  return (
    <div dir={dir} style={{ padding: "1.25rem 1.5rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column", gap: "1.1rem" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>{t("courses.pageTitle")}</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: "3px 0 0" }}>
            {loading
              ? "..."
              : `${interp(t("courses.activeCourseCount"), { count: courses.length })}${pendingCount > 0 ? interp(t("courses.pendingRequestsSuffix"), { count: pendingCount }) : ""}`}
          </p>
        </div>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} tabs={tabs} />

      <div>
        {activeTab === "courses" && (
          <CoursesTab
            courses={courses}
            teachers={teachers}
            loading={loading}
            error={error}
            onReload={() => { loadCourses(); loadPendingCount(); }}
            onOpenPayout={(c) => { setPayoutCourseTarget(c); setActiveTab("payouts"); }}
            t={t}
            dir={dir}
            fmtMoney={fmtMoney}
          />
        )}
        {activeTab === "requests" && (
          <RequestsTab courses={courses} onPendingCountChange={setPendingCount} t={t} dir={dir} fmtMoney={fmtMoney} locale={resolvedLocale} />
        )}
        {activeTab === "attendance" && (
          <AttendanceTab courses={courses} t={t} dir={dir} locale={resolvedLocale} />
        )}
        {activeTab === "payouts" && (
          <PayoutsTab courses={courses} initialCourse={payoutCourseTarget} onConsumeInitial={() => setPayoutCourseTarget(null)} t={t} dir={dir} fmtMoney={fmtMoney} locale={resolvedLocale} />
        )}
      </div>
    </div>
  );
}