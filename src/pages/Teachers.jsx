
import { useState, useEffect, useCallback } from "react";
import { Plus, Mail, BookOpen, RefreshCw, AlertCircle, X, Check, Archive, Pencil, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, CheckCircle2, Clock, Calculator, Users, Wallet, PiggyBank, Landmark } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../api";

// ── API ───────────────────────────────────────────────────
const teacherApi = {
  getAll:          ()         => api.get("api/teachers"),
  getArchived:     ()         => api.get("api/teachers/archived"),
  create:          (data)     => api.post("api/teachers/create", data),
  update:          (id, data) => api.put(`api/teachers/${id}`, data),
  archive:         (id)       => api.patch(`api/teachers/${id}/archive`),
  unarchive:       (id)       => api.patch(`api/teachers/${id}/unarchive`),
  getSubjects:     ()         => api.get("api/subjects"),

  getPayoutSummary:    (period)             => api.get("api/payouts", { params: { period } }),
  recalculatePayouts:  (period)             => api.post("api/payouts/recalculate", null, { params: { period } }),
  markPayoutPaid:      (payoutId)           => api.post(`api/payouts/${payoutId}/pay`),
  updatePercentage:    (teacherId, value)   => api.patch(`api/payouts/teacher/${teacherId}/percentage`, null, { params: { value } }),
  getLatestForTeacher: (teacherId)          => api.get(`api/payouts/teacher/${teacherId}/latest`),
};

// ── Helpers ───────────────────────────────────────────────
function formatDA(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 2 }).format(amount) + " د.ج";
}

function formatPeriod(period, locale) {
  if (!period) return "—";
  try {
    const [year, month] = String(period).split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(locale || "ar-DZ", { month: "long", year: "numeric" });
  } catch {
    return String(period);
  }
}

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftPeriod(period, delta) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

// ── Shared input style ────────────────────────────────────
const inp = {
  padding: "8px 11px", borderRadius: 9, border: "1.5px solid #E2E8F0",
  fontSize: 13, fontFamily: "inherit", color: "#0F172A",
  background: "#FAFCFF", outline: "none", width: "100%", boxSizing: "border-box",
};

// ── Spinner ───────────────────────────────────────────────
function Spinner({ size = 20, color = "#185FA5" }) {
  return (
    <>
      <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${color}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

// ── Error Block ───────────────────────────────────────────
function ErrorBlock({ message, onRetry, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "2rem" }}>
      <AlertCircle size={32} color="#E2A84B" />
      <p style={{ color: "#64748B", fontSize: 13 }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1.5px solid #185FA5", background: "#EBF4FE", color: "#185FA5", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          <RefreshCw size={13} /> {t("teachers.retry")}
        </button>
      )}
    </div>
  );
}

// ── Month stepper (shared: edit modal + payouts tab) ──────
const stepperBtnStyle = {
  width: 22, height: 22, borderRadius: 6, border: "1px solid #DBEAFE", background: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
};

function MonthStepper({ period, onChange, size = "md" }) {
  const canGoForward = period < currentPeriod();
  const fontSize = size === "lg" ? 14 : 11;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button onClick={() => onChange(shiftPeriod(period, -1))} title="الشهر السابق" style={{ ...stepperBtnStyle, cursor: "pointer" }}>
        <ChevronRight size={14} color="#185FA5" />
      </button>
      <span style={{ fontSize, fontWeight: 700, color: "#0F172A", minWidth: size === "lg" ? 100 : 78, textAlign: "center" }}>
        {formatPeriod(period)}
      </span>
      <button onClick={() => canGoForward && onChange(shiftPeriod(period, 1))} disabled={!canGoForward} title="الشهر التالي"
        style={{ ...stepperBtnStyle, opacity: canGoForward ? 1 : 0.3, cursor: canGoForward ? "pointer" : "not-allowed" }}>
        <ChevronLeft size={14} color="#185FA5" />
      </button>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────
function StatusPill({ isPaid, size = "sm" }) {
  const fs = size === "lg" ? 11.5 : 10;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: size === "lg" ? "4px 11px" : "3px 9px", borderRadius: 20, background: isPaid ? "#ECFDF5" : "#FFFBEB", border: `1px solid ${isPaid ? "#A7F3D0" : "#FDE68A"}` }}>
      {isPaid ? <CheckCircle2 size={size === "lg" ? 13 : 11} color="#059669" /> : <Clock size={size === "lg" ? 13 : 11} color="#D97706" />}
      <span style={{ fontSize: fs, fontWeight: 700, color: isPaid ? "#059669" : "#D97706" }}>
        {isPaid ? "مدفوعة" : "قيد الانتظار"}
      </span>
    </div>
  );
}

// ── Recalculate action (with inline confirm, since it affects the whole school) ──
function RecalcAction({ confirming, recalculating, onClick, onCancel, label, compact }) {
  if (confirming) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: compact ? "1 1 auto" : undefined, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9.5, color: "#94A3B8", fontWeight: 600 }}>
          سيُعيد احتساب رواتب كل الأساتذة لهذا الشهر
        </span>
        <button onClick={onClick} disabled={recalculating}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 10.5, fontWeight: 700, cursor: recalculating ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {recalculating ? <Spinner size={10} color="#DC2626" /> : "تأكيد"}
        </button>
        <button onClick={onCancel} disabled={recalculating}
          style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          إلغاء
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      style={{ flex: compact ? "1 1 auto" : undefined, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
    >
      <Calculator size={12} />
      {label}
    </button>
  );
}

// ── Payout Info Card (edit modal) ─────────────────────────
function PayoutInfoCard({
  lastPayout, payoutLoading, payoutError, previousPercentage, currentPercentage, primaryColor,
  period, onPeriodChange, onMarkPaid, markingPaid, onRecalculate, recalculating,
}) {
  const [confirmingRecalc, setConfirmingRecalc] = useState(false);

  const prevPct  = previousPercentage != null ? Number(previousPercentage) : null;
  const currPct  = parseFloat(currentPercentage);
  const changed  = prevPct != null && !isNaN(currPct) && currPct !== prevPct;
  const increased = changed && currPct > prevPct;
  const isPaid   = lastPayout?.status === "PAID";

  const handleRecalcClick = () => {
    if (!confirmingRecalc) { setConfirmingRecalc(true); return; }
    setConfirmingRecalc(false);
    onRecalculate();
  };

  return (
    <div style={{ borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#F8FAFC", overflow: "hidden" }}>
      <div style={{ padding: "7px 10px", background: "#EBF4FE", borderBottom: "1.5px solid #DBEAFE", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#185FA5", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          سجل الرواتب
        </span>
        <MonthStepper period={period} onChange={onPeriodChange} />
      </div>

      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {payoutLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}><Spinner size={16} /></div>
        ) : payoutError ? (
          <p style={{ fontSize: 11, color: "#DC2626", margin: 0, textAlign: "center", padding: "4px 0" }}>{payoutError}</p>
        ) : !lastPayout ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "2px 0" }}>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: 0, textAlign: "center" }}>لا توجد دفعة محسوبة لهذا الشهر</p>
            <RecalcAction confirming={confirmingRecalc} recalculating={recalculating} onClick={handleRecalcClick} onCancel={() => setConfirmingRecalc(false)} label="احتساب رواتب هذا الشهر" />
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <StatusPill isPaid={isPaid} />
              {isPaid && lastPayout.paidAt && (
                <span style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600 }}>دُفعت في {new Date(lastPayout.paidAt).toLocaleDateString("ar-DZ")}</span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>إيرادات الموديولات</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{formatDA(lastPayout.totalModuleRevenue)}</span>
              </div>
              <span style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 700 }}>×</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>النسبة المطبّقة</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{lastPayout.percentage != null ? `${lastPayout.percentage}%` : "—"}</span>
              </div>
              <span style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 700 }}>=</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>الدفعة</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: primaryColor }}>{formatDA(lastPayout.payoutAmount)}</span>
              </div>
            </div>

            <div style={{ height: 1, background: "#F1F5F9" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>النسبة السابقة</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{prevPct != null ? `${prevPct}%` : "—"}</span>
              </div>
              {changed && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, background: increased ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${increased ? "#A7F3D0" : "#FECACA"}` }}>
                  {increased ? <TrendingUp size={11} color="#059669" /> : <TrendingDown size={11} color="#DC2626" />}
                  <span style={{ fontSize: 11, fontWeight: 700, color: increased ? "#059669" : "#DC2626" }}>{prevPct}% → {currPct}%</span>
                </div>
              )}
            </div>

            <div style={{ height: 1, background: "#F1F5F9" }} />

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {!isPaid && (
                <button onClick={onMarkPaid} disabled={markingPaid}
                  style={{ flex: "1 1 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1px solid #A7F3D0", background: markingPaid ? "#F0FDF4" : "#ECFDF5", color: "#059669", fontSize: 11, fontWeight: 700, cursor: markingPaid ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {markingPaid ? <Spinner size={11} color="#059669" /> : <CheckCircle2 size={12} />}
                  {markingPaid ? "جارٍ التحديد..." : "تحديد كمدفوعة"}
                </button>
              )}
              <RecalcAction confirming={confirmingRecalc} recalculating={recalculating} onClick={handleRecalcClick} onCancel={() => setConfirmingRecalc(false)} label="إعادة الاحتساب" compact={!isPaid} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Add Teacher Modal ─────────────────────────────────────
<<<<<<< HEAD
function AddTeacherModal({ subjects, onClose, onSaved, primaryColor }) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "Teacher@123", percentage: "20", specialization: "", bio: "", subjectId: "" });
=======
function AddTeacherModal({ subjects, onClose, onSaved, primaryColor, t, dir, locale }) {
  const [form, setForm] = useState({
    fullName: "", email: "", password: "Teacher@123",
    percentage: "20", specialization: "", bio: "", subjectId: "",
  });
>>>>>>> a1933d6 (add launguages transition)
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
<<<<<<< HEAD
    if (!form.fullName.trim()) return setError("الاسم مطلوب");
    if (!form.email.trim()) return setError("البريد الإلكتروني مطلوب");
    if (!form.password.trim()) return setError("كلمة المرور مطلوبة");
=======
    if (!form.fullName.trim()) return setError(t("teachers.errors.nameRequired"));
    if (!form.email.trim())    return setError(t("teachers.errors.emailRequired"));
    if (!form.password.trim()) return setError(t("teachers.errors.passwordRequired"));
>>>>>>> a1933d6 (add launguages transition)
    const pct = parseFloat(form.percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) return setError(t("teachers.errors.percentageRange"));

    setSaving(true); setError("");
    try {
      const res = await teacherApi.create({
        fullName: form.fullName, email: form.email, password: form.password,
        percentage: pct, specialization: form.specialization, bio: form.bio,
        subjectId: form.subjectId ? Number(form.subjectId) : null,
      });
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t("teachers.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
<<<<<<< HEAD
    <ModalShell onClose={onClose} title="إضافة أستاذ جديد" subtitle="سيتم إنشاء حساب للأستاذ تلقائياً" emoji="👨‍🏫">
      <FormBody form={form} setForm={setForm} subjects={subjects} showPassword={showPassword} setShowPassword={setShowPassword} primaryColor={primaryColor} isEdit={false} />
=======
    <ModalShell onClose={onClose} title={t("teachers.addModal.title")} subtitle={t("teachers.addModal.subtitle")} emoji="👨‍🏫" dir={dir}>
      <FormBody
        form={form} setForm={setForm} subjects={subjects}
        showPassword={showPassword} setShowPassword={setShowPassword}
        primaryColor={primaryColor} isEdit={false} t={t} locale={locale}
      />
>>>>>>> a1933d6 (add launguages transition)
      {error && <ErrorMsg msg={error} />}
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} primaryColor={primaryColor} label={t("teachers.addModal.submit")} t={t} />
    </ModalShell>
  );
}

// ── Edit Teacher Modal ────────────────────────────────────
function EditTeacherModal({ teacher, subjects, onClose, onSaved, primaryColor, t, dir, locale }) {
  const [form, setForm] = useState({
    fullName: teacher.fullName || "", email: teacher.email || "", password: "",
    percentage: teacher.percentage != null ? String(teacher.percentage) : "0",
    specialization: teacher.specialization || "", bio: teacher.bio || "",
    subjectId: teacher.subjectIds?.[0] != null ? String(teacher.subjectIds[0]) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [period, setPeriod] = useState(currentPeriod());
  const [lastPayout, setLastPayout] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(true);
  const [payoutError, setPayoutError] = useState("");
  const [markingPaid, setMarkingPaid] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    let active = true;
    setPayoutLoading(true);
    setPayoutError("");
    teacherApi.getPayoutSummary(period)
      .then((res) => {
        if (!active) return;
        const mine = res.data?.payouts?.find((pay) => pay.teacherId === teacher.id) ?? null;
        setLastPayout(mine);
      })
      .catch((err) => {
        if (!active) return;
        setLastPayout(null);
        setPayoutError(err?.response?.data?.message || "تعذر تحميل بيانات الراتب");
      })
      .finally(() => { if (active) setPayoutLoading(false); });
    return () => { active = false; };
  }, [period, teacher.id]);

  const handleMarkPaid = async () => {
    if (!lastPayout) return;
    setMarkingPaid(true);
    try {
      const res = await teacherApi.markPayoutPaid(lastPayout.id);
      setLastPayout(res.data);
    } catch (err) {
      setPayoutError(err?.response?.data?.message || "فشل تحديد الدفعة كمدفوعة");
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setPayoutError("");
    try {
      const res = await teacherApi.recalculatePayouts(period);
      const mine = res.data?.payouts?.find((pay) => pay.teacherId === teacher.id) ?? null;
      setLastPayout(mine);
    } catch (err) {
      setPayoutError(err?.response?.data?.message || "فشلت إعادة احتساب الرواتب");
    } finally {
      setRecalculating(false);
    }
  };

  const handleSave = async () => {
<<<<<<< HEAD
    if (!form.fullName.trim()) return setError("الاسم مطلوب");
    if (!form.email.trim()) return setError("البريد الإلكتروني مطلوب");
=======
    if (!form.fullName.trim()) return setError(t("teachers.errors.nameRequired"));
    if (!form.email.trim())    return setError(t("teachers.errors.emailRequired"));
>>>>>>> a1933d6 (add launguages transition)
    const pct = parseFloat(form.percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) return setError(t("teachers.errors.percentageRange"));

    setSaving(true); setError("");
    try {
      const payload = {
        fullName: form.fullName, email: form.email, percentage: pct,
        specialization: form.specialization, bio: form.bio,
        subjectId: form.subjectId ? Number(form.subjectId) : null,
      };
      if (form.password.trim()) payload.password = form.password;

      const res = await teacherApi.update(teacher.id, payload);
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t("teachers.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      onClose={onClose}
      title={t("teachers.editModal.title")}
      subtitle={t("teachers.editModal.subtitleFor", { name: teacher.fullName })}
      emoji="✏️"
      dir={dir}
    >
      <FormBody
<<<<<<< HEAD
        form={form} setForm={setForm} subjects={subjects} showPassword={showPassword} setShowPassword={setShowPassword}
        primaryColor={primaryColor} isEdit={true}
        lastPayout={lastPayout} payoutLoading={payoutLoading} payoutError={payoutError}
        previousPercentage={teacher.percentage} period={period} onPeriodChange={setPeriod}
        onMarkPaid={handleMarkPaid} markingPaid={markingPaid} onRecalculate={handleRecalculate} recalculating={recalculating}
=======
        form={form} setForm={setForm} subjects={subjects}
        showPassword={showPassword} setShowPassword={setShowPassword}
        primaryColor={primaryColor} isEdit={true} t={t} locale={locale}
        lastPayout={lastPayout} payoutLoading={payoutLoading}
        previousPercentage={teacher.percentage}
>>>>>>> a1933d6 (add launguages transition)
      />
      {error && <ErrorMsg msg={error} />}
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} primaryColor={primaryColor} label={t("teachers.editModal.submit")} t={t} />
    </ModalShell>
  );
}

<<<<<<< HEAD
=======
// ── Payout Info Card (edit modal only) ───────────────────
function PayoutInfoCard({ lastPayout, payoutLoading, previousPercentage, currentPercentage, primaryColor, t, locale }) {
  const prevPct   = previousPercentage != null ? Number(previousPercentage) : null;
  const currPct   = parseFloat(currentPercentage);
  const changed   = prevPct != null && !isNaN(currPct) && currPct !== prevPct;
  const increased = changed && currPct > prevPct;

  return (
    <div style={{
      borderRadius: 10, border: "1.5px solid #E2E8F0",
      background: "#F8FAFC", overflow: "hidden",
    }}>
      {/* Card header */}
      <div style={{
        padding: "7px 12px", background: "#EBF4FE",
        borderBottom: "1.5px solid #DBEAFE",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#185FA5", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("teachers.payoutCard.title")}
        </span>
        {lastPayout && !payoutLoading && (
          <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>
            {formatPeriod(lastPayout.period, locale)}
          </span>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>

        {payoutLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
            <Spinner size={16} />
          </div>
        ) : !lastPayout ? (
          <p style={{ fontSize: 12, color: "#94A3B8", margin: 0, textAlign: "center", padding: "4px 0" }}>
            {t("teachers.payoutCard.none")}
          </p>
        ) : (
          <>
            {/* Breakdown row: revenue × % = payout */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>

              {/* Revenue */}
              <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>{t("teachers.payoutCard.revenue")}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                  {formatDA(lastPayout.totalModuleRevenue)}
                </span>
              </div>

              {/* × */}
              <span style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 700 }}>×</span>

              {/* Percentage used */}
              <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>{t("teachers.payoutCard.appliedPercentage")}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                  {lastPayout.percentage != null ? `${lastPayout.percentage}%` : "—"}
                </span>
              </div>

              {/* = */}
              <span style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 700 }}>=</span>

              {/* Payout amount */}
              <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>{t("teachers.payoutCard.payout")}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: primaryColor }}>
                  {formatDA(lastPayout.payoutAmount)}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#F1F5F9" }} />

            {/* Previous percentage + change indicator */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>{t("teachers.payoutCard.previousPercentage")}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                  {prevPct != null ? `${prevPct}%` : "—"}
                </span>
              </div>

              {/* Change badge — only shown when admin has typed a new value */}
              {changed && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "3px 9px", borderRadius: 20,
                  background: increased ? "#ECFDF5" : "#FEF2F2",
                  border: `1px solid ${increased ? "#A7F3D0" : "#FECACA"}`,
                }}>
                  {increased
                    ? <TrendingUp  size={11} color="#059669" />
                    : <TrendingDown size={11} color="#DC2626" />
                  }
                  <span style={{ fontSize: 11, fontWeight: 700, color: increased ? "#059669" : "#DC2626" }}>
                    {prevPct}% → {currPct}%
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

>>>>>>> a1933d6 (add launguages transition)
// ── Shared modal shell ────────────────────────────────────
function ModalShell({ onClose, title, subtitle, emoji, children, dir }) {
  return (
<<<<<<< HEAD
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}>
      <div dir="rtl" style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 440, border: "1.5px solid #E2E8F0", overflow: "hidden", fontFamily: "'Cairo',sans-serif", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
=======
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}
    >
      <div dir={dir} style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 440, border: "1.5px solid #E2E8F0", overflow: "hidden", fontFamily: "'Cairo',sans-serif", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
>>>>>>> a1933d6 (add launguages transition)
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1.5px solid #F1F5F9", background: "#FAFCFF", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#EBF4FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{emoji}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{title}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{subtitle}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={13} color="#64748B" />
          </button>
        </div>
        <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 11, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Shared form body ──────────────────────────────────────
<<<<<<< HEAD
function FormBody({
  form, setForm, subjects, showPassword, setShowPassword, primaryColor, isEdit,
  lastPayout, payoutLoading, payoutError, previousPercentage,
  period, onPeriodChange, onMarkPaid, markingPaid, onRecalculate, recalculating,
}) {
  return (
    <>
      <SectionLabel>معلومات الحساب</SectionLabel>

      <Field label="الاسم الكامل *">
        <input style={inp} type="text" placeholder="اسم الأستاذ" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
      </Field>

      <Field label="البريد الإلكتروني *">
        <input style={{ ...inp, direction: "ltr" }} type="email" placeholder="example@mail.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
=======
function FormBody({ form, setForm, subjects, showPassword, setShowPassword, primaryColor, isEdit, lastPayout, payoutLoading, previousPercentage, t, locale }) {
  return (
    <>
      {/* Section: Account Info */}
      <SectionLabel>{t("teachers.form.accountSection")}</SectionLabel>

      <Field label={t("teachers.form.fullName")}>
        <input style={inp} type="text" placeholder={t("teachers.form.fullNamePlaceholder")}
          value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
      </Field>

      <Field label={t("teachers.form.email")}>
        <input style={{ ...inp, direction: "ltr" }} type="email" placeholder="example@mail.com"
          value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
>>>>>>> a1933d6 (add launguages transition)
      </Field>

      <Field label={isEdit ? t("teachers.form.newPassword") : t("teachers.form.password")}>
        <div style={{ position: "relative" }}>
<<<<<<< HEAD
          <input style={{ ...inp, direction: "ltr", paddingLeft: 34 }} type={showPassword ? "text" : "password"} placeholder={isEdit ? "اترك فارغاً إن لم ترد تغييرها" : "كلمة المرور"} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <button onClick={() => setShowPassword((v) => !v)} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94A3B8", display: "flex", alignItems: "center" }}>
=======
          <input
            style={{ ...inp, direction: "ltr", paddingLeft: 34 }}
            type={showPassword ? "text" : "password"}
            placeholder={isEdit ? t("teachers.form.passwordPlaceholderEdit") : t("teachers.form.passwordPlaceholder")}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <button
            onClick={() => setShowPassword((v) => !v)}
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94A3B8", display: "flex", alignItems: "center" }}
          >
>>>>>>> a1933d6 (add launguages transition)
            {showPassword
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        </div>
        {!isEdit && <p style={{ fontSize: 10, color: "#94A3B8", margin: "4px 0 0" }}>{t("teachers.form.passwordNote")}</p>}
      </Field>

<<<<<<< HEAD
      <SectionLabel>النسبة والدفعات</SectionLabel>
=======
      {/* Section: Revenue */}
      <SectionLabel>{t("teachers.form.revenueSection")}</SectionLabel>
>>>>>>> a1933d6 (add launguages transition)

      {isEdit && (
        <PayoutInfoCard
<<<<<<< HEAD
          lastPayout={lastPayout} payoutLoading={payoutLoading} payoutError={payoutError}
          previousPercentage={previousPercentage} currentPercentage={form.percentage} primaryColor={primaryColor}
          period={period} onPeriodChange={onPeriodChange} onMarkPaid={onMarkPaid} markingPaid={markingPaid}
          onRecalculate={onRecalculate} recalculating={recalculating}
=======
          lastPayout={lastPayout}
          payoutLoading={payoutLoading}
          previousPercentage={previousPercentage}
          currentPercentage={form.percentage}
          primaryColor={primaryColor}
          t={t}
          locale={locale}
>>>>>>> a1933d6 (add launguages transition)
        />
      )}

      <Field label={t("teachers.form.percentageLabel")}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input style={{ ...inp, width: 90, textAlign: "center", fontWeight: 700, fontSize: 15, color: primaryColor }} type="number" min="0" max="100" step="1" value={form.percentage} onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))} />
          <div style={{ flex: 1 }}>
            <input type="range" min="0" max="100" step="1" value={form.percentage} onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))} style={{ width: "100%", accentColor: primaryColor }} />
          </div>
        </div>
<<<<<<< HEAD
        <p style={{ fontSize: 10, color: "#94A3B8", margin: "4px 0 0" }}>الأستاذ سيحصل على {form.percentage || 0}% من إيرادات موديولاته</p>
      </Field>

      <SectionLabel>المعلومات المهنية</SectionLabel>

      <Field label="المادة الدراسية">
        <select style={{ ...inp, cursor: "pointer" }} value={form.subjectId} onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}>
          <option value="">-- اختر مادة --</option>
=======
        <p style={{ fontSize: 10, color: "#94A3B8", margin: "4px 0 0" }}>
          {t("teachers.form.percentageNote", { pct: form.percentage || 0 })}
        </p>
      </Field>

      {/* Section: Professional Info */}
      <SectionLabel>{t("teachers.form.professionalSection")}</SectionLabel>

      <Field label={t("teachers.form.subjectLabel")}>
        <select style={{ ...inp, cursor: "pointer" }} value={form.subjectId}
          onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}>
          <option value="">{t("teachers.form.subjectPlaceholder")}</option>
>>>>>>> a1933d6 (add launguages transition)
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>

<<<<<<< HEAD
      <Field label="التخصص">
        <input style={inp} type="text" placeholder="مثال: رياضيات تطبيقية" value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} />
      </Field>

      <Field label="نبذة مختصرة">
        <input style={inp} type="text" placeholder="وصف قصير عن الأستاذ" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
=======
      <Field label={t("teachers.form.specializationLabel")}>
        <input style={inp} type="text" placeholder={t("teachers.form.specializationPlaceholder")}
          value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} />
      </Field>

      <Field label={t("teachers.form.bioLabel")}>
        <input style={inp} type="text" placeholder={t("teachers.form.bioPlaceholder")}
          value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
>>>>>>> a1933d6 (add launguages transition)
      </Field>
    </>
  );
}

// ── Tiny helpers ──────────────────────────────────────────
function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: 4, borderBottom: "1px solid #F1F5F9" }}>{children}</div>;
}
function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}
function ErrorMsg({ msg }) {
  return <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "7px 12px" }}>⚠️ {msg}</div>;
}
function ModalFooter({ onClose, onSave, saving, primaryColor, label, t }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "1rem 1.25rem", borderTop: "1.5px solid #F1F5F9", background: "#FAFCFF", flexShrink: 0 }}>
<<<<<<< HEAD
      <button onClick={onClose} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
      <button onClick={onSave} disabled={saving} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 9, border: "none", background: saving ? "#93B5D9" : primaryColor, color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
        {saving ? <Spinner size={13} color="#fff" /> : <Check size={13} />}
        {saving ? "جارٍ الحفظ..." : label}
=======
      <button onClick={onClose} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
        {t("teachers.footer.cancel")}
      </button>
      <button
        onClick={onSave} disabled={saving}
        style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 9, border: "none", background: saving ? "#93B5D9" : primaryColor, color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
      >
        {saving ? <Spinner size={13} /> : <Check size={13} />}
        {saving ? t("teachers.footer.saving") : label}
>>>>>>> a1933d6 (add launguages transition)
      </button>
    </div>
  );
}

// ── Teacher Card ──────────────────────────────────────────
function TeacherCard({ t, subjectMap, primaryColor, isArchived, onArchive, onUnarchive, onEdit, actionId, tr }) {
  return (
    <div
      style={{
        background: isArchived ? "#FAFAFA" : "#fff", borderRadius: 14, border: `1.5px solid ${isArchived ? "#E2E8F0" : "#E8EEF6"}`,
        padding: "1.25rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8,
        transition: "border-color .15s, box-shadow .15s", position: "relative", opacity: isArchived ? 0.75 : 1,
      }}
      onMouseEnter={(e) => { if (!isArchived) { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.06)"; }}}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isArchived ? "#E2E8F0" : "#E8EEF6"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {isArchived ? (
<<<<<<< HEAD
        <button onClick={() => onUnarchive(t.id)} disabled={actionId === t.id} title="استعادة الأستاذ"
          style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 7, border: "1px solid #D1FAE5", background: "#ECFDF5", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#059669" }}>
          {actionId === t.id ? <Spinner size={10} color="#059669" /> : <RefreshCw size={10} />}
          استعادة
        </button>
      ) : (
        <button onClick={() => onArchive(t.id)} disabled={actionId === t.id} title="أرشفة الأستاذ"
=======
        <button
          onClick={() => onUnarchive(t.id)} disabled={actionId === t.id}
          title={tr("teachers.restoreTitle")}
          style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 7, border: "1px solid #D1FAE5", background: "#ECFDF5", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#059669" }}
        >
          {actionId === t.id ? <Spinner size={10} /> : <RefreshCw size={10} />}
          {tr("teachers.restore")}
        </button>
      ) : (
        <button
          onClick={() => onArchive(t.id)} disabled={actionId === t.id}
          title={tr("teachers.archiveTitle")}
>>>>>>> a1933d6 (add launguages transition)
          style={{ position: "absolute", top: 10, left: 10, width: 26, height: 26, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: .6, transition: "opacity .15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = ".6")}>
          {actionId === t.id ? <Spinner size={10} /> : <Archive size={11} color="#DC2626" />}
        </button>
      )}

      {!isArchived ? (
<<<<<<< HEAD
        <button onClick={() => onEdit(t)} title="تعديل بيانات الأستاذ"
=======
        <button
          onClick={() => onEdit(t)}
          title={tr("teachers.editTitle")}
>>>>>>> a1933d6 (add launguages transition)
          style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: .6, transition: "opacity .15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = ".6")}>
          <Pencil size={11} color="#185FA5" />
        </button>
      ) : (
<<<<<<< HEAD
        <span style={{ position: "absolute", top: 10, right: 10, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>مؤرشف</span>
=======
        <span style={{ position: "absolute", top: 10, right: 10, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          {tr("teachers.archivedBadge")}
        </span>
>>>>>>> a1933d6 (add launguages transition)
      )}

      <div style={{ width: 52, height: 52, borderRadius: "50%", background: isArchived ? "#94A3B8" : primaryColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, border: "3px solid #EBF4FE", marginTop: isArchived ? 8 : 0 }}>
        {initials(t.fullName)}
      </div>

      <p style={{ fontSize: 13, fontWeight: 700, color: isArchived ? "#94A3B8" : "#0F172A", margin: 0 }}>{t.fullName}</p>

      <p style={{ fontSize: 11, color: "#64748B", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
        <BookOpen size={11} />
        {subjectMap[t.subjectIds?.[0]] || t.specialization || "—"}
      </p>

      {t.specialization && (
        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 12px", borderRadius: 20, background: isArchived ? "#F1F5F9" : "#EBF4FE", color: isArchived ? "#94A3B8" : primaryColor, border: `1px solid ${isArchived ? "#E2E8F0" : "#B5D4F4"}` }}>
          {t.specialization}
        </span>
      )}

      {t.bio && <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, lineHeight: 1.4, textAlign: "center", maxWidth: 160 }}>{t.bio}</p>}

      <div style={{ width: "100%", paddingTop: 10, borderTop: "1.5px solid #F1F5F9", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
          <Mail size={11} style={{ flexShrink: 0 }} />
          <span dir="ltr" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.email || "—"}</span>
        </div>
      </div>
    </div>
  );
}

// ── Payouts Tab: summary stat card ─────────────────────────
function StatCard({ icon, label, value, accent, sub }) {
  return (
    <div style={{ flex: 1, minWidth: 150, background: "#fff", borderRadius: 14, border: "1.5px solid #E8EEF6", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: accent.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8" }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap" }}>{value}</div>
        {sub && <div style={{ fontSize: 9.5, color: "#94A3B8", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Payouts Tab: table row ─────────────────────────────────
function PayoutRow({ payout, teacher, primaryColor, onMarkPaid, markingId }) {
  const isPaid = payout?.status === "PAID";
  const isMarking = markingId === payout?.id;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(160px,1.6fr) 1fr 0.8fr 1fr 1fr 1fr", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid #F1F5F9" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: primaryColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
          {initials(teacher?.fullName || payout?.teacherName)}
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {payout?.teacherName || teacher?.fullName || "—"}
        </span>
      </div>

      <span style={{ fontSize: 12, color: "#334155", textAlign: "center" }}>{formatDA(payout?.totalModuleRevenue)}</span>
      <span style={{ fontSize: 12, color: "#334155", textAlign: "center", fontWeight: 600 }}>{payout?.percentage != null ? `${payout.percentage}%` : "—"}</span>
      <span style={{ fontSize: 12.5, color: primaryColor, textAlign: "center", fontWeight: 700 }}>{formatDA(payout?.payoutAmount)}</span>
      <div style={{ display: "flex", justifyContent: "center" }}><StatusPill isPaid={isPaid} /></div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        {isPaid ? (
          <span style={{ fontSize: 10, color: "#94A3B8" }}>
            {payout.paidAt ? new Date(payout.paidAt).toLocaleDateString("ar-DZ") : "—"}
          </span>
        ) : (
          <button onClick={() => onMarkPaid(payout)} disabled={isMarking}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, border: "1px solid #A7F3D0", background: isMarking ? "#F0FDF4" : "#ECFDF5", color: "#059669", fontSize: 10.5, fontWeight: 700, cursor: isMarking ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {isMarking ? <Spinner size={10} color="#059669" /> : <CheckCircle2 size={11} />}
            تحديد كمدفوعة
          </button>
        )}
      </div>
    </div>
  );
}

// ── Payouts Tab ─────────────────────────────────────────────
function PayoutsTab({ teachers, primaryColor }) {
  const [period, setPeriod] = useState(currentPeriod());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recalculating, setRecalculating] = useState(false);
  const [confirmingRecalc, setConfirmingRecalc] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  const teacherMap = Object.fromEntries(teachers.map((t) => [t.id, t]));

  const load = useCallback((p) => {
    setLoading(true); setError("");
    teacherApi.getPayoutSummary(p)
      .then((res) => setSummary(res.data))
      .catch((err) => { setSummary(null); setError(err?.response?.data?.message || "تعذر تحميل بيانات الرواتب"); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  const handleRecalcClick = async () => {
    if (!confirmingRecalc) { setConfirmingRecalc(true); return; }
    setConfirmingRecalc(false);
    setRecalculating(true); setError("");
    try {
      const res = await teacherApi.recalculatePayouts(period);
      setSummary(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "فشلت إعادة احتساب الرواتب");
    } finally {
      setRecalculating(false);
    }
  };

  const handleMarkPaid = async (payout) => {
    setMarkingId(payout.id);
    try {
      const res = await teacherApi.markPayoutPaid(payout.id);
      setSummary((prev) => prev ? {
        ...prev,
        payouts: prev.payouts.map((p) => p.id === res.data.id ? res.data : p),
        totalPayoutsPaid: (Number(prev.totalPayoutsPaid) || 0) + Number(res.data.payoutAmount || 0),
        totalPayoutsDue: Math.max(0, (Number(prev.totalPayoutsDue) || 0) - Number(res.data.payoutAmount || 0)),
      } : prev);
    } catch (err) {
      setError(err?.response?.data?.message || "فشل تحديد الدفعة كمدفوعة");
    } finally {
      setMarkingId(null);
    }
  };

  const payouts = summary?.payouts ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toolbar: month + recalc */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1.5px solid #E8EEF6", borderRadius: 12, padding: "6px 12px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>الفترة</span>
          <MonthStepper period={period} onChange={setPeriod} size="lg" />
        </div>

        {confirmingRecalc ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>سيُعيد احتساب رواتب كل الأساتذة لشهر {formatPeriod(period)}</span>
            <button onClick={handleRecalcClick} disabled={recalculating}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 12, fontWeight: 700, cursor: recalculating ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {recalculating ? <Spinner size={12} color="#DC2626" /> : <Calculator size={13} />}
              تأكيد إعادة الاحتساب
            </button>
            <button onClick={() => setConfirmingRecalc(false)} disabled={recalculating}
              style={{ padding: "7px 14px", borderRadius: 9, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              إلغاء
            </button>
          </div>
        ) : (
          <button onClick={handleRecalcClick}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none", background: primaryColor, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = ".88")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            <Calculator size={14} /> إعادة احتساب رواتب الشهر
          </button>
        )}
      </div>

      {/* Summary stats */}
      {!loading && summary && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatCard icon={<Users size={18} color="#185FA5" />} label="عدد الأساتذة" value={summary.teacherCount ?? payouts.length} accent={{ bg: "#EBF4FE" }} />
          <StatCard icon={<Clock size={18} color="#D97706" />} label="مستحقات قيد الانتظار" value={formatDA(summary.totalPayoutsDue)} accent={{ bg: "#FFFBEB" }} />
          <StatCard icon={<PiggyBank size={18} color="#059669" />} label="تم دفعه هذا الشهر" value={formatDA(summary.totalPayoutsPaid)} accent={{ bg: "#ECFDF5" }} />
          <StatCard icon={<Landmark size={18} color="#7C3AED" />} label="إجمالي الرواتب" value={formatDA((Number(summary.totalPayoutsDue) || 0) + (Number(summary.totalPayoutsPaid) || 0))} accent={{ bg: "#F5F3FF" }} sub={formatPeriod(period)} />
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8EEF6", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={26} /></div>
        ) : error ? (
          <ErrorBlock message={error} onRetry={() => load(period)} />
        ) : payouts.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "3rem", textAlign: "center" }}>
            <Wallet size={30} color="#CBD5E1" />
            <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>لا توجد رواتب محسوبة لشهر {formatPeriod(period)}</p>
            <button onClick={handleRecalcClick}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: `1.5px solid ${primaryColor}`, background: "#EBF4FE", color: primaryColor, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              <Calculator size={13} /> احتساب رواتب هذا الشهر
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(160px,1.6fr) 1fr 0.8fr 1fr 1fr 1fr", gap: 10, padding: "10px 14px", background: "#F8FAFC", borderBottom: "1.5px solid #F1F5F9" }}>
              {["الأستاذ", "إيرادات الموديولات", "النسبة", "الدفعة", "الحالة", "إجراء"].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textAlign: i === 0 ? "right" : "center", textTransform: "uppercase", letterSpacing: "0.03em" }}>{h}</span>
              ))}
            </div>
            {payouts.map((payout) => (
              <PayoutRow key={payout.id} payout={payout} teacher={teacherMap[payout.teacherId]} primaryColor={primaryColor} onMarkPaid={handleMarkPaid} markingId={markingId} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab switcher ──────────────────────────────────────────
function TabSwitcher({ active, onChange, primaryColor }) {
  const tabs = [
    { id: "teachers", label: "الأساتذة", icon: <BookOpen size={14} /> },
    { id: "payouts", label: "الرواتب", icon: <Wallet size={14} /> },
  ];
  return (
    <div style={{ display: "inline-flex", background: "#F1F5F9", borderRadius: 11, padding: 4, gap: 2 }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: "none",
              background: isActive ? "#fff" : "transparent", color: isActive ? primaryColor : "#64748B",
              fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              boxShadow: isActive ? "0 1px 4px rgba(0,0,0,.08)" : "none", transition: "all .15s",
            }}>
            {tab.icon} {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function Teachers() {
  const { school } = useAuth();
  const { t, dir, locale } = useLanguage();
  const p = school?.primaryColor || "#185FA5";

  const [activeTab, setActiveTab] = useState("teachers");
  const [teachers, setTeachers] = useState([]);
  const [archivedTeachers, setArchivedTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [tRes, sRes] = await Promise.all([teacherApi.getAll(), teacherApi.getSubjects()]);
      setTeachers(tRes.data?.content ?? tRes.data ?? []);
      setSubjects(sRes.data?.content ?? sRes.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || t("teachers.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadArchived = useCallback(async () => {
    setArchivedLoading(true);
    try {
      const res = await teacherApi.getArchived();
      setArchivedTeachers(res.data?.content ?? res.data ?? []);
    } catch {
      setArchivedTeachers([]);
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (showArchived) loadArchived(); }, [showArchived, loadArchived]);

  const handleArchive = async (id) => {
    setActionId(id);
    try {
      await teacherApi.archive(id);
      const archived = teachers.find((t) => t.id === id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      if (showArchived && archived) setArchivedTeachers((prev) => [{ ...archived, archived: true }, ...prev]);
    } catch (err) {
      alert(err?.response?.data?.message || t("teachers.archiveFailed"));
    } finally {
      setActionId(null);
    }
  };

  const handleUnarchive = async (id) => {
    setActionId(id);
    try {
      await teacherApi.unarchive(id);
      const restored = archivedTeachers.find((t) => t.id === id);
      setArchivedTeachers((prev) => prev.filter((t) => t.id !== id));
      if (restored) setTeachers((prev) => [{ ...restored, archived: false }, ...prev]);
    } catch (err) {
      alert(err?.response?.data?.message || t("teachers.restoreFailed"));
    } finally {
      setActionId(null);
    }
  };

  const handleTeacherUpdated = (updated) => {
    setTeachers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const displayList = showArchived ? archivedTeachers : teachers;

  return (
    <div dir={dir} style={{ padding: "1.25rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <div>
<<<<<<< HEAD
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>الأساتذة والرواتب</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, margin: 0 }}>
            {activeTab === "teachers" ? (loading ? "..." : `${teachers.length} أستاذ نشط`) : "تتبّع وإدارة رواتب الأساتذة الشهرية"}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <TabSwitcher active={activeTab} onChange={setActiveTab} primaryColor={p} />

          {activeTab === "teachers" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={showArchived ? loadArchived : load}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                <RefreshCw size={13} />
              </button>
              <button onClick={() => setShowArchived((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${showArchived ? "#FECACA" : "#E2E8F0"}`, background: showArchived ? "#FEF2F2" : "#fff", color: showArchived ? "#DC2626" : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                <Archive size={13} />
                {showArchived ? "إخفاء المؤرشفين" : "الأساتذة المؤرشفون"}
              </button>
              {!showArchived && (
                <button onClick={() => setShowAddModal(true)}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, border: "none", background: p, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = ".88")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                  <Plus size={15} /> إضافة أستاذ
                </button>
              )}
            </div>
=======
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("sidebar.nav.teachers")}</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, margin: 0 }}>
            {loading ? "..." : t("teachers.countActive", { count: teachers.length })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={showArchived ? loadArchived : load}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => setShowArchived((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${showArchived ? "#FECACA" : "#E2E8F0"}`, background: showArchived ? "#FEF2F2" : "#fff", color: showArchived ? "#DC2626" : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
          >
            <Archive size={13} />
            {showArchived ? t("teachers.hideArchived") : t("teachers.showArchived")}
          </button>
          {!showArchived && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, border: "none", background: p, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = ".88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Plus size={15} /> {t("teachers.addTeacher")}
            </button>
>>>>>>> a1933d6 (add launguages transition)
          )}
        </div>
      </div>

<<<<<<< HEAD
      {activeTab === "teachers" ? (
        <>
          {showArchived && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 14px", borderRadius: 10, background: "#FEF2F2", border: "1.5px solid #FECACA" }}>
              <Archive size={14} color="#DC2626" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#DC2626" }}>الأساتذة المؤرشفون — يمكنك استعادة أي أستاذ بالضغط على "استعادة"</span>
            </div>
          )}

          {(loading && !showArchived) || (archivedLoading && showArchived) ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={28} /></div>
          ) : error && !showArchived ? (
            <ErrorBlock message={error} onRetry={load} />
          ) : displayList.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: "3rem", fontSize: 13 }}>
              {showArchived ? "لا يوجد أساتذة مؤرشفون" : "لا يوجد أساتذة مسجلون بعد — أضف أستاذاً جديداً"}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
              {displayList.map((t) => (
                <TeacherCard key={t.id} t={t} subjectMap={subjectMap} primaryColor={p} isArchived={showArchived} onArchive={handleArchive} onUnarchive={handleUnarchive} onEdit={setEditingTeacher} actionId={actionId} />
              ))}
            </div>
          )}
        </>
      ) : (
        <PayoutsTab teachers={teachers} primaryColor={p} />
=======
      {/* Archived banner */}
      {showArchived && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 14px", borderRadius: 10, background: "#FEF2F2", border: "1.5px solid #FECACA" }}>
          <Archive size={14} color="#DC2626" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#DC2626" }}>
            {t("teachers.archivedBanner")}
          </span>
        </div>
      )}

      {/* Body */}
      {(loading && !showArchived) || (archivedLoading && showArchived) ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={28} /></div>
      ) : error && !showArchived ? (
        <ErrorBlock message={error} onRetry={load} t={t} />
      ) : displayList.length === 0 ? (
        <div style={{ textAlign: "center", color: "#94A3B8", padding: "3rem", fontSize: 13 }}>
          {showArchived ? t("teachers.emptyArchived") : t("teachers.emptyActive")}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
          {displayList.map((teacher) => (
            <TeacherCard
              key={teacher.id} t={teacher} subjectMap={subjectMap}
              primaryColor={p} isArchived={showArchived}
              onArchive={handleArchive} onUnarchive={handleUnarchive}
              onEdit={setEditingTeacher} actionId={actionId} tr={t}
            />
          ))}
        </div>
>>>>>>> a1933d6 (add launguages transition)
      )}

      {showAddModal && (
<<<<<<< HEAD
        <AddTeacherModal subjects={subjects} primaryColor={p} onClose={() => setShowAddModal(false)} onSaved={(newTeacher) => setTeachers((prev) => [newTeacher, ...prev])} />
=======
        <AddTeacherModal
          subjects={subjects} primaryColor={p} t={t} dir={dir} locale={locale}
          onClose={() => setShowAddModal(false)}
          onSaved={(newTeacher) => setTeachers((prev) => [newTeacher, ...prev])}
        />
>>>>>>> a1933d6 (add launguages transition)
      )}

      {editingTeacher && (
<<<<<<< HEAD
        <EditTeacherModal teacher={editingTeacher} subjects={subjects} primaryColor={p} onClose={() => setEditingTeacher(null)} onSaved={(updated) => { handleTeacherUpdated(updated); setEditingTeacher(null); }} />
=======
        <EditTeacherModal
          teacher={editingTeacher} subjects={subjects} primaryColor={p} t={t} dir={dir} locale={locale}
          onClose={() => setEditingTeacher(null)}
          onSaved={(updated) => { handleTeacherUpdated(updated); setEditingTeacher(null); }}
        />
>>>>>>> a1933d6 (add launguages transition)
      )}
    </div>
  );
}