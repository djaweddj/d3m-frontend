import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, XCircle, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, Plus, X, Eye, EyeOff, UserPlus,
  BookOpen, CreditCard, ArrowLeft, GraduationCap,
  Clock, Wallet, Printer, History, ClipboardList,
  Ban, Pencil, Check, Folder, FolderOpen, Layers, Loader2
} from "lucide-react";
import { useSchool } from "../context/SchoolContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../api";
import Reveal from "../components/home/Reveal";
import NButton from "../components/home/NButton";
import FolderCard, { FolderShell } from "../components/student/FolderCard";
import GroupStudentsDrawer from "../components/student/GroupStudentsDrawer";
import Modal from "../components/student/Modal";
import Stepper from "../components/student/Stepper";
import { Field, Input, ErrorNote } from "../components/student/Field";
import { Chip, ChoiceRow } from "../components/student/Choice";

// ── API ───────────────────────────────────────────────────
const schoolApi = {
  getModules:          ()                       => api.get("api/modules"),
  getStudentsByModule: (moduleId)               => api.get(`api/students/by-module/${moduleId}`),
  getAllStudents:      ()                       => api.get("api/students"),
  registerStudent:     (data)                   => api.post("api/students/register", data),
  adminEnroll:         (studentId, moduleId)    =>
    api.post(`api/enrollments/admin-enroll?studentId=${studentId}&moduleId=${moduleId}`),
  adminSuspend:        (studentId, moduleId)    =>
    api.post(`api/enrollments/admin-suspend?studentId=${studentId}&moduleId=${moduleId}`),
  getStudentEnrollments: (studentId)            => api.get(`api/enrollments/student/${studentId}`),
  getStudentInvoices: (studentId)               => api.get(`api/invoices/student/${studentId}`),
  getSchoolRevenue:    (period)                 => api.get(`api/invoices/school/revenue?period=${period}`),
  markInvoicePaid:     (invoiceId)              => api.post(`api/invoices/${invoiceId}/pay`),
  createInvoiceManually: (payload)              => api.post("api/invoices/create", payload),
  updateInvoicePrice: (invoiceId, price) =>
    api.put(`api/invoices/${invoiceId}/price`, { price }),
};

// Overall payment status across a set of invoices:
// - "PAID" only if there's at least one invoice and every single one is PAID
// - "PENDING" if there's at least one invoice and at least one isn't PAID
// - null if there are no invoices at all
function overallInvoiceStatus(invoices) {
  if (!Array.isArray(invoices) || invoices.length === 0) return null;
  return invoices.every((inv) => inv.status === "PAID") ? "PAID" : "PENDING";
}

// ── Palette (used by the older modals + detail drawer) ────
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

function formatPeriod(periodStart, periodEnd) {
  if (!periodStart || !periodEnd) return "—";
  try {
    const fmt = new Intl.DateTimeFormat("fr-DZ", { day: "2-digit", month: "short", year: "numeric" });
    return `${fmt.format(new Date(periodStart))} – ${fmt.format(new Date(periodEnd))}`;
  } catch { return "—"; }
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
    [t("students.print.rowPeriod"), formatPeriod(invoice.periodStart, invoice.periodEnd)],
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
      <title>${t("students.print.attendanceDocTitle", { name: module.name ?? module.subjectName ?? "" })}</title>
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
        <div><span>${t("students.print.metaModule")}</span><strong>${module.name ?? module.subjectName ?? "—"}</strong></div>
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

// Suspend button: amber icon, triggers the suspend confirmation dialog.
function SuspendEnrollButton({ onClick, compact = false, busy = false, label }) {
  const { t } = useLanguage();
  const resolvedLabel = label ?? t("students.buttons.removeLabel");
  if (compact) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); if (!busy) onClick(); }}
        disabled={busy}
        title={t("students.buttons.removeFromModuleTitle")}
        style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: busy ? "not-allowed" : "pointer", flexShrink: 0, opacity: busy ? .55 : 1 }}
        onMouseEnter={(e) => { if (!busy) { e.currentTarget.style.background = "#FFFBEB"; e.currentTarget.style.borderColor = "#D97706"; } }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
      >
        <Ban size={12} color="#D97706" />
      </button>
    );
  }
  return (
    <button onClick={onClick} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 7, border: "1.5px solid #D97706", background: "#FFFBEB", color: "#D97706", fontSize: 11, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: busy ? .6 : 1 }}>
      <Ban size={12} />{busy ? t("students.buttons.removing") : resolvedLabel}
    </button>
  );
}

// Confirmation dialog used before suspending a student from a module.
function ConfirmSuspendModal({ studentName, moduleLabel, busy, onConfirm, onCancel }) {
  const { t } = useLanguage();
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", backdropFilter: "blur(4px)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onCancel}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 380, boxShadow: "0 24px 60px rgba(15,23,42,.18)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 20px 14px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ban size={20} color="#D97706" />
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("students.suspendModal.heading")}</p>
          <p style={{ fontSize: 12, color: "#64748B", margin: 0, lineHeight: 1.6 }}>
            {t("students.suspendModal.body", { name: studentName, module: moduleLabel })}
          </p>
        </div>
        <div style={{ padding: "14px 20px 20px", display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={busy} style={{ flex: 1, padding: "9px 18px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {t("students.suspendModal.cancel")}
          </button>
          <button onClick={onConfirm} disabled={busy} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: busy ? "#E2E8F0" : "#D97706", color: busy ? "#94A3B8" : "#fff", fontSize: 13, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {busy
              ? <><div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin .8s linear infinite" }} />{t("students.suspendModal.confirming")}</>
              : <><Ban size={14} />{t("students.suspendModal.confirm")}</>
            }
          </button>
        </div>
      </div>
    </div>
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

// NOTE: fontSize is 16 on purpose. Anything under 16px triggers iOS Safari's
// auto-zoom-on-focus on real inputs/selects.
const inp = { width: "100%", padding: "10px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontSize: 16, fontFamily: "inherit", color: "#0F172A", background: "#fff", outline: "none", boxSizing: "border-box" };
const lbl = { fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5, display: "block" };
const fw  = { display: "flex", flexDirection: "column", gap: 4 };

// ── Add Student Modal (3-step: register + enroll) ─────────
function AddStudentModal({ modules, allLevels, onClose, onSuccess }) {
  const { t, dir } = useLanguage();
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
    <Modal
      dir={dir}
      onClose={onClose}
      icon={UserPlus}
      title={t("students.addModal.heading")}
      subtitle={STEPS[step]}
      closeLabel={t("students.groupsPage.close")}
      footer={
        <>
          <NButton size="sm" variant="outline" onClick={() => (step > 0 ? setStep((s) => s - 1) : onClose())}>
            {step === 0 ? t("students.addModal.cancel") : t("students.addModal.back")}
          </NButton>
          {step < 2 ? (
            <NButton size="sm" variant="gold" disabled={!stepValid[step]} onClick={() => setStep((s) => s + 1)}>
              {t("students.addModal.next")}
            </NButton>
          ) : (
            <NButton size="sm" variant="gold" disabled={submitting || !stepValid[2]} onClick={handleSubmit}>
              {submitting
                ? <><Loader2 className="size-4 animate-spin" />{t("students.addModal.submitting")}</>
                : <><UserPlus className="size-4" />{t("students.addModal.submit")}</>}
            </NButton>
          )}
        </>
      }
    >
      <Stepper steps={STEPS} current={step} />

      <div className="space-y-4">
        {step === 0 && (
          <>
            <Field label={t("students.addModal.fullName")}>
              <Input placeholder={t("students.addModal.fullNamePlaceholder")} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
            </Field>
            <Field label={t("students.addModal.email")}>
              <Input dir="ltr" type="email" placeholder="student@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label={t("students.addModal.password")}>
              <Input
                dir="ltr"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                endSlot={
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="text-green-deep/50 hover:text-gold-deep">
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              />
            </Field>
            <Field group label={t("students.addModal.level")}>
              <div className="flex flex-wrap gap-2">
                {allLevels.map((lvl) => (
                  <Chip key={lvl} active={form.level === lvl} onClick={() => { set("level", lvl); set("moduleId", ""); }}>
                    {lvl}
                  </Chip>
                ))}
              </div>
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label={t("students.addModal.birthDate")}>
              <Input dir="ltr" type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
            </Field>
            <Field label={t("students.addModal.parentName")}>
              <Input placeholder={t("students.addModal.parentNamePlaceholder")} value={form.parentName} onChange={(e) => set("parentName", e.target.value)} />
            </Field>
            <Field label={t("students.addModal.parentPhone")}>
              <Input dir="ltr" type="tel" placeholder="0555 000 000" value={form.parentPhone} onChange={(e) => set("parentPhone", e.target.value)} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-xs text-green-deep/60">{t("students.addModal.chooseModuleFor", { level: form.level })}</p>
            {modulesForLevel.length === 0 ? (
              <p className="py-8 text-center text-sm text-green-deep/50">{t("students.addModal.noModulesForLevel")}</p>
            ) : (
              <div className="space-y-2">
                {modulesForLevel.map((m) => (
                  <ChoiceRow
                    key={m.id}
                    active={String(form.moduleId) === String(m.id)}
                    onClick={() => set("moduleId", m.id)}
                    badge={m.level?.slice(0, 3) ?? "—"}
                    title={m.name ?? m.subjectName}
                    meta={`${m.teacherName ?? "—"} · ${money(m.monthlyprice ?? m.monthlyPrice)} ${t("students.addModal.perMonth")}`}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {submitError && (
          <ErrorNote><AlertCircle className="size-4 shrink-0" />{submitError}</ErrorNote>
        )}
      </div>
    </Modal>
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
                    <p style={{ fontSize: 13, fontWeight: 700, color: active ? c.color : "#0F172A", margin: 0 }}>{m.name ?? m.subjectName}</p>
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
  const [periodStart, setPeriodStart]   = useState(new Date().toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd]       = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate]           = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount]             = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState(null);

  const handleSubmit = async () => {
    if (!enrollmentId || !amount || !periodStart || !periodEnd) return;
    setSubmitting(true); setError(null);
    try {
      await schoolApi.createInvoiceManually({
        enrollmentId: Number(enrollmentId),
        studentId: student.id,
        dueDate,
        periodStart,
        periodEnd,
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
              {enrollments.map((e) => <option key={e.id} value={e.id}>{e.moduleName ?? e.subjectName}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={fw}><label style={lbl}>{t("students.invoiceModal.periodStart")}</label><input style={{ ...inp, direction: "ltr" }} type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} /></div>
            <div style={fw}><label style={lbl}>{t("students.invoiceModal.periodEnd")}</label><input style={{ ...inp, direction: "ltr" }} type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} /></div>
          </div>
          <div style={fw}><label style={lbl}>{t("students.invoiceModal.dueDate")}</label><input style={{ ...inp, direction: "ltr" }} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
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
          <button onClick={handleSubmit} disabled={submitting || !enrollmentId || !amount || !periodStart || !periodEnd} style={{display: "flex", alignItems: "center", gap: 7, padding: "9px 22px", borderRadius: 9, border: "none", background: (!submitting && enrollmentId && amount && periodStart && periodEnd) ? "#D97706" : "#E2E8F0", color: (!submitting && enrollmentId && amount && periodStart && periodEnd) ? "#fff" : "#94A3B8", cursor: (!submitting && enrollmentId && amount && periodStart && periodEnd) ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            {submitting ? <><div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid #fff", borderTopColor: "transparent", animation: "spin .8s linear infinite" }} />{t("students.invoiceModal.submitting")}</> : <><CreditCard size={14} />{t("students.invoiceModal.submit")}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invoice row (used inside the drawer's unpaid list + collapsible paid list) ──
function InvoiceHistoryRow({ invoice, student, schoolName, onPay, payingId, t,
  editing, priceDraft, onStartEdit, onCancelEdit, onSavePrice, onDraftChange, saving }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 9, background: "#fff", border: "1px solid #F1F5F9" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: "#0F172A", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{invoice.moduleName ?? t("students.print.rowModule")}</span>
        <span style={{ fontSize: 11, color: "#94A3B8", display: "flex", alignItems: "center", gap: 6 }}>
          {formatPeriod(invoice.periodStart, invoice.periodEnd)}
          {editing ? (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              ·
              <input
                type="number"
                autoFocus
                value={priceDraft}
                onChange={(e) => onDraftChange(e.target.value)}
                style={{ width: 64, fontSize: 11, padding: "2px 5px", borderRadius: 5, border: "1.5px solid #3B82F6", fontFamily: "inherit", direction: "ltr" }}
              />
              {t("students.print.currency")}
            </span>
          ) : (
            invoice.amount != null ? ` · ${money(invoice.amount)} ${t("students.print.currency")}` : ""
          )}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <StatusBadge status={invoice.status} size={9} />

        {editing ? (
          <>
            <button onClick={() => onSavePrice(invoice)} disabled={saving} style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Check size={12} />
            </button>
            <button onClick={onCancelEdit} disabled={saving} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={12} color="#64748B" />
            </button>
          </>
        ) : (
          <button onClick={() => onStartEdit(invoice)} title={t("students.drawer.editPrice") ?? "Edit price"} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Pencil size={11} color="#64748B" />
          </button>
        )}

        {invoice.status !== "PAID" && invoice.id && !editing && (
          <button onClick={() => onPay(invoice)} disabled={payingId === invoice.id} style={{ padding: "4px 10px", borderRadius: 7, border: "none", background: "#059669", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: payingId === invoice.id ? .6 : 1 }}>
            {payingId === invoice.id ? "..." : t("students.drawer.registerPayment")}
          </button>
        )}
        {invoice.status === "PAID" && !editing && (
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
  const [editingPriceId, setEditingPriceId] = useState(null); // invoice id being edited
  const [priceDraft, setPriceDraft]         = useState("");
  const [savingPrice, setSavingPrice]       = useState(false);

  const startEditPrice = (invoice) => {
    setEditingPriceId(invoice.id);
    setPriceDraft(String(invoice.amount ?? ""));
  };

  const cancelEditPrice = () => { setEditingPriceId(null); setPriceDraft(""); };

  const saveEditPrice = async (invoice) => {
    if (!priceDraft || isNaN(Number(priceDraft))) return;
    setSavingPrice(true);
    try {
      await schoolApi.updateInvoicePrice(invoice.id, Number(priceDraft));
      onSuccess(t("students.drawer.priceUpdateSuccess") ?? "Price updated");
      loadInvoices();
      setEditingPriceId(null);
    } catch (err) {
      onError(
        err?.response?.data?.message ??
        t("students.drawer.priceUpdateError") ??
        "Failed to update price"
      );
    } finally {
      setSavingPrice(false);
    }
  };

  const [invoices, setInvoices]       = useState([]);
  const [loadingInv, setLoadingInv]   = useState(true);
  const [errInv, setErrInv]           = useState(null);
  const [showPaidInvoices, setShowPaidInvoices] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null); // enrollment pending suspend confirmation
  const [suspendingEnrId, setSuspendingEnrId] = useState(null);

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

  // Unpaid invoices are shown directly; paid ones are tucked behind "see other invoices".
  const unpaidInvoices = invoices.filter((inv) => inv.status !== "PAID");
  const paidInvoices   = invoices.filter((inv) => inv.status === "PAID");

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

  const requestSuspend = (enr) => setSuspendTarget(enr);

  const confirmSuspend = async () => {
    const enr = suspendTarget;
    if (!enr) return;
    setSuspendingEnrId(enr.id);
    try {
      await schoolApi.adminSuspend(student.id, enr.moduleId);
      loadEnrollments();
      onSuccess(t("students.drawer.unenrollSuccess", { name: student.fullName, module: enr.moduleName ?? enr.subjectName ?? t("students.drawer.defaultModuleLabel") }));
      setSuspendTarget(null);
    } catch (err) {
      onError(err?.response?.data?.message || t("students.drawer.unenrollError"));
    } finally { setSuspendingEnrId(null); }
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
      {suspendTarget && (
        <ConfirmSuspendModal
          studentName={student.fullName}
          moduleLabel={suspendTarget.moduleName ?? suspendTarget.subjectName ?? t("students.drawer.defaultModuleLabel")}
          busy={suspendingEnrId === suspendTarget.id}
          onConfirm={confirmSuspend}
          onCancel={() => setSuspendTarget(null)}
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
              : unpaidInvoices.length === 0
                ? <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>{t("students.drawer.noInvoiceThisMonth")}</p>
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {unpaidInvoices.map((inv) => (
                      <InvoiceHistoryRow
                        key={inv.id} invoice={inv} student={student} schoolName={schoolName}
                        onPay={handlePay} payingId={payingId} t={t}
                        editing={editingPriceId === inv.id}
                        priceDraft={priceDraft}
                        onStartEdit={startEditPrice}
                        onCancelEdit={cancelEditPrice}
                        onSavePrice={saveEditPrice}
                        onDraftChange={setPriceDraft}
                        saving={savingPrice}
                      />
                    ))}
                  </div>
                )
            }

            {/* Collapsible paid invoices */}
            {!loadingInv && !errInv && paidInvoices.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <button onClick={() => setShowPaidInvoices((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, color: "#64748B", fontSize: 11, fontWeight: 700 }}>
                  <History size={12} />
                  {t("students.drawer.invoiceHistory", { count: paidInvoices.length })}
                  {showPaidInvoices ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {showPaidInvoices && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {paidInvoices.map((inv) => (
                      <InvoiceHistoryRow
                        key={inv.id} invoice={inv} student={student} schoolName={schoolName}
                        onPay={handlePay} payingId={payingId} t={t}
                        editing={editingPriceId === inv.id}
                        priceDraft={priceDraft}
                        onStartEdit={startEditPrice}
                        onCancelEdit={cancelEditPrice}
                        onSavePrice={saveEditPrice}
                        onDraftChange={setPriceDraft}
                        saving={savingPrice}
                      />
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
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>{enr.moduleName ?? enr.subjectName ?? "—"}</p>
                        <p style={{ fontSize: 11, color: "#94A3B8", margin: "2px 0 0" }}>👨‍🏫 {enr.teacherName ?? "—"} · {money(enr.monthlyPrice)} {t("students.drawer.perMonth")}</p>
                      </div>
                      <SuspendEnrollButton compact busy={suspendingEnrId === enr.id} onClick={() => requestSuspend(enr)} />
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

// ── Main ──────────────────────────────────────────────────
const ALL = "__all__";

export default function Students() {
  const { t, dir } = useLanguage();
  const { school, error: schoolError, refetchSchool } = useSchool();
  const schoolId   = school?.id;
  const schoolName = school?.schoolName ?? t("students.print.schoolFallback");

  const [modules,            setModules]            = useState([]);
  const [studentMap,         setStudentMap]         = useState({});
  const [allStudents,        setAllStudents]        = useState([]);
  const [invoiceByStudentId, setInvoiceByStudentId] = useState({});
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);
  const [levelId,            setLevelId]            = useState(null);
  const [openGroupId,        setOpenGroupId]        = useState(null);
  const [showModal,          setShowModal]          = useState(false);
  const [drawerStudent,      setDrawerStudent]      = useState(null);
  const [suspendTarget,      setSuspendTarget]      = useState(null); // { student, module }
  const [suspendingId,       setSuspendingId]       = useState(null);
  const [toast,              setToast]              = useState(null);

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
    } catch (err) {
      setError(err?.response?.data?.message || t("students.addModal.genericError"));
    } finally { setLoading(false); }
  }, [schoolId, t]);

  useEffect(() => { load(); }, [load]);

  const hasData = modules.length > 0 || allStudents.length > 0;
  const fallbackWrap = (node) => <div dir={dir} className="min-h-screen bg-ivory p-6">{node}</div>;

  if (schoolError)         return fallbackWrap(<ErrorBlock message={schoolError} onRetry={refetchSchool} />);
  if (loading && !hasData) return fallbackWrap(<LoadingBlock />);
  if (error && !hasData)   return fallbackWrap(<ErrorBlock message={error} onRetry={load} />);

  // ── derived data ──
  const levelOf     = (m) => m.level || t("students.levelFallback");
  const levels      = [...new Set(modules.map(levelOf))];
  const active      = levelId === ALL || levels.includes(levelId) ? levelId : (levels[0] ?? null);
  const modulesOf   = (lvl) => modules.filter((m) => levelOf(m) === lvl);
  const uniqueCount = (mods) => new Set(mods.flatMap((m) => (studentMap[m.id] ?? []).map((s) => s.id))).size;
  const isPaid      = (s) => overallInvoiceStatus(invoiceByStudentId[s.id]) === "PAID";
  const groupName   = (m) => m.name ?? m.subjectName ?? t("students.drawer.defaultModuleLabel");

  const groups = active && active !== ALL ? modulesOf(active) : [];

  const openModule     = openGroupId && openGroupId !== ALL ? modules.find((m) => String(m.id) === String(openGroupId)) : null;
  const drawerOpen     = openGroupId === ALL || !!openModule;
  const drawerStudents = openGroupId === ALL ? allStudents : (openModule ? studentMap[openModule.id] ?? [] : []);

  const handleSuccess = (msg) => {
    setShowModal(false);
    setToast({ message: msg ?? t("students.toastGenericSuccess"), tone: "success" });
    load();
  };
  const handleError = (msg) => setToast({ message: msg ?? t("students.toastGenericError"), tone: "error" });

  const handleSuspendFromModule = async (studentId, moduleId, studentName, moduleLabel) => {
    try {
      await schoolApi.adminSuspend(studentId, moduleId);
      setToast({ message: t("students.removedFromModule", { name: studentName, module: moduleLabel }), tone: "success" });
      load();
    } catch (err) {
      setToast({ message: err?.response?.data?.message || t("students.removeFromModuleError"), tone: "error" });
    }
  };

  const confirmSuspend = async () => {
    if (!suspendTarget) return;
    const { student, module } = suspendTarget;
    setSuspendingId(student.id);
    try {
      await handleSuspendFromModule(student.id, module.id, student.fullName, groupName(module));
      setSuspendTarget(null);
    } finally { setSuspendingId(null); }
  };

  const renderActions = (s) => {
    const status  = overallInvoiceStatus(invoiceByStudentId[s.id]);
    const paidInv = (invoiceByStudentId[s.id] ?? []).find((inv) => inv.status === "PAID");
    return (
      <>
        {status && <StatusBadge status={status} />}
        {status === "PAID" && paidInv && (
          <PrintButton compact onClick={() => printInvoice({ invoice: paidInv, student: s, schoolName, t })} />
        )}
        {openModule && (
          <SuspendEnrollButton compact busy={suspendingId === s.id} onClick={() => setSuspendTarget({ student: s, module: openModule })} />
        )}
      </>
    );
  };

  const drawerLabels = {
    search: t("students.searchPlaceholder"),
    count:  t("students.moduleSection.studentsCount"),
    empty:  t("students.allStudentsList.noResults"),
    prev:   t("students.groupsPage.prev"),
    next:   t("students.groupsPage.next"),
    close:  t("students.groupsPage.close"),
  };

  return (
    <div dir={dir} className="min-h-screen bg-ivory px-4 py-6 sm:px-6 lg:px-8">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {showModal && <AddStudentModal modules={modules} allLevels={levels} onClose={() => setShowModal(false)} onSuccess={handleSuccess} />}
      {drawerStudent && (
        <StudentDrawer
          student={drawerStudent}
          modules={modules}
          allLevels={levels}
          schoolId={schoolId}
          schoolName={schoolName}
          onClose={() => setDrawerStudent(null)}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
      {suspendTarget && (
        <ConfirmSuspendModal
          studentName={suspendTarget.student.fullName}
          moduleLabel={groupName(suspendTarget.module)}
          busy={suspendingId === suspendTarget.student.id}
          onConfirm={confirmSuspend}
          onCancel={() => setSuspendTarget(null)}
        />
      )}
      {toast && <Toast message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />}

      <div className="container mx-auto">
        {/* Compact header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gold/25 pb-4">
          <div>
            <h1 className="font-display text-2xl text-green-deep sm:text-3xl">{t("students.title")}</h1>
            <p className="mt-0.5 text-xs text-green-deep/60">
              {allStudents.length} {t("students.moduleSection.studentsCount")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NButton size="sm" variant="outline" onClick={load}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{t("students.refresh")}</span>
            </NButton>
            <NButton size="sm" variant="gold" onClick={() => setShowModal(true)}>
              <Plus className="size-4" />{t("students.addStudent")}
            </NButton>
          </div>
        </div>

        {levels.length === 0 ? (
          <p className="text-center text-sm text-green-deep/50">{t("students.noModulesRegistered")}</p>
        ) : (
          <>
            <Reveal className="mx-auto mb-8 max-w-md">
              <FolderShell active>
                <label htmlFor="students-level" className="mb-2 flex items-center gap-2 text-xs font-bold text-gold">
                  <Layers className="size-4" />{t("students.groupsPage.levelLabel")}
                </label>
                <select
                  id="students-level"
                  value={active ?? ""}
                  onChange={(e) => { setLevelId(e.target.value); setOpenGroupId(null); }}
                  className="h-12 w-full cursor-pointer rounded-sm border border-gold/40 bg-green-soft px-4 text-base text-ivory outline-none focus:border-gold"
                >
                  {levels.map((lvl) => (
                    <option key={lvl} value={lvl} className="bg-white text-green-deep">
                      {lvl} ({uniqueCount(modulesOf(lvl))})
                    </option>
                  ))}
                  <option value={ALL} className="bg-white text-green-deep">
                    {t("students.groupsPage.allStudents")} ({allStudents.length})
                  </option>
                </select>
              </FolderShell>
            </Reveal>

            <div key={active} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {active === ALL ? (
                <FolderCard
                  icon={openGroupId === ALL ? FolderOpen : Folder}
                  title={t("students.groupsPage.allStudents")}
                  subtitle={t("students.groupsPage.allStudentsHint")}
                  count={allStudents.length}
                  countLabel={t("students.moduleSection.studentsCount")}
                  active={openGroupId === ALL}
                  onClick={() => setOpenGroupId(ALL)}
                />
              ) : groups.map((m, i) => {
                const list   = studentMap[m.id] ?? [];
                const unpaid = list.length - list.filter(isPaid).length;
                const isOpen = String(openGroupId) === String(m.id);
                return (
                  <FolderCard
                    key={m.id}
                    icon={isOpen ? FolderOpen : Folder}
                    title={groupName(m)}
                    subtitle={m.teacherName ?? "—"}
                    count={list.length}
                    countLabel={t("students.moduleSection.studentsCount")}
                    badge={unpaid > 0 ? t("students.moduleSection.unpaidBadge", { count: unpaid }) : null}
                    active={isOpen}
                    onClick={() => setOpenGroupId(m.id)}
                    delay={i * 0.06}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      <GroupStudentsDrawer
        open={drawerOpen}
        onClose={() => setOpenGroupId(null)}
        resetKey={openGroupId}
        dir={dir}
        title={openGroupId === ALL ? t("students.groupsPage.allStudents") : openModule ? groupName(openModule) : ""}
        subtitle={openGroupId === ALL ? t("students.groupsPage.tag") : openModule ? `${levelOf(openModule)} · ${openModule.teacherName ?? "—"}` : ""}
        students={drawerStudents}
        labels={drawerLabels}
        showLevel={openGroupId === ALL}
        closeOnEsc={!drawerStudent && !suspendTarget}
        onSelect={setDrawerStudent}
        renderActions={renderActions}
        toolbarEnd={openModule && (
          <AttendanceSheetButton
            color="#C8A24B"
            light="#FAF3DD"
            onClick={() => printAttendanceSheet({ module: openModule, students: drawerStudents, schoolName, t })}
          />
        )}
      />
    </div>
  );
}