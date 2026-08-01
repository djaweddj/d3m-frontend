import { useState, useEffect, useCallback } from "react";
import {
  Search, Users, CheckCircle, XCircle, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, Plus, X, Eye, EyeOff, UserPlus,
  BookOpen, CreditCard, ChevronRight, ArrowLeft, GraduationCap,
  Clock, Wallet, Printer, History, ClipboardList, UserMinus,
} from "lucide-react";
import { useSchool } from "../context/SchoolContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../api";

// ── API ───────────────────────────────────────────────────
const schoolApi = {
  getModules:          ()                       => api.get("api/modules"),
  getStudentsByModule: (moduleId)               => api.get(`api/students/by-module/${moduleId}`),
  getAllStudents:      ()                       => api.get("api/students"),
  registerStudent:     (data)                   => api.post("api/students/register", data),
  adminEnroll:         (studentId, moduleId)    =>
    api.post(`api/enrollments/admin-enroll?studentId=${studentId}&moduleId=${moduleId}`),
  removeEnrollment:    (studentId, moduleId)    =>
    api.delete(`api/enrollments?studentId=${studentId}&moduleId=${moduleId}`),
  getStudentEnrollments: (studentId)            => api.get(`api/enrollments/student/${studentId}`),
  getStudentInvoices: (studentId)               => api.get(`api/invoices/student/${studentId}`),
  getSchoolRevenue:    (period)                 => api.get(`api/invoices/school/revenue?period=${period}`),
  markInvoicePaid:     (invoiceId)              => api.post(`api/invoices/${invoiceId}/pay`),
  createInvoiceManually: (payload)              => api.post("api/invoices/create", payload),
};

function todayYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodToKey(period) {
  if (!period) return null;
  return String(period).slice(0, 7);
}

function isCurrentPeriod(invoice) {
  return periodToKey(invoice?.period) === todayYearMonth();
}

function currentMonthInvoice(invoices) {
  if (!Array.isArray(invoices)) return null;
  return invoices.find(isCurrentPeriod) ?? null;
}

// ── Palette ───────────────────────────────────────────────
const LEVEL_COLORS = [
  { color: "#3B82F6", light: "#EFF6FF" },
  { color: "#8B5CF6", light: "#F5F3FF" },
  { color: "#059669", light: "#ECFDF5" },
  { color: "#D97706", light: "#FFFBEB" },
  { color: "#DC2626", light: "#FEF2F2" },
];
const levelColor = (i) => LEVEL_COLORS[i % LEVEL_COLORS.length];
const levelColorByName = (name, levels) => {
  const i = levels.indexOf(name);
  return levelColor(i < 0 ? 0 : i);
};

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function money(n) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("fr-DZ").format(n);
}

function formatDate(d) {
  if (!d) return "—";
  try { return new Intl.DateTimeFormat("fr-DZ", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d)); }
  catch { return String(d); }
}

function formatPeriod(period) {
  const key = periodToKey(period);
  if (!key) return "—";
  const [y, m] = key.split("-");
  if (!y || !m) return key;
  try {
    return new Intl.DateTimeFormat("fr-DZ", { year: "numeric", month: "long" }).format(new Date(Number(y), Number(m) - 1, 1));
  } catch { return key; }
}

// ── Invoice printing ───────────────────────────────────────
// `t` is passed in from the caller since this isn't a React component.
function printInvoice({ invoice, student, schoolName, t }) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) {
    alert(t("students.print.popupBlockedInvoice"));
    return;
  }

  const rows = [
    [t("students.print.rowStudent"), invoice.studentName || student?.fullName || "—"],
    [t("students.print.rowParent"), student?.parentName || "—"],
    [t("students.print.rowModule"), invoice.moduleName ?? "—"],
    [t("students.print.rowPeriod"), formatPeriod(invoice.period)],
    [t("students.print.rowDueDate"), formatDate(invoice.dueDate)],
    [t("students.print.rowPaidDate"), formatDate(invoice.paidAt)],
  ];

  const fallbackSchool = t("students.print.schoolFallback");
  const currency = t("students.print.currency");

  w.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8" />
      <title>${t("students.print.invoiceDocTitle", { name: invoice.studentName ?? student?.fullName ?? "" })}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body {
          font-family: 'Cairo', sans-serif;
          margin: 0;
          padding: 48px;
          color: #0F172A;
          direction: rtl;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 3px solid #3B82F6;
          padding-bottom: 20px;
          margin-bottom: 32px;
        }
        .school-name { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0; }
        .doc-label { font-size: 12px; color: #64748B; margin: 4px 0 0; }
        .badge {
          font-size: 13px; font-weight: 700; padding: 6px 16px; border-radius: 20px;
          background: #ECFDF5; color: #065F46; border: 1.5px solid #A7F3D0;
        }
        table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        td { padding: 12px 4px; font-size: 14px; border-bottom: 1px solid #F1F5F9; }
        td:first-child { color: #64748B; width: 40%; }
        td:last-child { color: #0F172A; font-weight: 600; text-align: left; direction: ltr; text-align: right; }
        .amount-box {
          background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px;
          padding: 20px 24px; display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 32px;
        }
        .amount-label { font-size: 13px; color: #64748B; }
        .amount-value { font-size: 24px; font-weight: 800; color: #0F172A; }
        .footer { font-size: 11px; color: #94A3B8; text-align: center; margin-top: 48px; }
        @media print {
          body { padding: 24px; }
          @page { margin: 16mm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <p class="school-name">${schoolName || fallbackSchool}</p>
          <p class="doc-label">${t("students.print.invoiceDocLabel")}</p>
        </div>
        <span class="badge">${t("students.print.paidBadge")}</span>
      </div>
      <table>
        ${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}
      </table>
      <div class="amount-box">
        <span class="amount-label">${t("students.print.amountPaidLabel")}</span>
        <span class="amount-value">${money(invoice.amount)} ${currency}</span>
      </div>
      <p class="footer">${t("students.print.invoiceIssuedNote", { date: formatDate(new Date()) })}</p>
    </body>
    </html>
  `);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 350);
}

// ── Attendance sheet printing ──────────────────────────────
function printAttendanceSheet({ module, students, schoolName, sessionCount = 8, t }) {
  const w = window.open("", "_blank", "width=1000,height=750");
  if (!w) {
    alert(t("students.print.popupBlockedAttendance"));
    return;
  }

  const dateHeaderCells = Array.from({ length: sessionCount }, () => `<th class="date-col"></th>`).join("");

  const rows = students.map((s, i) => `
    <tr>
      <td class="idx">${i + 1}</td>
      <td class="name">${s.fullName ?? "—"}</td>
      ${Array.from({ length: sessionCount }, () => `<td class="mark"></td>`).join("")}
    </tr>
  `).join("");

  const fallbackSchool = t("students.print.schoolFallback");

  w.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8" />
      <title>${t("students.print.attendanceDocTitle", { name: module.subjectName ?? module.name ?? "" })}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Cairo', sans-serif; margin: 0; padding: 32px; color: #0F172A; direction: rtl; }
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #3B82F6; padding-bottom: 16px; margin-bottom: 18px; }
        .school-name { font-size: 20px; font-weight: 800; margin: 0; }
        .doc-label { font-size: 12px; color: #64748B; margin: 4px 0 0; }
        .meta { display: flex; gap: 22px; margin-bottom: 16px; font-size: 12px; }
        .meta span { color: #64748B; }
        .meta strong { color: #0F172A; margin-right: 4px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #E2E8F0; text-align: center; }
        th { background: #F8FAFC; padding: 8px 2px; font-weight: 700; color: #475569; font-size: 10px; }
        th.name-col { text-align: right; padding-right: 10px; }
        td.idx { width: 26px; color: #94A3B8; font-size: 10px; }
        td.name { text-align: right; padding: 7px 10px; font-weight: 600; font-size: 12px; white-space: nowrap; }
        td.mark { height: 28px; width: 32px; }
        .footer { font-size: 10px; color: #94A3B8; text-align: center; margin-top: 20px; }
        @media print { body { padding: 18px; } @page { margin: 12mm; size: landscape; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <p class="school-name">${schoolName || fallbackSchool}</p>
          <p class="doc-label">${t("students.print.attendanceDocLabel")}</p>
        </div>
      </div>
      <div class="meta">
        <div><span>${t("students.print.metaModule")}</span><strong>${module.subjectName ?? module.name ?? "—"}</strong></div>
        <div><span>${t("students.print.metaTeacher")}</span><strong>${module.teacherName ?? "—"}</strong></div>
        <div><span>${t("students.print.metaLevel")}</span><strong>${module.level ?? "—"}</strong></div>
        <div><span>${t("students.print.metaStudentCount")}</span><strong>${students.length}</strong></div>
      </div>
      <table>
        <thead><tr><th></th><th class="name-col">${t("students.print.nameColumn")}</th>${dateHeaderCells}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="footer">${t("students.print.attendanceIssuedNote", { date: formatDate(new Date()) })}</p>
    </body>
    </html>
  `);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 350);
}

// ── Status badge (shared by drawer + invoice panel) ───────
function StatusBadge({ status, size = 10 }) {
  const { t } = useLanguage();
  const STATUS_MAP = {
    PAID:      { bg: "#ECFDF5", color: "#065F46", label: t("students.status.PAID"),      icon: CheckCircle },
    PENDING:   { bg: "#FEF9C3", color: "#854D0E", label: t("students.status.PENDING"),   icon: Clock },
    OVERDUE:   { bg: "#FEF2F2", color: "#991B1B", label: t("students.status.OVERDUE"),   icon: AlertCircle },
    CANCELLED: { bg: "#F1F5F9", color: "#64748B", label: t("students.status.CANCELLED"), icon: XCircle },
  };
  const s = STATUS_MAP[status] ?? STATUS_MAP.PENDING;
  const Icon = s.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: size + 1, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      <Icon size={size} />{s.label}
    </span>
  );
}

function PrintButton({ onClick, compact = false }) {
  const { t } = useLanguage();
  const title = t("students.buttons.printInvoiceTitle");
  if (compact) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        title={title}
        style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.borderColor = "#3B82F6"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
      >
        <Printer size={12} color="#3B82F6" />
      </button>
    );
  }
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 7, border: "1.5px solid #3B82F6", background: "#EFF6FF", color: "#3B82F6", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
      <Printer size={12} />{t("students.buttons.printLabel")}
    </button>
  );
}

function AttendanceSheetButton({ onClick, color, light }) {
  const { t } = useLanguage();
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          e.preventDefault();
          onClick();
        }
      }}
      title={t("students.buttons.printAttendanceTitle")}
      style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
      onMouseEnter={(e) => { e.currentTarget.style.background = light; e.currentTarget.style.borderColor = color; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
    >
      <ClipboardList size={14} color={color} />
    </span>
  );
}

function RemoveEnrollButton({ onClick, compact = false, busy = false, label }) {
  const { t } = useLanguage();
  const resolvedLabel = label ?? t("students.buttons.removeLabel");
  if (compact) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); if (!busy) onClick(); }}
        disabled={busy}
        title={t("students.buttons.removeFromModuleTitle")}
        style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: busy ? "not-allowed" : "pointer", flexShrink: 0, opacity: busy ? .55 : 1 }}
        onMouseEnter={(e) => { if (!busy) { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.borderColor = "#DC2626"; } }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
      >
        <UserMinus size={12} color="#DC2626" />
      </button>
    );
  }
  return (
    <button onClick={onClick} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 7, border: "1.5px solid #DC2626", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: busy ? .6 : 1 }}>
      <UserMinus size={12} />{busy ? t("students.buttons.removing") : resolvedLabel}
    </button>
  );
}

// ── Tiny helpers ──────────────────────────────────────────
function LoadingBlock() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2.5px solid #185FA5", borderTopColor: "transparent", animation: "spin .8s linear infinite" }} />
    </div>
  );
}

function ErrorBlock({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "2rem" }}>
      <AlertCircle size={32} color="#E2A84B" />
      <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1.5px solid #185FA5", background: "#EBF4FE", color: "#185FA5", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          <RefreshCw size={13} /> {t("students.retry")}
        </button>
      )}
    </div>
  );
}

function Toast({ message, tone = "success", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  const bg = tone === "error" ? "#DC2626" : "#059669";
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: bg, color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, zIndex: 3000, display: "flex", alignItems: "center", gap: 8, boxShadow: `0 8px 24px ${bg}55`, fontFamily: "'Cairo',sans-serif", whiteSpace: "nowrap" }}>
      {tone === "error" ? <AlertCircle size={15} /> : <CheckCircle size={15} />} {message}
    </div>
  );
}

const inp = { width: "100%", padding: "10px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontSize: 13, fontFamily: "inherit", color: "#0F172A", background: "#fff", outline: "none", boxSizing: "border-box" };
const lbl = { fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5, display: "block" };
const fw  = { display: "flex", flexDirection: "column", gap: 4 };

// ── Add Student Modal (3-step: register + enroll) ─────────
function AddStudentModal({ modules, allLevels, onClose, onSuccess, onError }) {
  const { t } = useLanguage();
  const STEPS = t("students.addModal.steps");
  const [step, setStep]               = useState(0);
  const [showPw, setShowPw]           = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", level: allLevels[0] ?? "",
    parentName: "", parentPhone: "", birthDate: "", moduleId: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const modulesForLevel = modules.filter((m) => m.level === form.level);
  const stepValid = [
    form.fullName.trim() && form.email.trim() && form.password.length >= 6,
    !!form.birthDate,
    !!form.moduleId,
  ];

  const handleSubmit = async () => {
    setSubmitting(true); setSubmitError(null);
    try {
      const regRes = await schoolApi.registerStudent({
        fullName: form.fullName, email: form.email, password: form.password,
        level: form.level, parentName: form.parentName, parentPhone: form.parentPhone,
        birthDate: form.birthDate,
      });
      const studentId = regRes.data?.id;
      if (!studentId) throw new Error(t("students.addModal.missingStudentId"));

      await schoolApi.adminEnroll(studentId, form.moduleId);
      onSuccess(t("students.addModal.successMessage"));
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err.message || t("students.addModal.genericError"));
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(15,23,42,.18)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}><UserPlus size={16} color="#3B82F6" /></div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("students.addModal.heading")}</p>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{STEPS[step]}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={14} color="#64748B" /></button>
        </div>
        {/* Step dots */}
        <div style={{ padding: "12px 20px", display: "flex", alignItems: "center" }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: i < step ? "#3B82F6" : i === step ? "#EFF6FF" : "#F1F5F9", color: i < step ? "#fff" : i === step ? "#3B82F6" : "#94A3B8", border: i === step ? "1.5px solid #3B82F6" : "1.5px solid transparent" }}>
                  {i < step ? <CheckCircle size={13} /> : i + 1}
                </div>
                <span style={{ fontSize: 9, color: i === step ? "#3B82F6" : "#94A3B8", fontWeight: i === step ? 700 : 400, whiteSpace: "nowrap" }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1.5, background: i < step ? "#3B82F6" : "#E2E8F0", margin: "0 6px", marginBottom: 14 }} />}
            </div>
          ))}
        </div>
        {/* Body */}
        <div style={{ padding: "4px 20px 16px", overflowY: "auto", flex: 1 }}>
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={fw}><label style={lbl}>{t("students.addModal.fullName")}</label><input style={inp} placeholder={t("students.addModal.fullNamePlaceholder")} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></div>
              <div style={fw}><label style={lbl}>{t("students.addModal.email")}</label><input style={{ ...inp, direction: "ltr" }} type="email" placeholder="student@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div style={fw}>
                <label style={lbl}>{t("students.addModal.password")}</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...inp, direction: "ltr", paddingLeft: 38 }} type={showPw ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)} />
                  <button onClick={() => setShowPw((v) => !v)} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex" }}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
              </div>
              <div style={fw}>
                <label style={lbl}>{t("students.addModal.level")}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {allLevels.map((lvl, i) => { const c = levelColor(i); const active = form.level === lvl; return (
                    <button key={lvl} onClick={() => { set("level", lvl); set("moduleId", ""); }} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: active ? `1.5px solid ${c.color}` : "1.5px solid #E2E8F0", background: active ? c.color : "#fff", color: active ? "#fff" : "#64748B" }}>{lvl}</button>
                  ); })}
                </div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={fw}><label style={lbl}>{t("students.addModal.birthDate")}</label><input style={{ ...inp, direction: "ltr" }} type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} /></div>
              <div style={fw}><label style={lbl}>{t("students.addModal.parentName")}</label><input style={inp} placeholder={t("students.addModal.parentNamePlaceholder")} value={form.parentName} onChange={(e) => set("parentName", e.target.value)} /></div>
              <div style={fw}><label style={lbl}>{t("students.addModal.parentPhone")}</label><input style={{ ...inp, direction: "ltr" }} type="tel" placeholder="0555 000 000" value={form.parentPhone} onChange={(e) => set("parentPhone", e.target.value)} /></div>
            </div>
          )}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 6px" }}>{t("students.addModal.chooseModuleFor", { level: form.level })}</p>
              {modulesForLevel.length === 0
                ? <div style={{ textAlign: "center", color: "#94A3B8", padding: "2rem", fontSize: 13 }}>{t("students.addModal.noModulesForLevel")}</div>
                : modulesForLevel.map((m, i) => { const c = levelColor(i); const active = String(form.moduleId) === String(m.id); return (
                  <button key={m.id} onClick={() => set("moduleId", m.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: active ? `1.5px solid ${c.color}` : "1.5px solid #E2E8F0", background: active ? c.light : "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "right", width: "100%" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: active ? c.color : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: active ? "#fff" : "#94A3B8", flexShrink: 0 }}>{m.level?.slice(0, 3) ?? "—"}</div>
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: active ? c.color : "#0F172A", margin: 0 }}>{m.subjectName ?? m.name}</p>
                      <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, marginTop: 2 }}>👨‍🏫 {m.teacherName ?? "—"} · {money(m.monthlyprice ?? m.monthlyPrice)} {t("students.addModal.perMonth")}</p>
                    </div>
                    {active && <CheckCircle size={16} color={c.color} />}
                  </button>
                ); })
              }
            </div>
          )}
          {submitError && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "10px 12px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <AlertCircle size={14} color="#DC2626" /><span style={{ fontSize: 12, color: "#DC2626" }}>{submitError}</span>
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10, justifyContent: "space-between" }}>
          <button onClick={() => step > 0 ? setStep((s) => s - 1) : onClose()} style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {step === 0 ? t("students.addModal.cancel") : t("students.addModal.back")}
          </button>
          {step < 2
            ? <button onClick={() => setStep((s) => s + 1)} disabled={!stepValid[step]} style={{ padding: "9px 22px", borderRadius: 9, border: "none", background: stepValid[step] ? "#3B82F6" : "#E2E8F0", color: stepValid[step] ? "#fff" : "#94A3B8", fontSize: 13, fontWeight: 700, cursor: stepValid[step] ? "pointer" : "not-allowed", fontFamily: "inherit" }}>{t("students.addModal.next")}</button>
            : <button onClick={handleSubmit} disabled={submitting || !stepValid[2]} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 22px", borderRadius: 9, border: "none", background: (!submitting && stepValid[2]) ? "#059669" : "#E2E8F0", color: (!submitting && stepValid[2]) ? "#fff" : "#94A3B8", fontSize: 13, fontWeight: 700, cursor: (!submitting && stepValid[2]) ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
              {submitting ? <><div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid #fff", borderTopColor: "transparent", animation: "spin .8s linear infinite" }} />{t("students.addModal.submitting")}</> : <><UserPlus size={14} />{t("students.addModal.submit")}</>}
            </button>
          }
        </div>
      </div>
    </div>
  );
}

// ── Enroll Existing Student Modal ─────────────────────────
function EnrollExistingModal({ student, modules, allLevels, enrolledModuleIds, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [selectedModule, setSelectedModule] = useState(null);
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState(null);
  const allLabel = t("students.enrollModal.all");
  const [levelFilter, setLevelFilter]       = useState(allLabel);

  const available = modules.filter((m) => !enrolledModuleIds.includes(m.id));
  const filtered  = levelFilter === allLabel ? available : available.filter((m) => m.level === levelFilter);

  const handleEnroll = async () => {
    if (!selectedModule) return;
    setSubmitting(true); setError(null);
    try {
      await schoolApi.adminEnroll(student.id, selectedModule);
      onSuccess(t("students.enrollModal.successMessage", { name: student.fullName }));
    } catch (err) {
      setError(err?.response?.data?.message || t("students.enrollModal.genericError"));
    } finally { setSubmitting(false); }
  };

  const lvlTabs = [allLabel, ...allLevels];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", backdropFilter: "blur(4px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(15,23,42,.18)", display: "flex", flexDirection: "column", maxHeight: "85vh" }}>
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center" }}><BookOpen size={16} color="#8B5CF6" /></div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("students.enrollModal.heading")}</p>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{student.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={14} color="#64748B" /></button>
        </div>
        {/* Level filter tabs */}
        <div style={{ padding: "10px 16px", display: "flex", gap: 6, flexWrap: "wrap", borderBottom: "1px solid #F1F5F9" }}>
          {lvlTabs.map((lvl, i) => {
            const c      = i === 0 ? { color: "#475569", light: "#F1F5F9" } : levelColor(i - 1);
            const active = levelFilter === lvl;
            return <button key={lvl} onClick={() => setLevelFilter(lvl)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: active ? `1.5px solid ${c.color}` : "1.5px solid #E2E8F0", background: active ? c.color : "#fff", color: active ? "#fff" : "#64748B" }}>{lvl}</button>;
          })}
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "10px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0
            ? <div style={{ textAlign: "center", color: "#94A3B8", padding: "2rem", fontSize: 13 }}>{t("students.enrollModal.noAvailableModules")}</div>
            : filtered.map((m) => {
              const c      = levelColorByName(m.level, allLevels);
              const active = selectedModule === m.id;
              return (
                <button key={m.id} onClick={() => setSelectedModule(m.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 10, border: active ? `1.5px solid ${c.color}` : "1.5px solid #E2E8F0", background: active ? c.light : "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "right", width: "100%" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: active ? c.color : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: active ? "#fff" : "#94A3B8", flexShrink: 0 }}>{m.level?.slice(0, 3) ?? "—"}</div>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: active ? c.color : "#0F172A", margin: 0 }}>{m.subjectName ?? m.name}</p>
                    <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, marginTop: 1 }}>👨‍🏫 {m.teacherName ?? "—"} · {m.level}</p>
                  </div>
                  {active && <CheckCircle size={15} color={c.color} />}
                </button>
              );
            })
          }
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <AlertCircle size={14} color="#DC2626" /><span style={{ fontSize: 12, color: "#DC2626" }}>{error}</span>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10, justifyContent: "space-between" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{t("students.enrollModal.cancel")}</button>
          <button onClick={handleEnroll} disabled={!selectedModule || submitting} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 22px", borderRadius: 9, border: "none", background: selectedModule && !submitting ? "#8B5CF6" : "#E2E8F0", color: selectedModule && !submitting ? "#fff" : "#94A3B8", fontSize: 13, fontWeight: 700, cursor: selectedModule && !submitting ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            {submitting ? <><div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid #fff", borderTopColor: "transparent", animation: "spin .8s linear infinite" }} />{t("students.enrollModal.submitting")}</> : <><BookOpen size={14} />{t("students.enrollModal.submit")}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Invoice Manually Modal ─────────────────────────
function CreateInvoiceModal({ student, enrollments, schoolId, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [enrollmentId, setEnrollmentId] = useState(enrollments[0]?.id ?? "");
  const [period, setPeriod]             = useState(todayYearMonth());
  const [dueDate, setDueDate]           = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount]             = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState(null);

  const handleSubmit = async () => {
    if (!enrollmentId || !amount) return;
    setSubmitting(true); setError(null);
    try {
      await schoolApi.createInvoiceManually({
        enrollmentId: Number(enrollmentId),
        studentId: student.id,
        dueDate,
        period,
        totalAmount: Number(amount),
      });
      onSuccess(t("students.invoiceModal.successMessage"));
    } catch (err) {
      setError(err?.response?.data?.message || t("students.invoiceModal.genericError"));
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", backdropFilter: "blur(4px)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, boxShadow: "0 24px 60px rgba(15,23,42,.18)" }}>
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}><CreditCard size={16} color="#D97706" /></div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("students.invoiceModal.heading")}</p>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{student.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={14} color="#64748B" /></button>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={fw}>
            <label style={lbl}>{t("students.invoiceModal.moduleLabel")}</label>
            <select style={{ ...inp, appearance: "auto" }} value={enrollmentId} onChange={(e) => setEnrollmentId(e.target.value)}>
              {enrollments.length === 0 && <option value="">{t("students.invoiceModal.noEnrolledModules")}</option>}
              {enrollments.map((e) => <option key={e.id} value={e.id}>{e.subjectName ?? e.moduleName}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={fw}><label style={lbl}>{t("students.invoiceModal.period")}</label><input style={{ ...inp, direction: "ltr" }} type="month" value={period} onChange={(e) => setPeriod(e.target.value)} /></div>
            <div style={fw}><label style={lbl}>{t("students.invoiceModal.dueDate")}</label><input style={{ ...inp, direction: "ltr" }} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          </div>
          <div style={fw}>
            <label style={lbl}>{t("students.invoiceModal.amount")}</label>
            <input style={{ ...inp, direction: "ltr" }} type="number" min="0" placeholder="3000" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <AlertCircle size={14} color="#DC2626" /><span style={{ fontSize: 12, color: "#DC2626" }}>{error}</span>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10, justifyContent: "space-between" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{t("students.invoiceModal.cancel")}</button>
          <button onClick={handleSubmit} disabled={submitting || !enrollmentId || !amount} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 22px", borderRadius: 9, border: "none", background: (!submitting && enrollmentId && amount) ? "#D97706" : "#E2E8F0", color: (!submitting && enrollmentId && amount) ? "#fff" : "#94A3B8", fontSize: 13, fontWeight: 700, cursor: (!submitting && enrollmentId && amount) ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            {submitting ? <><div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid #fff", borderTopColor: "transparent", animation: "spin .8s linear infinite" }} />{t("students.invoiceModal.submitting")}</> : <><CreditCard size={14} />{t("students.invoiceModal.submit")}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invoice history row (used inside the drawer's collapsible list) ──
function InvoiceHistoryRow({ invoice, student, schoolName, onPay, payingId, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 9, background: "#fff", border: "1px solid #F1F5F9" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: "#0F172A", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{invoice.moduleName ?? t("students.print.rowModule")}</span>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>{formatPeriod(invoice.period)}{invoice.amount != null ? ` · ${money(invoice.amount)} ${t("students.print.currency")}` : ""}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <StatusBadge status={invoice.status} size={9} />
        {invoice.status !== "PAID" && invoice.id && (
          <button onClick={() => onPay(invoice)} disabled={payingId === invoice.id} style={{ padding: "4px 10px", borderRadius: 7, border: "none", background: "#059669", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: payingId === invoice.id ? .6 : 1 }}>
            {payingId === invoice.id ? "..." : t("students.drawer.registerPayment")}
          </button>
        )}
        {invoice.status === "PAID" && (
          <PrintButton compact onClick={() => printInvoice({ invoice, student, schoolName, t })} />
        )}
      </div>
    </div>
  );
}

// ── Student Detail Drawer ─────────────────────────────────
function StudentDrawer({ student, modules, allLevels, schoolId, schoolName, onClose, onSuccess, onError }) {
  const { t } = useLanguage();
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnr, setLoadingEnr]   = useState(true);
  const [errEnr, setErrEnr]           = useState(null);
  const [showEnroll, setShowEnroll]   = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [payingId, setPayingId]       = useState(null);

  const [invoices, setInvoices]       = useState([]);
  const [loadingInv, setLoadingInv]   = useState(true);
  const [errInv, setErrInv]           = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [removingEnrId, setRemovingEnrId] = useState(null);
  

  const c = levelColorByName(student.level, allLevels);

  const loadEnrollments = useCallback(() => {
    setLoadingEnr(true);
    schoolApi.getStudentEnrollments(student.id)
      .then((r) => setEnrollments(r.data?.content ?? r.data ?? []))
      .catch(() => setErrEnr(t("students.drawer.loadModulesError")))
      .finally(() => setLoadingEnr(false));
  }, [student.id, t]);

  const loadInvoices = useCallback(() => {
    setLoadingInv(true); setErrInv(null);
    schoolApi.getStudentInvoices(student.id)
      .then((r) => setInvoices(r.data?.content ?? r.data ?? []))
      .catch(() => setErrInv(t("students.drawer.loadInvoicesError")))
      .finally(() => setLoadingInv(false));
  }, [student.id, t]);

  useEffect(() => { loadEnrollments(); }, [loadEnrollments]);
  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const enrolledModuleIds = enrollments.map((e) => e.moduleId).filter(Boolean);

  const currentInvoice = currentMonthInvoice(invoices);
  const pastInvoices    = invoices.filter((inv) => inv.id !== currentInvoice?.id);

  const handlePay = async (invoice) => {
    setPayingId(invoice.id);
    try {
      await schoolApi.markInvoicePaid(invoice.id);
      onSuccess(t("students.drawer.paymentSuccess"));
      const r = await schoolApi.getStudentInvoices(student.id);
      const fresh = r.data?.content ?? r.data ?? [];
      setInvoices(fresh);
      const paidInvoice = fresh.find((i) => i.id === invoice.id) ?? { ...invoice, status: "PAID", paidAt: new Date().toISOString() };
      setTimeout(() => {
        printInvoice({ invoice: paidInvoice, student, schoolName, t });
      }, 500);
    } catch (err) {
      onError(err?.response?.data?.message || t("students.drawer.paymentError"));
    } finally { setPayingId(null); }
  };

  const handleUnenroll = async (enr) => {
    const moduleLabel = enr.subjectName ?? enr.moduleName ?? t("students.drawer.defaultModuleLabel");
    if (!window.confirm(t("students.drawer.confirmUnenroll", { name: student.fullName, module: moduleLabel }))) return;
    setRemovingEnrId(enr.id);
    try {
      await schoolApi.removeEnrollment(student.id, enr.moduleId);
      loadEnrollments();
      onSuccess(t("students.drawer.unenrollSuccess", { name: student.fullName, module: moduleLabel }));
    } catch (err) {
      onError(err?.response?.data?.message || t("students.drawer.unenrollError"));
    } finally { setRemovingEnrId(null); }
  };

  return (
    <>
      {showEnroll && (
        <EnrollExistingModal
          student={student}
          modules={modules}
          allLevels={allLevels}
          enrolledModuleIds={enrolledModuleIds}
          onClose={() => setShowEnroll(false)}
          onSuccess={(msg) => { setShowEnroll(false); loadEnrollments(); onSuccess(msg); }}
        />
      )}
      {showInvoice && (
        <CreateInvoiceModal
          student={student}
          enrollments={enrollments}
          schoolId={schoolId}
          onClose={() => setShowInvoice(false)}
          onSuccess={(msg) => { setShowInvoice(false); loadInvoices(); onSuccess(msg); }}
        />
      )}

      <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.35)", backdropFilter: "blur(3px)", zIndex: 900, display: "flex", justifyContent: "flex-start" }} onClick={onClose}>
        <div style={{ background: "#fff", width: "100%", maxWidth: 420, height: "100%", overflowY: "auto", boxShadow: "4px 0 40px rgba(15,23,42,.15)", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>

          {/* Drawer header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ArrowLeft size={15} color="#64748B" /></button>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("students.drawer.title")}</p>
          </div>

          {/* Student card */}
          <div style={{ padding: "20px", background: c.light, borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials(student.fullName)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>{student.fullName}</p>
                <p style={{ fontSize: 12, color: "#64748B", margin: "3px 0 0", direction: "ltr", textAlign: "right" }}>{student.email || "—"}</p>
                <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: c.color, color: "#fff" }}>{student.level || "—"}</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
              {[{ label: t("students.drawer.parent"), value: student.parentName || "—" }, { label: t("students.drawer.phone"), value: student.parentPhone || "—" }].map(({ label, value }) => (
                <div key={label} style={{ background: "#fff", borderRadius: 9, padding: "8px 12px", border: "1px solid #E2E8F0" }}>
                  <p style={{ fontSize: 10, color: "#94A3B8", margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", margin: "2px 0 0" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice / billing */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", margin: 0, display: "flex", alignItems: "center", gap: 6 }}><Wallet size={13} />{t("students.drawer.currentMonthInvoice")}</p>
              <button onClick={() => setShowInvoice(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, border: "1.5px solid #D97706", background: "#FFFBEB", color: "#D97706", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                <Plus size={12} />{t("students.drawer.manualInvoice")}
              </button>
            </div>

            {loadingInv ? <LoadingBlock /> : errInv
              ? <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center" }}>{errInv}</p>
              : !currentInvoice
                ? <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>{t("students.drawer.noInvoiceThisMonth")}</p>
                : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 9, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 12, color: "#0F172A", fontWeight: 600 }}>{currentInvoice.moduleName ?? t("students.print.rowModule")}</span>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>{formatPeriod(currentInvoice.period)}{currentInvoice.amount != null ? ` · ${money(currentInvoice.amount)} ${t("students.print.currency")}` : ""}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <StatusBadge status={currentInvoice.status} />
                      {currentInvoice.status !== "PAID" && currentInvoice.id && (
                        <button onClick={() => handlePay(currentInvoice)} disabled={payingId === currentInvoice.id} style={{ padding: "5px 12px", borderRadius: 7, border: "none", background: "#059669", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: payingId === currentInvoice.id ? .6 : 1 }}>
                          {payingId === currentInvoice.id ? "..." : t("students.drawer.registerPayment")}
                        </button>
                      )}
                      {currentInvoice.status === "PAID" && (
                        <PrintButton onClick={() => printInvoice({ invoice: currentInvoice, student, schoolName, t })} />
                      )}
                    </div>
                  </div>
                )
            }

            {/* Collapsible full history */}
            {!loadingInv && !errInv && pastInvoices.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <button onClick={() => setShowHistory((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, color: "#64748B", fontSize: 11, fontWeight: 700 }}>
                  <History size={12} />
                  {t("students.drawer.invoiceHistory", { count: pastInvoices.length })}
                  {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {showHistory && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {pastInvoices.map((inv) => (
                      <InvoiceHistoryRow key={inv.id} invoice={inv} student={student} schoolName={schoolName} onPay={handlePay} payingId={payingId} t={t} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enrolled modules */}
          <div style={{ padding: "14px 20px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", margin: 0, display: "flex", alignItems: "center", gap: 6 }}><GraduationCap size={13} />{t("students.drawer.enrolledModules")}</p>
              <button onClick={() => setShowEnroll(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, border: "1.5px solid #8B5CF6", background: "#F5F3FF", color: "#8B5CF6", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                <Plus size={12} />{t("students.drawer.addModule")}
              </button>
            </div>

            {loadingEnr ? <LoadingBlock /> : errEnr
              ? <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center" }}>{errEnr}</p>
              : enrollments.length === 0
                ? <div style={{ textAlign: "center", padding: "1.5rem", color: "#94A3B8" }}><BookOpen size={28} style={{ opacity: .4 }} /><p style={{ fontSize: 13, marginTop: 8 }}>{t("students.drawer.notEnrolledYet")}</p></div>
                : enrollments.map((enr) => {
                  const mc = levelColorByName(student.level, allLevels);
                  return (
                    <div key={enr.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#fff", marginBottom: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: mc.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: mc.color, flexShrink: 0 }}>
                        {(student.level ?? "—").slice(0, 3)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>{enr.subjectName ?? enr.moduleName ?? "—"}</p>
                        <p style={{ fontSize: 11, color: "#94A3B8", margin: "2px 0 0" }}>👨‍🏫 {enr.teacherName ?? "—"} · {money(enr.monthlyPrice)} {t("students.drawer.perMonth")}</p>
                      </div>
                      <RemoveEnrollButton compact busy={removingEnrId === enr.id} onClick={() => handleUnenroll(enr)} />
                    </div>
                  );
                })
            }
          </div>
        </div>
      </div>
    </>
  );
}

// ── Level tab ─────────────────────────────────────────────
function LevelTab({ levelKey, count, color, light, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: active ? `1.5px solid ${color}` : "1.5px solid #E2E8F0", background: active ? color : "#fff", color: active ? "#fff" : "#64748B", boxShadow: active ? `0 4px 14px ${color}40` : "none", transition: "all .15s", fontFamily: "inherit" }}>
      {levelKey}
      <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 20, background: active ? "rgba(255,255,255,.25)" : light, color: active ? "#fff" : color }}>{count}</span>
    </button>
  );
}

// ── Module accordion ──────────────────────────────────────
function ModuleSection({ module, students, invoiceByStudentId, color, light, schoolName, onStudentClick, onRemoveStudent }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const paid   = students.filter((s) => currentMonthInvoice(invoiceByStudentId[s.id])?.status === "PAID").length;
  const unpaid = students.length - paid;

  const handleRemove = async (s) => {
    const moduleLabel = module.subjectName ?? module.name ?? t("students.drawer.defaultModuleLabel");
    if (!window.confirm(t("students.drawer.confirmUnenroll", { name: s.fullName, module: moduleLabel }))) return;
    setRemovingId(s.id);
    try {
      await onRemoveStudent(s.id, module.id, s.fullName, moduleLabel);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${color}28`, borderRight: `3px solid ${color}`, marginBottom: 10 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "right" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: light, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{module.level?.slice(0, 3) ?? "—"}</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0 }}>{module.subjectName ?? module.name}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <span style={{ fontSize: 11, color: "#64748B" }}>👨‍🏫 {module.teacherName ?? "—"}</span>
              <span style={{ fontSize: 10, color: "#94A3B8" }}>·</span>
              <span style={{ fontSize: 11, color: "#64748B" }}><Users size={10} style={{ verticalAlign: "middle" }} /> {students.length} {t("students.moduleSection.studentsCount")}</span>
              {unpaid > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>{t("students.moduleSection.unpaidBadge", { count: unpaid })}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: light, color }}>{module.level}</span>
          <AttendanceSheetButton color={color} light={light} onClick={() => printAttendanceSheet({ module, students, schoolName, t })} />
          {open ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
        </div>
      </button>
      {open && (
        <div style={{ background: "#fff", borderTop: "1px solid #F8FAFC" }}>
          {students.length === 0
            ? <div style={{ padding: "1.5rem", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>{t("students.moduleSection.noStudents")}</div>
            : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "28px 36px 1fr 140px 100px 80px 30px 30px", gap: 8, padding: "8px 16px", background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                  {["", "", t("students.moduleSection.headerName"), t("students.moduleSection.headerEmail"), t("students.moduleSection.headerParent"), t("students.moduleSection.headerPayment"), "", ""].map((h, i) => <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>{h}</span>)}
                </div>
                {students.map((s, i) => {
                  const inv = currentMonthInvoice(invoiceByStudentId[s.id]);
                  return (
                    <div key={s.id} onClick={() => onStudentClick(s)}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#FAFBFF"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      style={{ display: "grid", gridTemplateColumns: "28px 36px 1fr 140px 100px 80px 30px 30px", gap: 8, padding: "10px 16px", alignItems: "center", borderBottom: i < students.length - 1 ? "1px solid #F8FAFC" : "none", cursor: "pointer" }}>
                      <span style={{ fontSize: 11, color: "#CBD5E1", fontFamily: "monospace", textAlign: "center" }}>{i + 1}</span>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{initials(s.fullName)}</div>
                      <div><p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>{s.fullName}</p>{s.level && <p style={{ fontSize: 10, color: "#94A3B8", margin: 0, marginTop: 1 }}>{s.level}</p>}</div>
                      <span style={{ fontSize: 11, color: "#64748B", direction: "ltr", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.email || "—"}</span>
                      <span style={{ fontSize: 11, color: "#64748B" }}>{s.parentPhone || "—"}</span>
                      {inv ? <StatusBadge status={inv.status} /> : <span style={{ fontSize: 10, color: "#CBD5E1" }}>—</span>}
                      {inv?.status === "PAID"
                        ? <PrintButton compact onClick={() => printInvoice({ invoice: inv, student: s, schoolName, t })} />
                        : <span />}
                      <RemoveEnrollButton compact busy={removingId === s.id} onClick={() => handleRemove(s)} />
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9", fontSize: 11, color: "#94A3B8" }}>
                  <span>{t("students.moduleSection.paidSummary")}: <strong style={{ color: "#0F172A" }}>{paid}</strong></span>
                  <span>{t("students.moduleSection.unpaidSummary")}: <strong style={{ color: "#BA7517" }}>{unpaid}</strong></span>
                </div>
              </>
            )
          }
        </div>
      )}
    </div>
  );
}

// ── All-students flat list ────────────────────────────────
function AllStudentsList({ students, invoiceByStudentId, allLevels, schoolName, onStudentClick }) {
  const { t } = useLanguage();
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #E8EEF6", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "28px 36px 1fr 100px 140px 80px 30px 20px", gap: 8, padding: "8px 16px", background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
        {["", "", t("students.allStudentsList.headerName"), t("students.allStudentsList.headerLevel"), t("students.allStudentsList.headerEmail"), t("students.allStudentsList.headerPayment"), "", ""].map((h, i) => <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>{h}</span>)}
      </div>
      {students.length === 0
        ? <div style={{ textAlign: "center", color: "#94A3B8", padding: "2rem", fontSize: 13 }}>{t("students.allStudentsList.noResults")}</div>
        : students.map((s, i) => {
          const c   = levelColorByName(s.level, allLevels);
          const inv = currentMonthInvoice(invoiceByStudentId[s.id]);
          return (
            <div key={s.id} onClick={() => onStudentClick(s)}
              onMouseEnter={(e) => e.currentTarget.style.background = "#FAFBFF"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              style={{ display: "grid", gridTemplateColumns: "28px 36px 1fr 100px 140px 80px 30px 20px", gap: 8, padding: "10px 16px", alignItems: "center", borderBottom: i < students.length - 1 ? "1px solid #F8FAFC" : "none", cursor: "pointer" }}>
              <span style={{ fontSize: 11, color: "#CBD5E1", textAlign: "center" }}>{i + 1}</span>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{initials(s.fullName)}</div>
              <div><p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>{s.fullName}</p><p style={{ fontSize: 10, color: "#94A3B8", margin: 0 }}>{s.parentPhone || "—"}</p></div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: c.light, color: c.color }}>{s.level || "—"}</span>
              <span style={{ fontSize: 11, color: "#64748B", direction: "ltr", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.email || "—"}</span>
              {inv ? <StatusBadge status={inv.status} /> : <span style={{ fontSize: 10, color: "#CBD5E1" }}>—</span>}
              {inv?.status === "PAID"
                ? <PrintButton compact onClick={() => printInvoice({ invoice: inv, student: s, schoolName, t })} />
                : <span />}
              <ChevronRight size={14} color="#CBD5E1" />
            </div>
          );
        })
      }
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function Students() {
  const { t } = useLanguage();
  const { school, error: schoolError, refetchSchool } = useSchool();
  const schoolId    = school?.id;
  const schoolName  = school?.schoolName ?? t("students.print.schoolFallback");

  const [modules,       setModules]      = useState([]);
  const [studentMap,    setStudentMap]   = useState({});
  const [allStudents,   setAllStudents]  = useState([]);
  const [invoiceByStudentId, setInvoiceByStudentId] = useState({});
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState(null);
  const [activeLevel,   setActiveLevel]  = useState(null);
  const [search,        setSearch]       = useState("");
  const [viewMode,      setViewMode]     = useState("modules"); // "modules" | "all"
  const [showModal,     setShowModal]    = useState(false);
  const [drawerStudent, setDrawerStudent]= useState(null);
  const [toast,         setToast]        = useState(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true); setError(null);
    try {
      const [modRes, allRes] = await Promise.all([schoolApi.getModules(), schoolApi.getAllStudents()]);
      const mods = modRes.data?.content ?? modRes.data ?? [];
      const students = allRes.data?.content ?? allRes.data ?? [];
      setModules(mods);
      setAllStudents(students);

      if (mods.length > 0) {
        const results = await Promise.all(mods.map((m) => schoolApi.getStudentsByModule(m.id).then((r) => ({ moduleId: m.id, students: r.data?.content ?? r.data ?? [] }))));
        const sMap = {};
        results.forEach(({ moduleId, students }) => { sMap[moduleId] = students; });
        setStudentMap(sMap);
      }

      if (students.length > 0) {
        const invResults = await Promise.all(
          students.map((s) =>
            schoolApi.getStudentInvoices(s.id)
              .then((r) => ({ studentId: s.id, invoices: r.data?.content ?? r.data ?? [] }))
              .catch(() => ({ studentId: s.id, invoices: [] }))
          )
        );
        const iMap = {};
        invResults.forEach(({ studentId, invoices }) => { iMap[studentId] = invoices; });
        setInvoiceByStudentId(iMap);
      } else {
        setInvoiceByStudentId({});
      }

      const levels = [...new Set(mods.map((m) => m.level).filter(Boolean))];
      if (levels.length > 0) setActiveLevel((prev) => prev ?? levels[0]);
    } catch (err) {
      setError(err?.response?.data?.message || t("students.addModal.genericError"));
    } finally { setLoading(false); }
  }, [schoolId, t]);

  useEffect(() => { load(); }, [load]);

  if (schoolError) return <div style={{ padding: "1.5rem", fontFamily: "'Cairo',sans-serif" }} dir="rtl"><ErrorBlock message={schoolError} onRetry={refetchSchool} /></div>;
  if (loading) return <div style={{ padding: "1.5rem", fontFamily: "'Cairo',sans-serif" }} dir="rtl"><LoadingBlock /></div>;
  if (error)   return <div style={{ padding: "1.5rem", fontFamily: "'Cairo',sans-serif" }} dir="rtl"><ErrorBlock message={error} onRetry={load} /></div>;

  const byLevel = {};
  modules.forEach((m, i) => {
    const lvl = m.level || t("students.levelFallback");
    if (!byLevel[lvl]) byLevel[lvl] = { modules: [], colorIdx: Object.keys(byLevel).length };
    byLevel[lvl].modules.push({ ...m, _idx: i });
  });
  const levels    = Object.keys(byLevel);
  const allLevels = levels;
  const active    = activeLevel ?? levels[0];
  const { colorIdx } = byLevel[active] ?? { colorIdx: 0 };
  const { color, light } = levelColor(colorIdx);

  const activeMods    = byLevel[active]?.modules ?? [];
  const levelStudents = activeMods.flatMap((m) => studentMap[m.id] ?? []);
  const uniqueInLevel = [...new Map(levelStudents.map((s) => [s.id, s])).values()];

  const searchTerm   = search.trim();
  const searchSource = viewMode === "all" ? allStudents : uniqueInLevel;
  const filtered     = searchTerm ? searchSource.filter((s) => s.fullName?.includes(searchTerm) || s.email?.includes(searchTerm)) : null;
  const displayList  = filtered ?? (viewMode === "all" ? allStudents : null);

  const totalCount = viewMode === "all" ? allStudents.length : uniqueInLevel.length;
  const paidCount  = (viewMode === "all" ? allStudents : uniqueInLevel).filter((s) => currentMonthInvoice(invoiceByStudentId[s.id])?.status === "PAID").length;

  const handleSuccess = (msg) => {
    setShowModal(false);
    setToast({ message: msg ?? t("students.toastGenericSuccess"), tone: "success" });
    load();
  };
  const handleError = (msg) => setToast({ message: msg ?? t("students.toastGenericError"), tone: "error" });

  const handleRemoveFromModule = async (studentId, moduleId, studentName, moduleLabel) => {
    try {
      await schoolApi.removeEnrollment(studentId, moduleId);
      setToast({ message: t("students.removedFromModule", { name: studentName, module: moduleLabel }), tone: "success" });
      load();
    } catch (err) {
      setToast({ message: err?.response?.data?.message || t("students.removeFromModuleError"), tone: "error" });
    }
  };

  return (
    <div dir="rtl" style={{ padding: "1.25rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {showModal && <AddStudentModal modules={modules} allLevels={allLevels} onClose={() => setShowModal(false)} onSuccess={handleSuccess} onError={handleError} />}
      {drawerStudent && (
        <StudentDrawer
          student={drawerStudent}
          modules={modules}
          allLevels={allLevels}
          schoolId={schoolId}
          schoolName={schoolName}
          onClose={() => setDrawerStudent(null)}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
      {toast && <Toast message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("students.title")}</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, margin: 0 }}>
            {viewMode === "all" ? t("students.countTotal", { count: totalCount }) : t("students.countLevel", { count: totalCount })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><RefreshCw size={13} />{t("students.refresh")}</button>
          <button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, border: "none", background: "#3B82F6", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px #3B82F640" }}><Plus size={14} />{t("students.addStudent")}</button>
        </div>
      </div>

      {/* View mode toggle */}
      <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 3, width: "fit-content", marginBottom: "1.25rem" }}>
        {[{ key: "modules", label: t("students.viewMode.byModule") }, { key: "all", label: t("students.viewMode.all") }].map(({ key, label }) => (
          <button key={key} onClick={() => { setViewMode(key); setSearch(""); }} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: "none", background: viewMode === key ? "#fff" : "transparent", color: viewMode === key ? "#0F172A" : "#94A3B8", boxShadow: viewMode === key ? "0 1px 4px rgba(15,23,42,.08)" : "none", transition: "all .15s" }}>{label}</button>
        ))}
      </div>

      {/* Level tabs — modules view only */}
      {viewMode === "modules" && levels.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1.25rem" }}>
          {levels.map((lvl) => {
            const c     = levelColor(byLevel[lvl].colorIdx);
            const count = (byLevel[lvl].modules ?? []).flatMap((m) => studentMap[m.id] ?? []).length;
            return <LevelTab key={lvl} levelKey={lvl} count={count} color={c.color} light={c.light} active={active === lvl} onClick={() => { setActiveLevel(lvl); setSearch(""); }} />;
          })}
        </div>
      )}

      {/* Stats + Search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[{ label: t("students.statLabels.students"), value: totalCount }, { label: t("students.statLabels.paid"), value: paidCount }, { label: t("students.statLabels.modules"), value: viewMode === "modules" ? activeMods.length : modules.length }].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 9, border: "1px solid #E2E8F0", padding: "6px 12px" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{value}</span>
              <span style={{ fontSize: 11, color: "#64748B" }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", width: 240 }}>
          <Search size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
          <input style={{ width: "100%", paddingRight: 32, paddingLeft: 10, paddingTop: 8, paddingBottom: 8, borderRadius: 9, border: `1.5px solid ${search ? color : "#E2E8F0"}`, fontSize: 13, fontFamily: "inherit", color: "#0F172A", background: "#fff", outline: "none", boxSizing: "border-box" }} placeholder={t("students.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Content */}
      {levels.length === 0
        ? <div style={{ textAlign: "center", color: "#94A3B8", padding: "3rem", fontSize: 13 }}>{t("students.noModulesRegistered")}</div>
        : displayList !== null
          ? <AllStudentsList students={displayList} invoiceByStudentId={invoiceByStudentId} allLevels={allLevels} schoolName={schoolName} onStudentClick={setDrawerStudent} />
          : activeMods.map((m) => {
            const c = levelColor(m._idx);
            return <ModuleSection key={m.id} module={m} students={studentMap[m.id] ?? []} invoiceByStudentId={invoiceByStudentId} color={c.color} light={c.light} schoolName={schoolName} onStudentClick={setDrawerStudent} onRemoveStudent={handleRemoveFromModule} />;
          })
      }
    </div>
  );
}