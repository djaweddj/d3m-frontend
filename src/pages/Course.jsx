import { useState, useEffect, useCallback } from "react";
import {
  Plus, X, Users, Check, XCircle, RefreshCw, AlertCircle,
  BookOpen, ChevronLeft, ChevronRight, Search,
  Wallet, ReceiptText, Inbox, GraduationCap, Phone, User as UserIcon,
  CircleDollarSign, CalendarClock, Archive, MessageSquareText, Percent,
} from "lucide-react";
import api from "../api";

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

const LEVEL_OPTIONS = [
  "ابتدائي 1", "ابتدائي 2", "ابتدائي 3", "ابتدائي 4", "ابتدائي 5",
  "متوسط 1", "متوسط 2", "متوسط 3", "متوسط 4",
  "ثانوي 1", "ثانوي 2", "ثانوي 3", "BAC",
];

const ENROLLMENT_STATUS = {
  PENDING:  { label: "قيد الانتظار", bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  ACCEPTED : { label: "مقبول",        bg: "#E1F5EE", color: "#0F6E56", border: "#A7F3D0" },
  REJECTED: { label: "مرفوض",        bg: "#FEE2E2", color: "#DC2626", border: "#FECACA" },
};

const PAYOUT_STATUS = {
  PENDING: { label: "قيد الانتظار", bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  PAID:    { label: "تم الدفع",     bg: "#E1F5EE", color: "#0F6E56", border: "#A7F3D0" },
};

const INVOICE_STATUS = {
  PENDING: { label: "غير مدفوعة", bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  PAID:    { label: "مدفوعة",     bg: "#E1F5EE", color: "#0F6E56", border: "#A7F3D0" },
  OVERDUE: { label: "متأخرة",     bg: "#FEE2E2", color: "#DC2626", border: "#FECACA" },
};

const ATTENDANCE_STATUS = {
  PRESENT: { label: "حاضر", color: GREEN,   bg: "#E1F5EE", border: "#A7F3D0" },
  ABSENT:  { label: "غائب", color: "#DC2626", bg: "#FEE2E2", border: "#FECACA" },
};

const inp = {
  padding: "9px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0",
  fontSize: 13, fontFamily: "'Cairo',sans-serif", color: "#0F172A",
  background: "#FAFCFF", outline: "none", width: "100%", boxSizing: "border-box",
};

const fmtMoney = (v) => v == null ? "—" : Number(v).toLocaleString("ar-DZ", { maximumFractionDigits: 2 }) + " دج";
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("ar-MA", { day: "numeric", month: "long", year: "numeric" }) : "—";
const fmtDateTime = (d) => d ? new Date(d).toLocaleDateString("ar-MA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

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

function ModalWrap({ onClose, children, maxWidth = 440 }) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "1rem", backdropFilter: "blur(2px)" }}>
      <div dir="rtl" style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth, border: "1.5px solid #E2E8F0", overflow: "hidden", fontFamily: "'Cairo',sans-serif", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.18)" }}>
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
const DAY_OPTIONS = [
  { value: "SATURDAY",  label: "السبت" },
  { value: "SUNDAY",    label: "الأحد" },
  { value: "MONDAY",    label: "الإثنين" },
  { value: "TUESDAY",   label: "الثلاثاء" },
  { value: "WEDNESDAY", label: "الأربعاء" },
  { value: "THURSDAY",  label: "الخميس" },
  { value: "FRIDAY",    label: "الجمعة" },
];

function CourseCard({ course, onArchive, onOpenPayout }) {
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
        <button onClick={() => onArchive(course)} title="أرشفة الدورة"
          style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Archive size={13} color="#DC2626" />
        </button>
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
        <Badge label={course.level || "كل المستويات"} bg="#F1F5F9" color="#475569" border="#E2E8F0" />
        <Badge
          label={course.externalTeacher ? `👤 ${course.teacherName || "أستاذ خارجي"}` : `👨‍🏫 ${course.teacherName || "—"}`}
          bg={course.externalTeacher ? "#F3E8FF" : "#EBF4FE"}
          color={course.externalTeacher ? "#6B21A8" : P}
          border={course.externalTeacher ? "#E9D5FF" : "#B5D4F4"}
        />
        {course.archived && <Badge label="مؤرشفة" bg="#F1F5F9" color="#94A3B8" border="#E2E8F0" />}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginBottom: 4 }}>
          <span>{course.enrolledCount ?? 0} / {course.maxStudents ?? "∞"} طالب</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 20, background: "#F1F5F9", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? "#DC2626" : P, borderRadius: 20, transition: "width .3s" }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 13, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
        <div style={{ display: "flex", gap: 14 }}>
          <div>
            <div style={{ fontSize: 9.5, color: "#94A3B8" }}>السعر الكلي</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{fmtMoney(course.totalPrice)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9.5, color: "#94A3B8" }}>نسبة الأستاذ</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{course.teacherPercentage != null ? `${course.teacherPercentage}%` : "—"}</div>
          </div>
        </div>
        <button onClick={() => onOpenPayout(course)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "none", background: GREEN, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          <Wallet size={12} /> نصيب الأستاذ
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

function CreateCourseModal({ teachers, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_COURSE);
  const [teacherMode, setTeacherMode] = useState("internal"); // "internal" | "external"
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const teacherOptions = teachers.map((t) => ({ value: String(t.id), label: `${t.fullName}${t.specialization ? " — " + t.specialization : ""}` }));

  const addSession = () => setForm((f) => ({ ...f, sessions: [...f.sessions, { ...EMPTY_SESSION }] }));
  const updateSession = (i, sess) => setForm((f) => ({ ...f, sessions: f.sessions.map((s, idx) => idx === i ? sess : s) }));
  const removeSession = (i) => setForm((f) => ({ ...f, sessions: f.sessions.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.name.trim())        return setError("أدخل اسم الدورة");
    if (!form.subjectName.trim()) return setError("أدخل اسم المادة");
    if (teacherMode === "internal" && !form.teacherId) return setError("اختر الأستاذ");
    if (teacherMode === "external" && !form.externalTeacherName.trim()) return setError("أدخل اسم الأستاذ الخارجي");
    if (!form.maxStudents)  return setError("أدخل العدد الأقصى للطلاب");
    if (!form.totalPrice)   return setError("أدخل السعر الكلي");
    if (form.sessions.length === 0) return setError("أضف حصة واحدة على الأقل");
    if (form.sessions.some((s) => !s.date || !s.startTime || !s.endTime)) return setError("أكمل كل حقول الحصص");
    if (form.sessions.some((s) => s.startTime >= s.endTime)) return setError("وقت البداية يجب أن يكون قبل النهاية في كل حصة");

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
      setError(err?.response?.data?.message || "فشل إنشاء الدورة");
    } finally { setSaving(false); }
  };

  return (
    <ModalWrap onClose={onClose} maxWidth={560}>
      <ModalHeader title="إضافة دورة جديدة" subtitle="أنشئ دورة وحدد الأستاذ والجلسات" onClose={onClose} />
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="اسم الدورة" required>
            <Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="مثال: دورة تحضير BAC" />
          </Field>
          <Field label="المادة" required>
            <Input value={form.subjectName} onChange={(v) => setForm((f) => ({ ...f, subjectName: v }))} placeholder="مثال: رياضيات" />
          </Field>
        </div>

        <Field label="الوصف">
          <Textarea value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="وصف اختياري..." />
        </Field>

        <Field label="الأستاذ" required>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[{ key: "internal", label: "أستاذ داخلي" }, { key: "external", label: "أستاذ خارجي" }].map((m) => (
              <button key={m.key} onClick={() => setTeacherMode(m.key)}
                style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1.5px solid ${teacherMode === m.key ? P : "#E2E8F0"}`, background: teacherMode === m.key ? "#EBF4FE" : "#fff", color: teacherMode === m.key ? P : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {m.label}
              </button>
            ))}
          </div>
          {teacherMode === "internal" ? (
            <Select value={form.teacherId} onChange={(v) => setForm((f) => ({ ...f, teacherId: v }))} options={teacherOptions} placeholder="اختر أستاذاً…" />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Input value={form.externalTeacherName} onChange={(v) => setForm((f) => ({ ...f, externalTeacherName: v }))} placeholder="اسم الأستاذ" />
              <Input value={form.externalTeacherPhone} onChange={(v) => setForm((f) => ({ ...f, externalTeacherPhone: v }))} placeholder="رقم الهاتف" />
            </div>
          )}
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="المستوى">
            <Select value={form.level} onChange={(v) => setForm((f) => ({ ...f, level: v }))} options={LEVEL_OPTIONS.map((l) => ({ value: l, label: l }))} placeholder="كل المستويات" />
          </Field>
          <Field label="العدد الأقصى للطلاب" required>
            <Input type="number" value={form.maxStudents} onChange={(v) => setForm((f) => ({ ...f, maxStudents: v }))} placeholder="مثال: 20" />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="السعر الكلي (دج)" required>
            <Input type="number" value={form.totalPrice} onChange={(v) => setForm((f) => ({ ...f, totalPrice: v }))} placeholder="مثال: 5000" />
          </Field>
          <Field label="نسبة الأستاذ (%)">
            <Input type="number" value={form.teacherPercentage} onChange={(v) => setForm((f) => ({ ...f, teacherPercentage: v }))} placeholder="مثال: 60" />
          </Field>
        </div>

        <Field label="الحصص" required>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {form.sessions.map((s, i) => (
              <SessionRow key={i} session={s} onChange={(sess) => updateSession(i, sess)} onRemove={() => removeSession(i)} />
            ))}
            <button onClick={addSession}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", borderRadius: 9, border: "1.5px dashed #CBD5E1", background: "transparent", color: "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              <Plus size={13} /> إضافة حصة
            </button>
          </div>
        </Field>

        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label="إلغاء" />
        <BtnPrimary onClick={handleSave} loading={saving} icon={Plus} label={saving ? "جارٍ الحفظ..." : "إنشاء الدورة"} />
      </ModalFooter>
    </ModalWrap>
  );
}

function ArchiveCourseModal({ course, onClose, onConfirm }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setSaving(true); setError("");
    try {
      await courseApi.archiveCourse(course.id);
      onConfirm(course);
    } catch (err) {
      setError(err?.response?.data?.message || "فشل أرشفة الدورة");
      setSaving(false);
    }
  };

  return (
    <ModalWrap onClose={onClose} maxWidth={360}>
      <ModalHeader title="أرشفة الدورة" onClose={onClose} />
      <div style={{ padding: "1.5rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF2F2", border: "2px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Archive size={22} color="#DC2626" />
        </div>
        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: 0 }}>
          هل أنت متأكد من أرشفة دورة{" "}
          <strong style={{ color: "#0F172A" }}>{course.name}</strong>؟
          <br />
          <span style={{ fontSize: 11, color: "#94A3B8" }}>لن تظهر الدورة في القائمة ولن يتمكن الطلاب من التسجيل فيها بعد الأرشفة.</span>
        </p>
        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label="إلغاء" />
        <BtnPrimary onClick={handleConfirm} loading={saving} icon={Archive} label={saving ? "جارٍ الأرشفة..." : "أرشفة"} danger />
      </ModalFooter>
    </ModalWrap>
  );
}

function CoursesTab({ courses, teachers, loading, error, onReload, onOpenPayout }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

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
            <Search size={14} color="#94A3B8" style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)" }} />
            <input style={{ ...inp, paddingRight: 32 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن دورة، مادة، أستاذ..." />
          </div>
          <div style={{ width: 160 }}>
            <Select value={levelFilter} onChange={setLevelFilter} options={LEVEL_OPTIONS.map((l) => ({ value: l, label: l }))} placeholder="كل المستويات" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onReload} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <RefreshCw size={13} /> تحديث
          </button>
          <button onClick={() => setCreateOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: "none", background: P, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            <Plus size={14} /> إضافة دورة
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
        <EmptyState icon={BookOpen} title={courses.length === 0 ? "لا توجد دورات بعد" : "لا توجد نتائج"} subtitle={courses.length === 0 ? "أضف أول دورة دراسية للبدء" : "جرّب تعديل البحث أو الفلترة"} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} onArchive={setArchiveTarget} onOpenPayout={onOpenPayout} />
          ))}
        </div>
      )}

      {createOpen && (
        <CreateCourseModal teachers={teachers} onClose={() => setCreateOpen(false)} onCreated={() => { onReload(); }} />
      )}
      {archiveTarget && (
        <ArchiveCourseModal course={archiveTarget} onClose={() => setArchiveTarget(null)} onConfirm={() => { setArchiveTarget(null); onReload(); }} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ENROLLMENT REQUESTS TAB
// ══════════════════════════════════════════════════════════════════
function RejectModal({ request, onClose, onRejected }) {
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleReject = async () => {
    setSaving(true); setError("");
    try {
      await courseApi.rejectEnrollment(request.id, comment.trim());
      onRejected(request);
    } catch (err) {
      setError(err?.response?.data?.message || "فشل رفض الطلب");
      setSaving(false);
    }
  };

  return (
    <ModalWrap onClose={onClose} maxWidth={400}>
      <ModalHeader title="رفض طلب التسجيل" subtitle={request.studentName} onClose={onClose} />
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="سبب الرفض (اختياري)">
          <Textarea value={comment} onChange={setComment} placeholder="اكتب سبب الرفض ليظهر لولي الأمر..." />
        </Field>
        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label="إلغاء" />
        <BtnPrimary onClick={handleReject} loading={saving} icon={XCircle} label={saving ? "جارٍ الرفض..." : "تأكيد الرفض"} danger />
      </ModalFooter>
    </ModalWrap>
  );
}

function RequestRow({ request, onApprove, onReject, approving }) {
  const st = ENROLLMENT_STATUS[request.status] || ENROLLMENT_STATUS.PENDING;
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #E2E8F0", padding: "12px 14px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#EBF4FE", border: "2px solid #B5D4F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0C447C", flexShrink: 0 }}>
        {request.studentName?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"}
      </div>

      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{request.studentName}</span>
          {request.studentLevel && <Badge label={request.studentLevel} bg="#F1F5F9" color="#475569" border="#E2E8F0" />}
        </div>
        <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span>📘 {request.courseName}{request.subjectName ? ` — ${request.subjectName}` : ""}</span>
          {request.parentName && <span><UserIcon size={10} style={{ display: "inline", verticalAlign: -1 }} /> {request.parentName}</span>}
          {request.parentPhone && <span><Phone size={10} style={{ display: "inline", verticalAlign: -1 }} /> {request.parentPhone}</span>}
        </div>
      </div>

      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 9.5, color: "#94A3B8" }}>السعر</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{fmtMoney(request.totalPrice)}</div>
      </div>

      <div style={{ textAlign: "center", flexShrink: 0, minWidth: 90 }}>
        <div style={{ fontSize: 9.5, color: "#94A3B8" }}>تاريخ الطلب</div>
        <div style={{ fontSize: 11, color: "#475569" }}>{fmtDateTime(request.createdAt)}</div>
      </div>

      <Badge label={st.label} bg={st.bg} color={st.color} border={st.border} />

      {request.status === "PENDING" ? (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => onApprove(request)} disabled={approving}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: approving ? "default" : "pointer", fontFamily: "inherit", opacity: approving ? .6 : 1 }}>
            {approving ? <Spinner size={12} color="#fff" /> : <Check size={12} />} قبول
          </button>
          <button onClick={() => onReject(request)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <XCircle size={12} /> رفض
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

function RequestsTab({ courses, onPendingCountChange }) {
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
      setError(err?.response?.data?.message || "فشل تحميل طلبات التسجيل");
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
      alert(err?.response?.data?.message || "فشل قبول الطلب");
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
              options={[{ value: "PENDING", label: "قيد الانتظار" }, { value: "ACCEPTED", label: "مقبول" }, { value: "REJECTED", label: "مرفوض" }]}
              placeholder="كل الحالات" />
          </div>
          <div style={{ width: 200 }}>
            <Select value={courseFilter} onChange={setCourseFilter} options={courseOptions} placeholder="كل الدورات" />
          </div>
        </div>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          <RefreshCw size={13} /> تحديث
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3.5rem" }}><Spinner size={28} /></div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "2.5rem", color: "#DC2626", fontSize: 13 }}>{error}</div>
      ) : requests.length === 0 ? (
        <EmptyState icon={Inbox} title="لا توجد طلبات" subtitle="لا توجد طلبات تسجيل مطابقة للفلاتر الحالية" />
      ) : (
        <>
          <div style={{ fontSize: 11.5, color: "#94A3B8", marginBottom: 10 }}>{totalElements} طلب</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {requests.map((r) => (
              <RequestRow key={r.id} request={r} approving={approvingId === r.id} onApprove={handleApprove} onReject={setRejectTarget} />
            ))}
          </div>

          {!courseFilter && totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 18 }}>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", cursor: page === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === 0 ? .4 : 1 }}>
                <ChevronRight size={14} color="#64748B" />
              </button>
              <span style={{ fontSize: 12, color: "#64748B" }}>{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", cursor: page >= totalPages - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page >= totalPages - 1 ? .4 : 1 }}>
                <ChevronLeft size={14} color="#64748B" />
              </button>
            </div>
          )}
        </>
      )}

      {rejectTarget && (
        <RejectModal request={rejectTarget} onClose={() => setRejectTarget(null)} onRejected={handleRejected} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ATTENDANCE TAB
//  Courses expose sessions embedded in CourseResponseDto.sessions, so
//  the admin picks a course, then picks one of its sessions; the full
//  roster + existing marks are then loaded from the attendance-sheet
//  endpoint inside AttendanceModal.
// ══════════════════════════════════════════════════════════════════
const DAY_LABEL = {
  SATURDAY: "السبت", SUNDAY: "الأحد", MONDAY: "الإثنين", TUESDAY: "الثلاثاء",
  WEDNESDAY: "الأربعاء", THURSDAY: "الخميس", FRIDAY: "الجمعة",
};

function SessionPickerCard({ course, session, onClick }) {
  return (
    <button onClick={onClick}
      style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
      <div style={{ width: 44, textAlign: "center", flexShrink: 0, padding: "6px 4px", borderRadius: 9, background: "#EBF4FE" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: P }}>{DAY_LABEL[session.day] || session.day}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{course.name}</div>
        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
          {course.subjectName} · 🕐 {fmtTime(session.startTime)} – {fmtTime(session.endTime)} · 👨‍🏫 {course.teacherName}
        </div>
      </div>
      <ChevronLeft size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
    </button>
  );
}

function fmtTime(t) { return t ? String(t).slice(0, 5) : "—"; }

function AttendanceModal({ course, session, onClose }) {
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
      setLoadError(err?.response?.data?.message || "فشل تحميل ورقة الحضور");
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
      if (entries.length === 0) { setError("سجّل حضور طالب واحد على الأقل"); setSaving(false); return; }
      await courseApi.markAttendance(session.id, entries);
      setSubmitted(true);
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err?.response?.data?.message || "فشل حفظ الحضور");
    } finally { setSaving(false); }
  };

  const STATUS_BTNS = [
    { key: "PRESENT", Icon: Check,   activeColor: GREEN, activeBg: "#E1F5EE", title: "حاضر" },
    { key: "ABSENT",  Icon: XCircle, activeColor: "#DC2626", activeBg: "#FEE2E2", title: "غائب" },
  ];

  return (
    <ModalWrap onClose={onClose} maxWidth={560}>
      <div style={{ padding: "1.1rem 1.25rem", background: "#EBF4FE", borderBottom: "1.5px solid #B5D4F4", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: P }}>{sheet?.moduleName || course.name}</div>
            <div style={{ fontSize: 11, color: P, opacity: .8, marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span>👨‍🏫 {sheet?.teacherName || course.teacherName}</span>
              <span>🕐 {fmtTime(sheet?.startTime || session.startTime)} – {fmtTime(sheet?.endTime || session.endTime)}</span>
              <span>📅 {sheet?.date ? fmtDate(sheet.date) : (DAY_LABEL[session.day] || session.day)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #B5D4F4", background: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={14} color={P} />
          </button>
        </div>

        {list.length > 0 && (
          <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
            <Badge label={`👥 ${sheet?.totalEnrolled ?? list.length} طالب`} bg="rgba(255,255,255,.6)" color={P} border="#B5D4F4" />
            <Badge label={`✓ ${presentCount} حاضر`} bg="rgba(16,185,129,.15)" color={GREEN} border="#A7F3D0" />
            <Badge label={`✗ ${absentCount} غائب`} bg="rgba(239,68,68,.15)" color="#DC2626" border="#FECACA" />
            <button onClick={() => markAll("PRESENT")} style={{ fontSize: 10, fontWeight: 600, padding: "3px 11px", borderRadius: 20, background: "#E1F5EE", color: GREEN, border: "1px solid #A7F3D0", cursor: "pointer", fontFamily: "inherit" }}>✓ الكل حاضر</button>
            <button onClick={() => markAll("ABSENT")} style={{ fontSize: 10, fontWeight: 600, padding: "3px 11px", borderRadius: 20, background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer", fontFamily: "inherit" }}>✗ الكل غائب</button>
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
            <div>لا يوجد تلاميذ مسجلين في هذه الدورة</div>
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
        <span style={{ fontSize: 11, color: "#94A3B8" }}>{markedCount} / {list.length} تم تسجيلهم</span>
        <button onClick={handleSave} disabled={submitted || saving || list.length === 0}
          style={{ padding: "8px 20px", borderRadius: 9, border: "none", background: submitted ? GREEN : P, color: "#fff", fontSize: 13, fontWeight: 600, cursor: submitted ? "default" : "pointer", fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "background .3s" }}>
          {saving ? <Spinner size={14} color="#fff" /> : submitted ? <><Check size={14} /> تم الحفظ</> : "حفظ الحضور"}
        </button>
      </div>
    </ModalWrap>
  );
}

function AttendanceTab({ courses }) {
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
          <Select value={courseFilter} onChange={setCourseFilter} options={courseOptions} placeholder="كل الدورات" />
        </div>
        <div style={{ fontSize: 11.5, color: "#94A3B8" }}>اختر جلسة لتسجيل الحضور فيها</div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={CalendarClock} title="لا توجد جلسات" subtitle="لا توجد دورات تحتوي جلسات مطابقة للفلتر الحالي" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map(({ course, session }) => (
            <SessionPickerCard key={`${course.id}_${session.id ?? session.day + session.startTime}`} course={course} session={session} onClick={() => setTarget({ course, session })} />
          ))}
        </div>
      )}

      {target && (
        <AttendanceModal course={target.course} session={target.session} onClose={() => setTarget(null)} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  PAYOUTS & INVOICES TAB
//  Uses the school-wide summary endpoints (payouts/summary, revenue)
//  for the dashboard totals, per-course calculate/pay for individual
//  payouts, and per-course invoice list + manual invoice creation for
//  student billing.
// ══════════════════════════════════════════════════════════════════
function PayoutPanel({ course, onClose }) {
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
      setError(err?.response?.data?.message || "فشل حساب نصيب الأستاذ");
    } finally { setLoading(false); }
  };

  const handleMarkPaid = async () => {
    if (!payout) return;
    setPaying(true); setError("");
    try {
      const res = await courseApi.markPayoutPaid(payout.id);
      setPayout(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "فشل تأكيد الدفع");
    } finally { setPaying(false); }
  };

  const st = payout ? (PAYOUT_STATUS[payout.status] || PAYOUT_STATUS.PENDING) : null;

  return (
    <ModalWrap onClose={onClose} maxWidth={440}>
      <ModalHeader title="نصيب الأستاذ" subtitle={course.name} onClose={onClose} />
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 14 }}>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: "#94A3B8" }}>الأستاذ</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{course.teacherName || "—"}</div>
          </div>
          <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: "#94A3B8" }}>نسبة الأستاذ</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
              <Percent size={11} style={{ display: "inline", verticalAlign: -1 }} /> {course.teacherPercentage ?? "—"}
            </div>
          </div>
        </div>

        {!payout ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "1.5rem 0" }}>
            <CircleDollarSign size={32} color="#CBD5E1" />
            <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", margin: 0 }}>احسب نصيب الأستاذ بناءً على إيراد الدورة الحالي ونسبته المحددة</p>
            <ErrorBox msg={error} />
          </div>
        ) : (
          <div style={{ border: `1.5px solid ${st.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: st.bg, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>حالة الدفع</span>
              <Badge label={st.label} bg="rgba(255,255,255,.6)" color={st.color} border={st.border} />
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ color: "#64748B" }}>إجمالي إيراد الدورة</span>
                <span style={{ fontWeight: 700, color: "#0F172A" }}>{fmtMoney(payout.totalCourseRevenue)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ color: "#64748B" }}>النسبة</span>
                <span style={{ fontWeight: 700, color: "#0F172A" }}>{payout.percentage}%</span>
              </div>
              <div style={{ height: 1, background: "#F1F5F9" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ fontWeight: 700, color: "#0F172A" }}>نصيب الأستاذ</span>
                <span style={{ fontWeight: 800, color: P }}>{fmtMoney(payout.payoutAmount)}</span>
              </div>
              {payout.paidAt && (
                <div style={{ fontSize: 10.5, color: "#94A3B8" }}>تم الدفع في {fmtDateTime(payout.paidAt)}</div>
              )}
            </div>
          </div>
        )}
        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label="إغلاق" />
        {!payout ? (
          <BtnPrimary onClick={handleCalculate} loading={loading} icon={CircleDollarSign} label={loading ? "جارٍ الحساب..." : "احسب النصيب"} />
        ) : payout.status !== "PAID" ? (
          <BtnPrimary onClick={handleMarkPaid} loading={paying} icon={Check} label={paying ? "جارٍ التأكيد..." : "تأكيد الدفع"} color={GREEN} />
        ) : (
          <BtnPrimary onClick={handleCalculate} loading={loading} icon={RefreshCw} label={loading ? "..." : "إعادة الحساب"} />
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

function InvoiceRow({ invoice, onPaid }) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const status = invoice.status || "PENDING";
  const st = INVOICE_STATUS[status] || INVOICE_STATUS.PENDING;

  const handlePay = async () => {
    setPaying(true); setError("");
    try {
      await courseApi.markInvoicePaid(invoice.id);
      onPaid(invoice);
    } catch (err) {
      setError(err?.response?.data?.message || "فشل تأكيد الدفع");
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
          <div style={{ fontSize: 9.5, color: "#94A3B8" }}>تاريخ الاستحقاق</div>
          <div style={{ fontSize: 11, color: "#475569" }}>{fmtDate(invoice.dueDate)}</div>
        </div>
      )}
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 9.5, color: "#94A3B8" }}>المبلغ</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{fmtMoney(invoice.amount)}</div>
      </div>
      <Badge label={st.label} bg={st.bg} color={st.color} border={st.border} />
      {status !== "PAID" && (
        <button onClick={handlePay} disabled={paying}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: paying ? "default" : "pointer", fontFamily: "inherit", opacity: paying ? .6 : 1 }}>
          {paying ? <Spinner size={12} color="#fff" /> : <Check size={12} />} تأكيد الدفع
        </button>
      )}
      {error && <div style={{ width: "100%" }}><ErrorBox msg={error} /></div>}
    </div>
  );
}

function ManualInvoiceModal({ courses, onClose, onCreated }) {
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
    if (!enrollmentId) return setError("اختر طالباً مسجلاً");
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
      setError(err?.response?.data?.message || "فشل إنشاء الفاتورة");
    } finally { setSaving(false); }
  };

  return (
    <ModalWrap onClose={onClose} maxWidth={440}>
      <ModalHeader title="إنشاء فاتورة يدوياً" subtitle="أنشئ فاتورة لطالب مسجل في دورة" onClose={onClose} />
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="الدورة" required>
          <Select value={courseId} onChange={setCourseId} options={courseOptions} placeholder="اختر دورة…" />
        </Field>
        <Field label="الطالب" required>
          {loadingReq ? (
            <div style={{ display: "flex", padding: "8px 0" }}><Spinner size={16} /></div>
          ) : (
            <Select value={enrollmentId} onChange={setEnrollmentId} options={requestOptions}
              placeholder={courseId ? (requests.length === 0 ? "لا يوجد طلاب مقبولين في هذه الدورة" : "اختر طالباً…") : "اختر دورة أولاً"} />
          )}
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="المبلغ (دج)">
            <Input type="number" value={amount} onChange={setAmount} placeholder={selectedRequest ? String(selectedRequest.totalPrice) : "افتراضي: سعر التسجيل"} />
          </Field>
          <Field label="تاريخ الاستحقاق">
            <input type="date" style={inp} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
        </div>
        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label="إلغاء" />
        <BtnPrimary onClick={handleSave} loading={saving} icon={ReceiptText} label={saving ? "جارٍ الإنشاء..." : "إنشاء الفاتورة"} />
      </ModalFooter>
    </ModalWrap>
  );
}

function PayoutsTab({ courses, initialCourse, onConsumeInitial }) {
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
      setErrorSummary(err?.response?.data?.message || "فشل تحميل ملخص المدفوعات");
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
      setErrorRevenue(err?.response?.data?.message || "فشل تحميل ملخص الإيرادات");
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
      setErrorInv(err?.response?.data?.message || "فشل تحميل الفواتير");
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
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", margin: 0 }}>ملخص الإيرادات</h3>
        </div>
        {loadingRevenue ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}><Spinner size={24} /></div>
        ) : errorRevenue ? (
          <ErrorBox msg={errorRevenue} />
        ) : revenue && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <StatCard icon={CircleDollarSign} label="الإيراد المتوقع" value={fmtMoney(revenue.totalExpected)} color={P} bg="#EBF4FE" />
            <StatCard icon={Check} label="تم تحصيله" value={fmtMoney(revenue.totalCollected)} color={GREEN} bg="#E1F5EE" />
            <StatCard icon={CalendarClock} label="قيد الانتظار" value={fmtMoney(revenue.totalPending)} color="#92400E" bg="#FEF3C7" />
            <StatCard icon={AlertCircle} label="متأخرة" value={fmtMoney(revenue.totalOverdue)} color="#DC2626" bg="#FEE2E2" />
          </div>
        )}
      </div>

      {/* ── Teacher payouts summary ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Wallet size={15} color={P} />
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", margin: 0 }}>نصيب الأساتذة</h3>
        </div>

        {loadingSummary ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}><Spinner size={24} /></div>
        ) : errorSummary ? (
          <ErrorBox msg={errorSummary} />
        ) : payoutSummary && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <StatCard icon={CalendarClock} label="مستحقة الدفع" value={fmtMoney(payoutSummary.totalPayoutsDue)} color="#92400E" bg="#FEF3C7" />
            <StatCard icon={Check} label="تم دفعها" value={fmtMoney(payoutSummary.totalPayoutsPaid)} color={GREEN} bg="#E1F5EE" />
            <StatCard icon={BookOpen} label="عدد الدورات" value={payoutSummary.courseCount ?? courses.length} color={P} bg="#EBF4FE" />
          </div>
        )}

        {payoutSummary?.payouts?.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {payoutSummary.payouts.map((p) => {
              const st = PAYOUT_STATUS[p.status] || PAYOUT_STATUS.PENDING;
              const relatedCourse = courses.find((c) => c.id === p.courseId) || { id: p.courseId, name: p.courseName, teacherName: p.teacherName, teacherPercentage: p.percentage };
              return (
                <button key={p.id} onClick={() => setPayoutCourse(relatedCourse)}
                  style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Wallet size={16} color={GREEN} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.courseName}</div>
                    <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 1 }}>{p.teacherName || "—"} · {p.percentage ?? "—"}%</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", flexShrink: 0 }}>{fmtMoney(p.payoutAmount)}</div>
                  <Badge label={st.label} bg={st.bg} color={st.color} border={st.border} />
                  <ChevronLeft size={14} color="#CBD5E1" style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState icon={Wallet} title="لا توجد دورات" subtitle="أضف دورة أولاً لحساب نصيب الأستاذ" />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {courses.map((c) => (
              <button key={c.id} onClick={() => setPayoutCourse(c)}
                style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Wallet size={16} color={GREEN} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 1 }}>{c.teacherName || "—"} · {c.teacherPercentage ?? "—"}%</div>
                </div>
                <ChevronLeft size={14} color="#CBD5E1" style={{ flexShrink: 0 }} />
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
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", margin: 0 }}>فواتير الطلاب</h3>
          </div>
          <button onClick={() => setManualInvoiceOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "none", background: P, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <Plus size={13} /> فاتورة يدوية
          </button>
        </div>
        <div style={{ width: 220, marginBottom: 12 }}>
          <Select value={invoiceCourse} onChange={setInvoiceCourse} options={courseOptions} placeholder="اختر دورة لعرض فواتيرها" />
        </div>

        {!invoiceCourse ? (
          <EmptyState icon={ReceiptText} title="اختر دورة" subtitle="اختر دورة من القائمة أعلاه لعرض فواتير الطلاب فيها" />
        ) : loadingInv ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2.5rem" }}><Spinner size={26} /></div>
        ) : errorInv ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#DC2626", fontSize: 13 }}>{errorInv}</div>
        ) : invoices.length === 0 ? (
          <EmptyState icon={ReceiptText} title="لا توجد فواتير" subtitle="لا توجد فواتير لهذه الدورة بعد" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {invoices.map((inv) => (
              <InvoiceRow key={inv.id} invoice={inv} onPaid={() => { loadInvoices(); loadRevenue(); }} />
            ))}
          </div>
        )}
      </div>

      {payoutCourse && (
        <PayoutPanel course={payoutCourse} onClose={() => { setPayoutCourse(null); refreshAll(); }} />
      )}
      {manualInvoiceOpen && (
        <ManualInvoiceModal courses={courses} onClose={() => setManualInvoiceOpen(false)} onCreated={() => { loadInvoices(); loadRevenue(); }} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function SchoolAdminCourses() {
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
      setTeachers((teachersRes.data ?? []).filter((t) => !t.archived));
    } catch (err) {
      setError(err?.response?.data?.message || "فشل تحميل الدورات");
    } finally { setLoading(false); }
  }, []);

  const loadPendingCount = useCallback(async () => {
    try {
      const res = await courseApi.countPending();
      setPendingCount(res.data?.pendingCount ?? 0);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { loadCourses(); loadPendingCount(); }, [loadCourses, loadPendingCount]);

  const tabs = [
    { key: "courses",   label: "الدورات",         icon: BookOpen,     badge: 0 },
    { key: "requests",  label: "طلبات التسجيل",   icon: Inbox,        badge: pendingCount },
    { key: "attendance",label: "الحضور",          icon: GraduationCap,badge: 0 },
    { key: "payouts",   label: "المدفوعات",       icon: Wallet,       badge: 0 },
  ];

  return (
    <div dir="rtl" style={{ padding: "1.25rem 1.5rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column", gap: "1.1rem" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>إدارة الدورات</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: "3px 0 0" }}>
            {loading ? "..." : `${courses.length} دورة نشطة${pendingCount > 0 ? ` · ${pendingCount} طلب بانتظار المراجعة` : ""}`}
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
          />
        )}
        {activeTab === "requests" && (
          <RequestsTab courses={courses} onPendingCountChange={setPendingCount} />
        )}
        {activeTab === "attendance" && (
          <AttendanceTab courses={courses} />
        )}
        {activeTab === "payouts" && (
          <PayoutsTab courses={courses} initialCourse={payoutCourseTarget} onConsumeInitial={() => setPayoutCourseTarget(null)} />
        )}
      </div>
    </div>
  );
}