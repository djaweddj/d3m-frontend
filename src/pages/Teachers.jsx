import { useState, useEffect, useCallback } from "react";
import { Plus, Mail, BookOpen, RefreshCw, AlertCircle, X, Check, Archive, Pencil, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "../context/authContext";
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
  getLatestPayout: (id)       => api.get(`api/payouts/teacher/${id}/latest`),
};

// ── Helpers ───────────────────────────────────────────────
function formatDA(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 2 }).format(amount) + " د.ج";
}

function formatPeriod(period) {
  if (!period) return "—";
  // period comes as "2025-06" from YearMonth serialization
  try {
    const [year, month] = String(period).split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("ar-DZ", { month: "long", year: "numeric" });
  } catch {
    return String(period);
  }
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
function Spinner({ size = 20 }) {
  return (
    <>
      <div style={{ width: size, height: size, borderRadius: "50%", border: "2px solid #185FA5", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

// ── Error Block ───────────────────────────────────────────
function ErrorBlock({ message, onRetry }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "2rem" }}>
      <AlertCircle size={32} color="#E2A84B" />
      <p style={{ color: "#64748B", fontSize: 13 }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1.5px solid #185FA5", background: "#EBF4FE", color: "#185FA5", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          <RefreshCw size={13} /> إعادة المحاولة
        </button>
      )}
    </div>
  );
}

// ── Add Teacher Modal ─────────────────────────────────────
function AddTeacherModal({ subjects, onClose, onSaved, primaryColor }) {
  const [form, setForm] = useState({
    fullName: "", email: "", password: "Teacher@123",
    percentage: "20", specialization: "", bio: "", subjectId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    if (!form.fullName.trim()) return setError("الاسم مطلوب");
    if (!form.email.trim())    return setError("البريد الإلكتروني مطلوب");
    if (!form.password.trim()) return setError("كلمة المرور مطلوبة");
    const pct = parseFloat(form.percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) return setError("النسبة يجب أن تكون بين 0 و 100");

    setSaving(true); setError("");
    try {
      const res = await teacherApi.create({
        fullName: form.fullName, email: form.email, password: form.password,
        percentage: pct, specialization: form.specialization,
        bio: form.bio, subjectId: form.subjectId ? Number(form.subjectId) : null,
      });
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="إضافة أستاذ جديد" subtitle="سيتم إنشاء حساب للأستاذ تلقائياً" emoji="👨‍🏫">
      <FormBody
        form={form} setForm={setForm} subjects={subjects}
        showPassword={showPassword} setShowPassword={setShowPassword}
        primaryColor={primaryColor} isEdit={false}
      />
      {error && <ErrorMsg msg={error} />}
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} primaryColor={primaryColor} label="إضافة الأستاذ" />
    </ModalShell>
  );
}

// ── Edit Teacher Modal ────────────────────────────────────
function EditTeacherModal({ teacher, subjects, onClose, onSaved, primaryColor }) {
  const [form, setForm] = useState({
    fullName:       teacher.fullName       || "",
    email:          teacher.email          || "",
    password:       "",
    percentage:     teacher.percentage != null ? String(teacher.percentage) : "0",
    specialization: teacher.specialization || "",
    bio:            teacher.bio            || "",
    subjectId:      teacher.subjectIds?.[0] != null ? String(teacher.subjectIds[0]) : "",
  });
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [lastPayout, setLastPayout]       = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setPayoutLoading(true);
    teacherApi.getLatestPayout(teacher.id)
      .then((res) => { if (active) setLastPayout(res.data ?? null); })
      .catch(() => { if (active) setLastPayout(null); })
      .finally(() => { if (active) setPayoutLoading(false); });
    return () => { active = false; };
  }, [teacher.id]);

  const handleSave = async () => {
    if (!form.fullName.trim()) return setError("الاسم مطلوب");
    if (!form.email.trim())    return setError("البريد الإلكتروني مطلوب");
    const pct = parseFloat(form.percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) return setError("النسبة يجب أن تكون بين 0 و 100");

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
      setError(err?.response?.data?.message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="تعديل بيانات الأستاذ" subtitle={`تعديل بيانات ${teacher.fullName}`} emoji="✏️">
      <FormBody
        form={form} setForm={setForm} subjects={subjects}
        showPassword={showPassword} setShowPassword={setShowPassword}
        primaryColor={primaryColor} isEdit={true}
        lastPayout={lastPayout} payoutLoading={payoutLoading}
        previousPercentage={teacher.percentage}
      />
      {error && <ErrorMsg msg={error} />}
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} primaryColor={primaryColor} label="حفظ التعديلات" />
    </ModalShell>
  );
}

// ── Payout Info Card (edit modal only) ───────────────────
function PayoutInfoCard({ lastPayout, payoutLoading, previousPercentage, currentPercentage, primaryColor }) {
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
          آخر دفعة محسوبة
        </span>
        {lastPayout && !payoutLoading && (
          <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>
            {formatPeriod(lastPayout.period)}
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
            لا توجد دفعات محسوبة بعد
          </p>
        ) : (
          <>
            {/* Breakdown row: revenue × % = payout */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>

              {/* Revenue */}
              <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>إيرادات الموديولات</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                  {formatDA(lastPayout.totalModuleRevenue)}
                </span>
              </div>

              {/* × */}
              <span style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 700 }}>×</span>

              {/* Percentage used */}
              <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>النسبة المطبّقة</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                  {lastPayout.percentage != null ? `${lastPayout.percentage}%` : "—"}
                </span>
              </div>

              {/* = */}
              <span style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 700 }}>=</span>

              {/* Payout amount */}
              <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>الدفعة</span>
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
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>النسبة السابقة</span>
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

// ── Shared modal shell ────────────────────────────────────
function ModalShell({ onClose, title, subtitle, emoji, children }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}
    >
      <div dir="rtl" style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 440, border: "1.5px solid #E2E8F0", overflow: "hidden", fontFamily: "'Cairo',sans-serif", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
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
        {/* Scrollable body */}
        <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 11, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Shared form body ──────────────────────────────────────
function FormBody({ form, setForm, subjects, showPassword, setShowPassword, primaryColor, isEdit, lastPayout, payoutLoading, previousPercentage }) {
  return (
    <>
      {/* Section: Account Info */}
      <SectionLabel>معلومات الحساب</SectionLabel>

      <Field label="الاسم الكامل *">
        <input style={inp} type="text" placeholder="اسم الأستاذ"
          value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
      </Field>

      <Field label="البريد الإلكتروني *">
        <input style={{ ...inp, direction: "ltr" }} type="email" placeholder="example@mail.com"
          value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
      </Field>

      <Field label={isEdit ? "كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)" : "كلمة المرور *"}>
        <div style={{ position: "relative" }}>
          <input
            style={{ ...inp, direction: "ltr", paddingLeft: 34 }}
            type={showPassword ? "text" : "password"}
            placeholder={isEdit ? "اترك فارغاً إن لم ترد تغييرها" : "كلمة المرور"}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <button
            onClick={() => setShowPassword((v) => !v)}
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94A3B8", display: "flex", alignItems: "center" }}
          >
            {showPassword
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        </div>
        {!isEdit && <p style={{ fontSize: 10, color: "#94A3B8", margin: "4px 0 0" }}>سيستخدم الأستاذ هذه البيانات لتسجيل الدخول</p>}
      </Field>

      {/* Section: Revenue */}
      <SectionLabel>النسبة والدفعات</SectionLabel>

      {/* Payout info card — edit mode only, shown ABOVE the percentage slider */}
      {isEdit && (
        <PayoutInfoCard
          lastPayout={lastPayout}
          payoutLoading={payoutLoading}
          previousPercentage={previousPercentage}
          currentPercentage={form.percentage}
          primaryColor={primaryColor}
        />
      )}

      <Field label="نسبة الأستاذ من الإيرادات (%) *">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            style={{ ...inp, width: 90, textAlign: "center", fontWeight: 700, fontSize: 15, color: primaryColor }}
            type="number" min="0" max="100" step="1"
            value={form.percentage}
            onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))}
          />
          <div style={{ flex: 1 }}>
            <input
              type="range" min="0" max="100" step="1"
              value={form.percentage}
              onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))}
              style={{ width: "100%", accentColor: primaryColor }}
            />
          </div>
        </div>
        <p style={{ fontSize: 10, color: "#94A3B8", margin: "4px 0 0" }}>
          الأستاذ سيحصل على {form.percentage || 0}% من إيرادات موديولاته
        </p>
      </Field>

      {/* Section: Professional Info */}
      <SectionLabel>المعلومات المهنية</SectionLabel>

      <Field label="المادة الدراسية">
        <select style={{ ...inp, cursor: "pointer" }} value={form.subjectId}
          onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}>
          <option value="">-- اختر مادة --</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>

      <Field label="التخصص">
        <input style={inp} type="text" placeholder="مثال: رياضيات تطبيقية"
          value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} />
      </Field>

      <Field label="نبذة مختصرة">
        <input style={inp} type="text" placeholder="وصف قصير عن الأستاذ"
          value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
      </Field>
    </>
  );
}

// ── Tiny helpers ──────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: 4, borderBottom: "1px solid #F1F5F9" }}>
      {children}
    </div>
  );
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
  return (
    <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "7px 12px" }}>
      ⚠️ {msg}
    </div>
  );
}
function ModalFooter({ onClose, onSave, saving, primaryColor, label }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "1rem 1.25rem", borderTop: "1.5px solid #F1F5F9", background: "#FAFCFF", flexShrink: 0 }}>
      <button onClick={onClose} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
        إلغاء
      </button>
      <button
        onClick={onSave} disabled={saving}
        style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 9, border: "none", background: saving ? "#93B5D9" : primaryColor, color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
      >
        {saving ? <Spinner size={13} /> : <Check size={13} />}
        {saving ? "جارٍ الحفظ..." : label}
      </button>
    </div>
  );
}

// ── Teacher Card ──────────────────────────────────────────
function TeacherCard({ t, subjectMap, primaryColor, isArchived, onArchive, onUnarchive, onEdit, actionId }) {
  return (
    <div
      style={{
        background: isArchived ? "#FAFAFA" : "#fff",
        borderRadius: 14,
        border: `1.5px solid ${isArchived ? "#E2E8F0" : "#E8EEF6"}`,
        padding: "1.25rem 1rem",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", gap: 8,
        transition: "border-color .15s, box-shadow .15s",
        position: "relative",
        opacity: isArchived ? 0.75 : 1,
      }}
      onMouseEnter={(e) => { if (!isArchived) { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.06)"; }}}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isArchived ? "#E2E8F0" : "#E8EEF6"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Top-left: archive / unarchive */}
      {isArchived ? (
        <button
          onClick={() => onUnarchive(t.id)} disabled={actionId === t.id}
          title="استعادة الأستاذ"
          style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 7, border: "1px solid #D1FAE5", background: "#ECFDF5", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#059669" }}
        >
          {actionId === t.id ? <Spinner size={10} /> : <RefreshCw size={10} />}
          استعادة
        </button>
      ) : (
        <button
          onClick={() => onArchive(t.id)} disabled={actionId === t.id}
          title="أرشفة الأستاذ"
          style={{ position: "absolute", top: 10, left: 10, width: 26, height: 26, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: .6, transition: "opacity .15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = ".6")}
        >
          {actionId === t.id ? <Spinner size={10} /> : <Archive size={11} color="#DC2626" />}
        </button>
      )}

      {/* Top-right: edit (active only) or archived badge */}
      {!isArchived ? (
        <button
          onClick={() => onEdit(t)}
          title="تعديل بيانات الأستاذ"
          style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: .6, transition: "opacity .15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = ".6")}
        >
          <Pencil size={11} color="#185FA5" />
        </button>
      ) : (
        <span style={{ position: "absolute", top: 10, right: 10, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          مؤرشف
        </span>
      )}

      {/* Avatar */}
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

      {t.bio && (
        <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, lineHeight: 1.4, textAlign: "center", maxWidth: 160 }}>
          {t.bio}
        </p>
      )}

      <div style={{ width: "100%", paddingTop: 10, borderTop: "1.5px solid #F1F5F9", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
          <Mail size={11} style={{ flexShrink: 0 }} />
          <span dir="ltr" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {t.email || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function Teachers() {
  const { school } = useAuth();
  const p = school?.primaryColor || "#185FA5";

  const [teachers,         setTeachers]       = useState([]);
  const [archivedTeachers, setArchivedTeachers] = useState([]);
  const [subjects,         setSubjects]       = useState([]);
  const [loading,          setLoading]        = useState(true);
  const [archivedLoading,  setArchivedLoading] = useState(false);
  const [error,            setError]          = useState(null);
  const [showAddModal,     setShowAddModal]   = useState(false);
  const [editingTeacher,   setEditingTeacher] = useState(null);
  const [showArchived,     setShowArchived]   = useState(false);
  const [actionId,         setActionId]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [tRes, sRes] = await Promise.all([teacherApi.getAll(), teacherApi.getSubjects()]);
      setTeachers(tRes.data?.content ?? tRes.data ?? []);
      setSubjects(sRes.data?.content ?? sRes.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
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
      const archived = teachers.find((t) => t.id === id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      if (showArchived && archived) setArchivedTeachers((prev) => [{ ...archived, archived: true }, ...prev]);
    } catch (err) {
      alert(err?.response?.data?.message || "فشلت الأرشفة");
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
      alert(err?.response?.data?.message || "فشلت الاستعادة");
    } finally {
      setActionId(null);
    }
  };

  const handleTeacherUpdated = (updated) => {
    setTeachers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const subjectMap  = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const displayList = showArchived ? archivedTeachers : teachers;

  return (
    <div dir="rtl" style={{ padding: "1.25rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>الأساتذة</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, margin: 0 }}>
            {loading ? "..." : `${teachers.length} أستاذ نشط`}
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
            {showArchived ? "إخفاء المؤرشفين" : "الأساتذة المؤرشفون"}
          </button>
          {!showArchived && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, border: "none", background: p, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = ".88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Plus size={15} /> إضافة أستاذ
            </button>
          )}
        </div>
      </div>

      {/* Archived banner */}
      {showArchived && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 14px", borderRadius: 10, background: "#FEF2F2", border: "1.5px solid #FECACA" }}>
          <Archive size={14} color="#DC2626" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#DC2626" }}>
            الأساتذة المؤرشفون — يمكنك استعادة أي أستاذ بالضغط على "استعادة"
          </span>
        </div>
      )}

      {/* Body */}
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
            <TeacherCard
              key={t.id} t={t} subjectMap={subjectMap}
              primaryColor={p} isArchived={showArchived}
              onArchive={handleArchive} onUnarchive={handleUnarchive}
              onEdit={setEditingTeacher} actionId={actionId}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddTeacherModal
          subjects={subjects} primaryColor={p}
          onClose={() => setShowAddModal(false)}
          onSaved={(newTeacher) => setTeachers((prev) => [newTeacher, ...prev])}
        />
      )}

      {/* Edit Modal */}
      {editingTeacher && (
        <EditTeacherModal
          teacher={editingTeacher} subjects={subjects} primaryColor={p}
          onClose={() => setEditingTeacher(null)}
          onSaved={(updated) => { handleTeacherUpdated(updated); setEditingTeacher(null); }}
        />
      )}
    </div>
  );
}