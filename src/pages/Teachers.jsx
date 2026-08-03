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

  getPayoutSummary:    (period)     => api.get("api/payouts", { params: { period } }),
  // CHANGED: was recalculatePayouts(period) -> POST /api/payouts/recalculate?period=...
  // That bulk, whole-month endpoint no longer exists. Payouts are now per-teacher,
  // date-range records, so "calculate" means "pay this teacher for whatever they're
  // owed since their last payout" — a per-teacher action, not a month-wide one.
  payTeacherNow:       (teacherId) => api.post(`api/payouts/teacher/${teacherId}/pay-now`),
  markPayoutPaid:      (payoutId)           => api.post(`api/payouts/${payoutId}/pay`),
  updatePercentage:    (teacherId, value)   => api.patch(`api/payouts/teacher/${teacherId}/percentage`, null, { params: { value } }),
  getLatestForTeacher: (teacherId)          => api.get(`api/payouts/teacher/${teacherId}/latest`),
};

// Maps language code -> Intl locale, matching translations.js's LOCALE_MAP
const LOCALE_MAP = { ar: "ar-DZ", fr: "fr-FR", en: "en-US" };

// ── Helpers (pure, no hooks — locale/currency passed in explicitly) ──
function formatDA(amount, currency) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 2 }).format(amount) + " " + currency;
}

function formatPeriod(period, locale) {
  if (!period) return "—";
  try {
    const [year, month] = String(period).split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  } catch {
    return String(period);
  }
}

// NEW: format a payout's date range (periodStart/periodEnd) for display —
// used anywhere we used to show a bare "period" on an individual payout,
// since a payout is no longer tied to a single calendar month.
function formatRange(start, end, locale) {
  if (!start || !end) return "—";
  try {
    const s = new Date(start).toLocaleDateString(locale, { day: "numeric", month: "short" });
    const e = new Date(end).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
    return `${s} – ${e}`;
  } catch {
    return `${start} – ${end}`;
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

// ── Global responsive styles for this page ────────────────
function ResponsiveStyles() {
  return (
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }

      @media (max-width: 768px) {
        .tdb-page { padding: 0.75rem !important; }

        .tdb-header { flex-direction: column !important; align-items: stretch !important; }
        .tdb-header-right { flex-direction: column !important; align-items: stretch !important; width: 100%; }
        .tdb-tabswitcher { width: 100%; }
        .tdb-tabswitcher > div { width: 100%; justify-content: space-between; }
        .tdb-header-btns { width: 100%; }
        .tdb-header-btns button { flex: 1; justify-content: center; }

        .tdb-cards-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; gap: 8px !important; }
        .tdb-card { padding: 1rem 0.75rem !important; }

        .tdb-modal-overlay { padding: 0 !important; align-items: flex-end !important; }
        .tdb-modal-shell { max-width: 100% !important; border-radius: 16px 16px 0 0 !important; max-height: 92vh !important; }

        .payout-toolbar { flex-direction: column !important; align-items: stretch !important; }
        .payout-header-row { display: none !important; }
        .payout-row-desktop { display: none !important; }
        .payout-row-mobile { display: flex !important; }

        .tdb-stat-card { min-width: 46% !important; flex: 1 1 46% !important; }

        .tdb-toast { inset-inline-end: 12px !important; bottom: 12px !important; left: 12px !important; right: 12px !important; max-width: none !important; }
      }

      @media (min-width: 769px) {
        .payout-row-mobile { display: none !important; }
      }
    `}</style>
  );
}

// ── Spinner ───────────────────────────────────────────────
function Spinner({ size = 20, color = "#185FA5" }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${color}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
  );
}

// ── Error Block ───────────────────────────────────────────
function ErrorBlock({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "2rem" }}>
      <AlertCircle size={32} color="#E2A84B" />
      <p style={{ color: "#64748B", fontSize: 13, textAlign: "center" }}>{message}</p>
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
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const canGoForward = period < currentPeriod();
  const fontSize = size === "lg" ? 14 : 11;
  const locale = LOCALE_MAP[dir === "rtl" ? "ar" : "fr"]; // fallback; real locale passed from parent when available
  // In RTL, "previous month" visually points right (→) and "next" points left (←); flipped for LTR.
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button onClick={() => onChange(shiftPeriod(period, -1))} style={{ ...stepperBtnStyle, cursor: "pointer" }}>
        <PrevIcon size={14} color="#185FA5" />
      </button>
      <span style={{ fontSize, fontWeight: 700, color: "#0F172A", minWidth: size === "lg" ? 100 : 78, textAlign: "center" }}>
        {formatPeriod(period, locale)}
      </span>
      <button onClick={() => canGoForward && onChange(shiftPeriod(period, 1))} disabled={!canGoForward}
        style={{ ...stepperBtnStyle, opacity: canGoForward ? 1 : 0.3, cursor: canGoForward ? "pointer" : "not-allowed" }}>
        <NextIcon size={14} color="#185FA5" />
      </button>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────
function StatusPill({ isPaid, size = "sm" }) {
  const { t } = useLanguage();
  const fs = size === "lg" ? 11.5 : 10;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: size === "lg" ? "4px 11px" : "3px 9px", borderRadius: 20, background: isPaid ? "#ECFDF5" : "#FFFBEB", border: `1px solid ${isPaid ? "#A7F3D0" : "#FDE68A"}` }}>
      {isPaid ? <CheckCircle2 size={size === "lg" ? 13 : 11} color="#059669" /> : <Clock size={size === "lg" ? 13 : 11} color="#D97706" />}
      <span style={{ fontSize: fs, fontWeight: 700, color: isPaid ? "#059669" : "#D97706" }}>
        {isPaid ? t("teacherDashboard.payoutStatus.PAID") : t("teacherDashboard.payoutStatus.PENDING")}
      </span>
    </div>
  );
}

// ── Calculate action (was RecalcAction — kept the same inline-confirm shape,
//    renamed to reflect that it now creates a fresh payout for the teacher
//    rather than recalculating an existing month-wide one) ──
function CalculateAction({ confirming, calculating, onClick, onCancel, label, compact }) {
  const { t } = useLanguage();
  if (confirming) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: compact ? "1 1 auto" : undefined, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9.5, color: "#94A3B8", fontWeight: 600 }}>
          {t("teachers.payoutCard.recalcWarning")}
        </span>
        <button onClick={onClick} disabled={calculating}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 10.5, fontWeight: 700, cursor: calculating ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {calculating ? <Spinner size={10} color="#DC2626" /> : t("courses.payoutPanel.confirmPayment")}
        </button>
        <button onClick={onCancel} disabled={calculating}
          style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          {t("teachers.footer.cancel")}
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
  period, onPeriodChange, onMarkPaid, markingPaid, onCalculate, calculating,
}) {
  const { t, dir } = useLanguage();
  const locale = LOCALE_MAP[dir === "rtl" ? "ar" : "fr"];
  const currency = t("teacherDashboard.currency");
  const [confirmingCalc, setConfirmingCalc] = useState(false);

  const prevPct  = previousPercentage != null ? Number(previousPercentage) : null;
  const currPct  = parseFloat(currentPercentage);
  const changed  = prevPct != null && !isNaN(currPct) && currPct !== prevPct;
  const increased = changed && currPct > prevPct;
  const isPaid   = lastPayout?.status === "PAID";

  const handleCalcClick = () => {
    if (!confirmingCalc) { setConfirmingCalc(true); return; }
    setConfirmingCalc(false);
    onCalculate();
  };

  return (
    <div style={{ borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#F8FAFC", overflow: "hidden" }}>
      <div style={{ padding: "7px 10px", background: "#EBF4FE", borderBottom: "1.5px solid #DBEAFE", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#185FA5", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("teachers.payoutCard.title")}
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
            <p style={{ fontSize: 12, color: "#94A3B8", margin: 0, textAlign: "center" }}>{t("teachers.payoutCard.none")}</p>
            {/* Calculate now — creates a payout covering everything owed since
                this teacher's last payout, up to today. This is what handles
                the "teacher wants their money mid-month" case: hit calculate,
                review the amount below, then Mark Paid. */}
            <CalculateAction confirming={confirmingCalc} calculating={calculating} onClick={handleCalcClick} onCancel={() => setConfirmingCalc(false)} label={t("teachers.payoutCard.calculateThisMonth")} />
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
              <StatusPill isPaid={isPaid} />
              {isPaid && lastPayout.paidAt && (
                <span style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600 }}>
                  {t("teachers.payoutCard.paidOn", { date: new Date(lastPayout.paidAt).toLocaleDateString(locale) })}
                </span>
              )}
            </div>

            {/* NEW: show the exact date range this payout covers — a payout is
                no longer just "November", it might be "Nov 1 – Nov 15" */}
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8" }}>
                {formatRange(lastPayout.periodStart, lastPayout.periodEnd, locale)}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", flex: 1, minWidth: 60 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>{t("teachers.payoutCard.revenue")}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{formatDA(lastPayout.totalModuleRevenue, currency)}</span>
              </div>
              <span style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 700 }}>×</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", flex: 1, minWidth: 60 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>{t("teachers.payoutCard.appliedPercentage")}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{lastPayout.percentage != null ? `${lastPayout.percentage}%` : "—"}</span>
              </div>
              <span style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 700 }}>=</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", flex: 1, minWidth: 60 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>{t("teachers.payoutCard.payout")}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: primaryColor }}>{formatDA(lastPayout.payoutAmount, currency)}</span>
              </div>
            </div>

            <div style={{ height: 1, background: "#F1F5F9" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>{t("teachers.payoutCard.previousPercentage")}</span>
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
                  {markingPaid ? t("teachers.payoutCard.markingPaid") : t("teachers.payoutCard.markPaid")}
                </button>
              )}
              {/* Once a payout already exists for this teacher (paid or not),
                  offer "calculate" again — it'll create the NEXT payout
                  (the gap since this one), not modify this one. Most useful
                  once the current payout is already PAID and more revenue
                  has come in since. */}
              <CalculateAction confirming={confirmingCalc} calculating={calculating} onClick={handleCalcClick} onCancel={() => setConfirmingCalc(false)} label={t("courses.payoutPanel.recalculate")} compact={!isPaid} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Add Teacher Modal ─────────────────────────────────────
function AddTeacherModal({ subjects, onClose, onSaved, primaryColor }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ fullName: "", email: "", password: "Teacher@123", percentage: "20", specialization: "", bio: "", subjectId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    if (!form.fullName.trim()) return setError(t("teachers.errors.nameRequired"));
    if (!form.email.trim()) return setError(t("teachers.errors.emailRequired"));
    if (!form.password.trim()) return setError(t("teachers.errors.passwordRequired"));
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
    <ModalShell onClose={onClose} title={t("teachers.addModal.title")} subtitle={t("teachers.addModal.subtitle")} emoji="👨‍🏫">
      <FormBody form={form} setForm={setForm} subjects={subjects} showPassword={showPassword} setShowPassword={setShowPassword} primaryColor={primaryColor} isEdit={false} />
      {error && <ErrorMsg msg={error} />}
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} primaryColor={primaryColor} label={t("teachers.addModal.submit")} />
    </ModalShell>
  );
}

// ── Edit Teacher Modal ────────────────────────────────────
function EditTeacherModal({ teacher, subjects, onClose, onSaved, primaryColor }) {
  const { t } = useLanguage();
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
  const [calculating, setCalculating] = useState(false);

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
        setPayoutError(err?.response?.data?.message || t("teachers.payoutCard.loadError"));
      })
      .finally(() => { if (active) setPayoutLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, teacher.id]);

  const handleMarkPaid = async () => {
    if (!lastPayout) return;
    setMarkingPaid(true);
    try {
      const res = await teacherApi.markPayoutPaid(lastPayout.id);
      setLastPayout(res.data);
    } catch (err) {
      setPayoutError(err?.response?.data?.message || t("teachers.payoutCard.markPaidFailed"));
    } finally {
      setMarkingPaid(false);
    }
  };

  // CHANGED: was handleRecalculate() -> teacherApi.recalculatePayouts(period).
  // Now calls the per-teacher pay-now endpoint, which creates a payout for
  // whatever's owed since the teacher's last payout (handles the "teacher
  // wants their money mid-month" case directly). No period is sent — the
  // backend figures out the start date itself from payout history.
  const handleCalculate = async () => {
    setCalculating(true);
    setPayoutError("");
    try {
      const res = await teacherApi.payTeacherNow(teacher.id);
      setLastPayout(res.data);
    } catch (err) {
      setPayoutError(err?.response?.data?.message || t("courses.payoutPanel.calculateFailed"));
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) return setError(t("teachers.errors.nameRequired"));
    if (!form.email.trim()) return setError(t("teachers.errors.emailRequired"));
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
    <ModalShell onClose={onClose} title={t("teachers.editModal.title")} subtitle={t("teachers.editModal.subtitleFor", { name: teacher.fullName })} emoji="✏️">
      <FormBody
        form={form} setForm={setForm} subjects={subjects} showPassword={showPassword} setShowPassword={setShowPassword}
        primaryColor={primaryColor} isEdit={true}
        lastPayout={lastPayout} payoutLoading={payoutLoading} payoutError={payoutError}
        previousPercentage={teacher.percentage} period={period} onPeriodChange={setPeriod}
        onMarkPaid={handleMarkPaid} markingPaid={markingPaid} onCalculate={handleCalculate} calculating={calculating}
      />
      {error && <ErrorMsg msg={error} />}
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} primaryColor={primaryColor} label={t("teachers.editModal.submit")} />
    </ModalShell>
  );
}

// ── Shared modal shell ────────────────────────────────────
function ModalShell({ onClose, title, subtitle, emoji, children }) {
  const { dir } = useLanguage();
  return (
    <div className="tdb-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}>
      <div dir={dir} className="tdb-modal-shell" style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 440, border: "1.5px solid #E2E8F0", overflow: "hidden", fontFamily: "'Cairo',sans-serif", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1.5px solid #F1F5F9", background: "#FAFCFF", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#EBF4FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{emoji}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
function FormBody({
  form, setForm, subjects, showPassword, setShowPassword, primaryColor, isEdit,
  lastPayout, payoutLoading, payoutError, previousPercentage,
  period, onPeriodChange, onMarkPaid, markingPaid, onCalculate, calculating,
}) {
  const { t } = useLanguage();
  return (
    <>
      <SectionLabel>{t("teachers.form.accountSection")}</SectionLabel>

      <Field label={`${t("teachers.form.fullName")} *`}>
        <input style={inp} type="text" placeholder={t("teachers.form.fullNamePlaceholder")} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
      </Field>

      <Field label={`${t("teachers.form.email")} *`}>
        <input style={{ ...inp, direction: "ltr" }} type="email" placeholder="example@mail.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
      </Field>

      <Field label={isEdit ? t("teachers.form.newPassword") : `${t("teachers.form.password")} *`}>
        <div style={{ position: "relative" }}>
          <input style={{ ...inp, direction: "ltr", paddingLeft: 34 }} type={showPassword ? "text" : "password"} placeholder={isEdit ? t("teachers.form.passwordPlaceholderEdit") : t("teachers.form.passwordPlaceholder")} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <button onClick={() => setShowPassword((v) => !v)} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94A3B8", display: "flex", alignItems: "center" }}>
            {showPassword
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        </div>
        {!isEdit && <p style={{ fontSize: 10, color: "#94A3B8", margin: "4px 0 0" }}>{t("teachers.form.passwordNote")}</p>}
      </Field>

      <SectionLabel>{t("teachers.form.revenueSection")}</SectionLabel>

      {isEdit && (
        <PayoutInfoCard
          lastPayout={lastPayout} payoutLoading={payoutLoading} payoutError={payoutError}
          previousPercentage={previousPercentage} currentPercentage={form.percentage} primaryColor={primaryColor}
          period={period} onPeriodChange={onPeriodChange} onMarkPaid={onMarkPaid} markingPaid={markingPaid}
          onCalculate={onCalculate} calculating={calculating}
        />
      )}

      <Field label={`${t("teachers.form.percentageLabel")} *`}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input style={{ ...inp, width: 90, textAlign: "center", fontWeight: 700, fontSize: 15, color: primaryColor }} type="number" min="0" max="100" step="1" value={form.percentage} onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))} />
          <div style={{ flex: 1 }}>
            <input type="range" min="0" max="100" step="1" value={form.percentage} onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))} style={{ width: "100%", accentColor: primaryColor }} />
          </div>
        </div>
        <p style={{ fontSize: 10, color: "#94A3B8", margin: "4px 0 0" }}>{t("teachers.form.percentageNote", { pct: form.percentage || 0 })}</p>
      </Field>

      <SectionLabel>{t("teachers.form.professionalSection")}</SectionLabel>

      <Field label={t("teachers.form.subjectLabel")}>
        <select style={{ ...inp, cursor: "pointer" }} value={form.subjectId} onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}>
          <option value="">{`-- ${t("teachers.form.subjectPlaceholder")} --`}</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>

      <Field label={t("teachers.form.specializationLabel")}>
        <input style={inp} type="text" placeholder={t("teachers.form.specializationPlaceholder")} value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} />
      </Field>

      <Field label={t("teachers.form.bioLabel")}>
        <input style={inp} type="text" placeholder={t("teachers.form.bioPlaceholder")} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
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

// NEW: lightweight toast notification — replaces alert() for pay-now feedback.
// Auto-dismisses after 4s, or the user can dismiss it manually.
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const isSuccess = toast.type === "success";

  return (
    <div className="tdb-toast" style={{
      position: "fixed", bottom: 20, insetInlineEnd: 20, zIndex: 300,
      display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12,
      background: isSuccess ? "#ECFDF5" : "#FEF2F2",
      border: `1.5px solid ${isSuccess ? "#A7F3D0" : "#FECACA"}`,
      boxShadow: "0 8px 24px rgba(0,0,0,.12)", maxWidth: 340, fontFamily: "'Cairo',sans-serif",
      animation: "toastIn .2s ease-out",
    }}>
      {isSuccess ? <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} /> : <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />}
      <span style={{ fontSize: 12.5, fontWeight: 600, color: isSuccess ? "#065F46" : "#991B1B", lineHeight: 1.4 }}>{toast.message}</span>
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0, color: isSuccess ? "#059669" : "#DC2626", display: "flex" }}>
        <X size={13} />
      </button>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
function ModalFooter({ onClose, onSave, saving, primaryColor, label }) {
  const { t } = useLanguage();
  return (
    <div style={{ display: "flex", gap: 8, padding: "1rem 1.25rem", borderTop: "1.5px solid #F1F5F9", background: "#FAFCFF", flexShrink: 0 }}>
      <button onClick={onClose} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{t("teachers.footer.cancel")}</button>
      <button onClick={onSave} disabled={saving} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 9, border: "none", background: saving ? "#93B5D9" : primaryColor, color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
        {saving ? <Spinner size={13} color="#fff" /> : <Check size={13} />}
        {saving ? t("teachers.footer.saving") : label}
      </button>
    </div>
  );
}

// ── Teacher Card ──────────────────────────────────────────
function TeacherCard({ t2, subjectMap, primaryColor, isArchived, onArchive, onUnarchive, onEdit, actionId, onPayNow, payingId, confirmingPayId, onConfirmPay, onCancelPay }) {
  const { t } = useLanguage();
  const isPaying = payingId === t2.id;
  const isConfirming = confirmingPayId === t2.id;

  return (
    <div
      className="tdb-card"
      style={{
        background: isArchived ? "#FAFAFA" : "#fff", borderRadius: 14, border: `1.5px solid ${isArchived ? "#E2E8F0" : "#E8EEF6"}`,
        padding: "1.25rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8,
        transition: "border-color .15s, box-shadow .15s", position: "relative", opacity: isArchived ? 0.75 : 1,
      }}
      onMouseEnter={(e) => { if (!isArchived) { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.06)"; }}}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isArchived ? "#E2E8F0" : "#E8EEF6"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {isArchived ? (
        <button onClick={() => onUnarchive(t2.id)} disabled={actionId === t2.id} title={t("teachers.restoreTitle")}
          style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 7, border: "1px solid #D1FAE5", background: "#ECFDF5", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#059669" }}>
          {actionId === t2.id ? <Spinner size={10} color="#059669" /> : <RefreshCw size={10} />}
          {t("teachers.restore")}
        </button>
      ) : (
        <button onClick={() => onArchive(t2.id)} disabled={actionId === t2.id} title={t("teachers.archiveTitle")}
          style={{ position: "absolute", top: 10, left: 10, width: 26, height: 26, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: .6, transition: "opacity .15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = ".6")}>
          {actionId === t2.id ? <Spinner size={10} /> : <Archive size={11} color="#DC2626" />}
        </button>
      )}

      {!isArchived ? (
        <button onClick={() => onEdit(t2)} title={t("teachers.editTitle")}
          style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: .6, transition: "opacity .15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = ".6")}>
          <Pencil size={11} color="#185FA5" />
        </button>
      ) : (
        <span style={{ position: "absolute", top: 10, right: 10, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>{t("teachers.archivedBadge")}</span>
      )}

      <div style={{ width: 52, height: 52, borderRadius: "50%", background: isArchived ? "#94A3B8" : primaryColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, border: "3px solid #EBF4FE", marginTop: isArchived ? 8 : 0, flexShrink: 0 }}>
        {initials(t2.fullName)}
      </div>

      <p style={{ fontSize: 13, fontWeight: 700, color: isArchived ? "#94A3B8" : "#0F172A", margin: 0 }}>{t2.fullName}</p>

      <p style={{ fontSize: 11, color: "#64748B", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
        <BookOpen size={11} />
        {subjectMap[t2.subjectIds?.[0]] || t2.specialization || "—"}
      </p>

      {t2.specialization && (
        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 12px", borderRadius: 20, background: isArchived ? "#F1F5F9" : "#EBF4FE", color: isArchived ? "#94A3B8" : primaryColor, border: `1px solid ${isArchived ? "#E2E8F0" : "#B5D4F4"}` }}>
          {t2.specialization}
        </span>
      )}

      {t2.bio && <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, lineHeight: 1.4, textAlign: "center", maxWidth: 160 }}>{t2.bio}</p>}

      <div style={{ width: "100%", paddingTop: 10, borderTop: "1.5px solid #F1F5F9", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
          <Mail size={11} style={{ flexShrink: 0 }} />
          <span dir="ltr" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t2.email || "—"}</span>
        </div>
      </div>

      {/* NEW: Pay Now — direct pay-out trigger from the card itself, no need
          to open the edit modal. Two-step inline confirm since it moves
          money; same pattern as CalculateAction elsewhere in this file. */}
      {!isArchived && (
        isConfirming ? (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 5, paddingTop: 8, borderTop: "1.5px solid #F1F5F9" }}>
            <span style={{ fontSize: 9.5, color: "#94A3B8", fontWeight: 600 }}>{t("teachers.payoutCard.payNowConfirm")}</span>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => onConfirmPay(t2.id)} disabled={isPaying}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px 8px", borderRadius: 8, border: "1px solid #A7F3D0", background: isPaying ? "#F0FDF4" : "#ECFDF5", color: "#059669", fontSize: 10.5, fontWeight: 700, cursor: isPaying ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {isPaying ? <Spinner size={10} color="#059669" /> : <Check size={11} />}
                {t("teachers.payoutCard.confirm")}
              </button>
              <button onClick={onCancelPay} disabled={isPaying}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {t("teachers.footer.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => onPayNow(t2.id)}
            style={{ width: "100%", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #DBEAFE", background: "#EBF4FE", color: primaryColor, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = ".85")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            <Wallet size={12} />
            {t("teachers.payoutCard.payNow")}
          </button>
        )
      )}
    </div>
  );
}

// ── Payouts Tab: summary stat card ─────────────────────────
function StatCard({ icon, label, value, accent, sub }) {
  return (
    <div className="tdb-stat-card" style={{ flex: 1, minWidth: 150, background: "#fff", borderRadius: 14, border: "1.5px solid #E8EEF6", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
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

// ── Payouts Tab: table row (desktop grid + mobile card) ────
function PayoutRow({ payout, teacher, primaryColor, onMarkPaid, markingId }) {
  const { t, dir } = useLanguage();
  const locale = LOCALE_MAP[dir === "rtl" ? "ar" : "fr"];
  const currency = t("teacherDashboard.currency");
  const isPaid = payout?.status === "PAID";
  const isMarking = markingId === payout?.id;

  const MarkPaidButton = (
    isPaid ? (
      <span style={{ fontSize: 10, color: "#94A3B8" }}>
        {payout.paidAt ? new Date(payout.paidAt).toLocaleDateString(locale) : "—"}
      </span>
    ) : (
      <button onClick={() => onMarkPaid(payout)} disabled={isMarking}
        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, border: "1px solid #A7F3D0", background: isMarking ? "#F0FDF4" : "#ECFDF5", color: "#059669", fontSize: 10.5, fontWeight: 700, cursor: isMarking ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
        {isMarking ? <Spinner size={10} color="#059669" /> : <CheckCircle2 size={11} />}
        {t("teachers.payoutCard.markPaid")}
      </button>
    )
  );

  return (
    <>
      {/* Desktop: grid row, hidden below 768px via CSS */}
      <div className="payout-row-desktop" style={{ display: "grid", gridTemplateColumns: "minmax(160px,1.6fr) 1fr 0.8fr 1fr 1fr 1fr", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: primaryColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {initials(teacher?.fullName || payout?.teacherName)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {payout?.teacherName || teacher?.fullName || "—"}
            </span>
            <span style={{ fontSize: 9.5, color: "#94A3B8" }}>
              {formatRange(payout?.periodStart, payout?.periodEnd, locale)}
            </span>
          </div>
        </div>

        <span style={{ fontSize: 12, color: "#334155", textAlign: "center" }}>{formatDA(payout?.totalModuleRevenue, currency)}</span>
        <span style={{ fontSize: 12, color: "#334155", textAlign: "center", fontWeight: 600 }}>{payout?.percentage != null ? `${payout.percentage}%` : "—"}</span>
        <span style={{ fontSize: 12.5, color: primaryColor, textAlign: "center", fontWeight: 700 }}>{formatDA(payout?.payoutAmount, currency)}</span>
        <div style={{ display: "flex", justifyContent: "center" }}><StatusPill isPaid={isPaid} /></div>
        <div style={{ display: "flex", justifyContent: "center" }}>{MarkPaidButton}</div>
      </div>

      {/* Mobile: stacked card, hidden at desktop widths via CSS */}
      <div className="payout-row-mobile" style={{ display: "none", flexDirection: "column", gap: 8, padding: "12px 14px", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: primaryColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {initials(teacher?.fullName || payout?.teacherName)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {payout?.teacherName || teacher?.fullName || "—"}
              </span>
              <span style={{ fontSize: 9.5, color: "#94A3B8" }}>
                {formatRange(payout?.periodStart, payout?.periodEnd, locale)}
              </span>
            </div>
          </div>
          <StatusPill isPaid={isPaid} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, background: "#F8FAFC", borderRadius: 9, padding: "8px 10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>{t("teachers.payoutCard.revenue")}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{formatDA(payout?.totalModuleRevenue, currency)}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>{t("teachers.payoutCard.appliedPercentage")}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{payout?.percentage != null ? `${payout.percentage}%` : "—"}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>{t("teachers.payoutCard.payout")}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: primaryColor }}>{formatDA(payout?.payoutAmount, currency)}</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>{MarkPaidButton}</div>
      </div>
    </>
  );
}

// ── Payouts Tab ─────────────────────────────────────────────
// CHANGED: the school-wide "Recalculate month" bulk action is removed — there
// is no backend endpoint for it anymore (payouts are per-teacher date-range
// records, not month-wide ones). This tab is now read-only for calculation:
// it shows whatever payouts exist for the selected month (from the automatic
// monthly job and/or per-teacher "calculate" actions in each edit modal) and
// lets the admin mark any of them as paid.
function PayoutsTab({ teachers, primaryColor }) {
  const { t, dir } = useLanguage();
  const locale = LOCALE_MAP[dir === "rtl" ? "ar" : "fr"];
  const currency = t("teacherDashboard.currency");
  const [period, setPeriod] = useState(currentPeriod());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);

  const teacherMap = Object.fromEntries(teachers.map((t3) => [t3.id, t3]));

  const load = useCallback((p) => {
    setLoading(true); setError("");
    teacherApi.getPayoutSummary(p)
      .then((res) => setSummary(res.data))
      .catch((err) => { setSummary(null); setError(err?.response?.data?.message || t("courses.payoutsTab.summaryLoadError")); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(period); }, [period, load]);

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
      setError(err?.response?.data?.message || t("teachers.payoutCard.markPaidFailed"));
    } finally {
      setMarkingId(null);
    }
  };

  const payouts = summary?.payouts ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toolbar: month stepper only — bulk recalc button removed */}
      <div className="payout-toolbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1.5px solid #E8EEF6", borderRadius: 12, padding: "6px 12px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>{t("courses.payoutPanel.title")}</span>
          <MonthStepper period={period} onChange={setPeriod} size="lg" />
        </div>
        <button onClick={() => load(period)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Summary stats */}
      {!loading && summary && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatCard icon={<Users size={18} color="#185FA5" />} label={t("teachers.payoutCard.teacherCount")} value={summary.teacherCount ?? payouts.length} accent={{ bg: "#EBF4FE" }} />
          <StatCard icon={<Clock size={18} color="#D97706" />} label={t("courses.payoutsTab.duePayouts")} value={formatDA(summary.totalPayoutsDue, currency)} accent={{ bg: "#FFFBEB" }} />
          <StatCard icon={<PiggyBank size={18} color="#059669" />} label={t("teachers.payoutCard.paidThisMonth")} value={formatDA(summary.totalPayoutsPaid, currency)} accent={{ bg: "#ECFDF5" }} />
          <StatCard icon={<Landmark size={18} color="#7C3AED" />} label={t("teachers.payoutCard.totalPayouts")} value={formatDA((Number(summary.totalPayoutsDue) || 0) + (Number(summary.totalPayoutsPaid) || 0), currency)} accent={{ bg: "#F5F3FF" }} sub={formatPeriod(period, locale)} />
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
            <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>{t("teachers.payoutCard.noneForMonth", { period: formatPeriod(period, locale) })}</p>
          </div>
        ) : (
          <>
            <div className="payout-header-row" style={{ display: "grid", gridTemplateColumns: "minmax(160px,1.6fr) 1fr 0.8fr 1fr 1fr 1fr", gap: 10, padding: "10px 14px", background: "#F8FAFC", borderBottom: "1.5px solid #F1F5F9" }}>
              {[
                t("teachers.payoutCard.teacherColumn"),
                t("teachers.payoutCard.revenue"),
                t("teachers.payoutCard.appliedPercentage"),
                t("teachers.payoutCard.payout"),
                t("teachers.payoutCard.statusColumn"),
                t("teachers.payoutCard.actionColumn"),
              ].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textAlign: i === 0 ? "start" : "center", textTransform: "uppercase", letterSpacing: "0.03em" }}>{h}</span>
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
  const { t } = useLanguage();
  const tabs = [
    { id: "teachers", label: t("courses.tabs.requests") /* fallback label swapped below */, icon: <BookOpen size={14} /> },
    { id: "payouts", label: t("courses.tabs.payouts"), icon: <Wallet size={14} /> },
  ];
  // Correct the first tab's label: there's no generic "Teachers" tab-label key in the
  // teachers namespace yet, so we build it from the page context instead.
  tabs[0].label = t("sidebar.nav.teachers");
  return (
    <div className="tdb-tabswitcher" style={{ display: "inline-flex", background: "#F1F5F9", borderRadius: 11, padding: 4, gap: 2 }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: "none",
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
  const { t, dir } = useLanguage();
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
  const [payingId, setPayingId] = useState(null);
  const [confirmingPayId, setConfirmingPayId] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message } — replaces alert()

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const archived = teachers.find((t3) => t3.id === id);
      setTeachers((prev) => prev.filter((t3) => t3.id !== id));
      if (showArchived && archived) setArchivedTeachers((prev) => [{ ...archived, archived: true }, ...prev]);
    } catch (err) {
      setToast({ type: "error", message: err?.response?.data?.message || t("teachers.archiveFailed") });
    } finally {
      setActionId(null);
    }
  };

  const handleUnarchive = async (id) => {
    setActionId(id);
    try {
      await teacherApi.unarchive(id);
      const restored = archivedTeachers.find((t3) => t3.id === id);
      setArchivedTeachers((prev) => prev.filter((t3) => t3.id !== id));
      if (restored) setTeachers((prev) => [{ ...restored, archived: false }, ...prev]);
    } catch (err) {
      setToast({ type: "error", message: err?.response?.data?.message || t("teachers.restoreFailed") });
    } finally {
      setActionId(null);
    }
  };

  // NEW: pay a teacher right now, for whatever's owed since their last
  // payout (handles the "teacher wants their money mid-month" case directly
  // from the card, no need to open the edit modal). Calls the same
  // pay-now endpoint used in the edit modal's PayoutInfoCard.
  const handlePayNow = async (teacherId) => {
    setPayingId(teacherId);
    try {
      const res = await teacherApi.payTeacherNow(teacherId);
      setToast({
        type: "success",
        message: t("teachers.payoutCard.payNowSuccess", {
          amount: formatDA(res.data?.payoutAmount, t("teacherDashboard.currency")),
        }),
      });
    } catch (err) {
      setToast({
        type: "error",
        message: err?.response?.data?.message || t("courses.payoutPanel.calculateFailed"),
      });
    } finally {
      setPayingId(null);
      setConfirmingPayId(null);
    }
  };

  const handleTeacherUpdated = (updated) => {
    setTeachers((prev) => prev.map((t3) => (t3.id === updated.id ? updated : t3)));
  };

  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const displayList = showArchived ? archivedTeachers : teachers;

  return (
    <div dir={dir} className="tdb-page" style={{ padding: "1.25rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh", boxSizing: "border-box" }}>
      <ResponsiveStyles />

      {/* Header */}
      <div className="tdb-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("sidebar.nav.teachers")}</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, margin: 0 }}>
            {activeTab === "teachers" ? (loading ? "..." : t("teachers.countActive", { count: teachers.length })) : t("teacherDashboard.payouts.subtitle")}
          </p>
        </div>

        <div className="tdb-header-right" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <TabSwitcher active={activeTab} onChange={setActiveTab} primaryColor={p} />

          {activeTab === "teachers" && (
            <div className="tdb-header-btns" style={{ display: "flex", gap: 8 }}>
              <button onClick={showArchived ? loadArchived : load}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                <RefreshCw size={13} />
              </button>
              <button onClick={() => setShowArchived((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${showArchived ? "#FECACA" : "#E2E8F0"}`, background: showArchived ? "#FEF2F2" : "#fff", color: showArchived ? "#DC2626" : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                <Archive size={13} />
                {showArchived ? t("teachers.hideArchived") : t("teachers.showArchived")}
              </button>
              {!showArchived && (
                <button onClick={() => setShowAddModal(true)}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, border: "none", background: p, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = ".88")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                  <Plus size={15} /> {t("teachers.addTeacher")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {activeTab === "teachers" ? (
        <>
          {showArchived && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 14px", borderRadius: 10, background: "#FEF2F2", border: "1.5px solid #FECACA" }}>
              <Archive size={14} color="#DC2626" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#DC2626" }}>{t("teachers.archivedBanner")}</span>
            </div>
          )}

          {(loading && !showArchived) || (archivedLoading && showArchived) ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={28} /></div>
          ) : error && !showArchived ? (
            <ErrorBlock message={error} onRetry={load} />
          ) : displayList.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: "3rem", fontSize: 13 }}>
              {showArchived ? t("teachers.emptyArchived") : t("teachers.emptyActive")}
            </div>
          ) : (
            <div className="tdb-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
              {displayList.map((t3) => (
                <TeacherCard
                  key={t3.id} t2={t3} subjectMap={subjectMap} primaryColor={p} isArchived={showArchived}
                  onArchive={handleArchive} onUnarchive={handleUnarchive} onEdit={setEditingTeacher} actionId={actionId}
                  onPayNow={(id) => setConfirmingPayId(id)}
                  payingId={payingId}
                  confirmingPayId={confirmingPayId}
                  onConfirmPay={handlePayNow}
                  onCancelPay={() => setConfirmingPayId(null)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <PayoutsTab teachers={teachers} primaryColor={p} />
      )}

      {showAddModal && (
        <AddTeacherModal subjects={subjects} primaryColor={p} onClose={() => setShowAddModal(false)} onSaved={(newTeacher) => setTeachers((prev) => [newTeacher, ...prev])} />
      )}

      {editingTeacher && (
        <EditTeacherModal teacher={editingTeacher} subjects={subjects} primaryColor={p} onClose={() => setEditingTeacher(null)} onSaved={(updated) => { handleTeacherUpdated(updated); setEditingTeacher(null); }} />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}