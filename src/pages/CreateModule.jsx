import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ChevronDown, Check, ArrowRight, AlertCircle } from "lucide-react";
import api from "../api";

// ─── API calls ────────────────────────────────────────────────────────────────
const getSubjects   = ()  => api.get("/api/subjects").then(r => r.data);
// FIX 2: normalise response — handle both plain array and paginated {content:[]}
const getTeachers   = ()  => api.get("/api/teachers").then(r => r.data?.content ?? r.data ?? []);
const getClassrooms = ()  => api.get("/api/classrooms").then(r => r.data);
const postModule    = (d) => api.post("/api/modules", d).then(r => r.data);

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = [
  { value: "SATURDAY",  label: "السبت"    },
  { value: "SUNDAY",    label: "الأحد"    },
  { value: "MONDAY",    label: "الإثنين"  },
  { value: "TUESDAY",   label: "الثلاثاء" },
  { value: "WEDNESDAY", label: "الأربعاء" },
  { value: "THURSDAY",  label: "الخميس"  },
  { value: "FRIDAY",    label: "الجمعة"   },
];

const P = "#185FA5";

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
      {children} {required && <span style={{ color: "#EF4444" }}>*</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", min, max }) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min} max={max}
      style={{
        width: "100%", padding: "10px 12px", borderRadius: 10,
        border: "1.5px solid #E2E8F0", fontSize: 13, color: "#0F172A",
        fontFamily: "'Cairo',sans-serif", background: "#FAFCFF",
        outline: "none", boxSizing: "border-box",
      }}
      onFocus={e => e.target.style.borderColor = P}
      onBlur={e  => e.target.style.borderColor = "#E2E8F0"}
    />
  );
}

function Select({ value, onChange, options, placeholder, loading }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 10,
          border: `1.5px solid ${open ? P : "#E2E8F0"}`, fontSize: 13,
          fontFamily: "'Cairo',sans-serif", background: "#FAFCFF",
          color: selected ? "#0F172A" : "#94A3B8", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        <span>{loading ? "جارٍ التحميل..." : selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} color="#94A3B8"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,.12)", maxHeight: 220, overflowY: "auto",
        }}>
          {options.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 12, color: "#94A3B8", textAlign: "center" }}>
              لا توجد بيانات
            </div>
          ) : options.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: "10px 14px", cursor: "pointer", fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: o.value === value ? "#EBF4FE" : "transparent",
                color: o.value === value ? P : "#0F172A",
                borderBottom: "1px solid #F8FAFC",
                fontFamily: "'Cairo',sans-serif",
              }}
              onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "#F8FAFC"; }}
              onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}
            >
              <span>{o.label}</span>
              {o.value === value && <Check size={13} color={P} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0",
      padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Row({ children, cols = 2 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
      {children}
    </div>
  );
}

function Field({ children }) {
  return <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>;
}

// ─── Schedule Day Row ─────────────────────────────────────────────────────────
function ScheduleRow({ entry, onChange, onRemove, usedDays }) {
  const availableDays = DAYS.filter(d => !usedDays.includes(d.value) || d.value === entry.day);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto",
      gap: 10, alignItems: "end",
      padding: "12px 14px", borderRadius: 10,
      background: "#F8FAFC", border: "1.5px solid #E2E8F0",
    }}>
      <Field>
        <Label>اليوم</Label>
        <Select
          value={entry.day}
          onChange={v => onChange({ ...entry, day: v })}
          options={availableDays.map(d => ({ value: d.value, label: d.label }))}
          placeholder="اختر يوماً"
        />
      </Field>
      <Field>
        <Label>وقت البداية</Label>
        <TextInput type="time" value={entry.startTime} onChange={v => onChange({ ...entry, startTime: v })} />
      </Field>
      <Field>
        <Label>وقت النهاية</Label>
        <TextInput type="time" value={entry.endTime} onChange={v => onChange({ ...entry, endTime: v })} />
      </Field>
      <button
        type="button"
        onClick={onRemove}
        style={{
          width: 36, height: 36, borderRadius: 9, border: "1.5px solid #FECACA",
          background: "#FEF2F2", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginBottom: 0,
        }}
      >
        <Trash2 size={14} color="#EF4444" />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CreateModule() {
  const navigate = useNavigate();

  // ── dropdown data ──
  const [subjects,   setSubjects]   = useState([]);
  const [teachers,   setTeachers]   = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError,   setDataError]   = useState(null);

  // ── form state ──
  const [name,        setName]        = useState("");
  const [subjectId,   setSubjectId]   = useState("");
  const [teacherId,   setTeacherId]   = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [level,       setLevel]       = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [monthlyPrice,setMonthlyPrice]= useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd,   setPeriodEnd]   = useState("");
  const [schedules,   setSchedules]   = useState([{ day: "", startTime: "08:00", endTime: "09:30" }]);

  // ── submission ──
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  // ── load dropdowns ──
  useEffect(() => {
    Promise.all([getSubjects(), getTeachers(), getClassrooms()])
      .then(([s, t, c]) => {
        setSubjects(s?.content ?? s ?? []);
        // FIX 2: already normalised in getTeachers(), filter archived here
        setTeachers((Array.isArray(t) ? t : []).filter(tc => !tc.archived));
        setClassrooms(c?.content ?? c ?? []);
      })
      .catch(() => setDataError("فشل تحميل البيانات. أعد تحميل الصفحة."))
      .finally(() => setDataLoading(false));
  }, []);

  // subjectIds is an array (may be empty [] for unassigned teachers)
  // - No subject selected → show all teachers
  // - Subject selected → show teachers linked to it OR unassigned ones (subjectIds: [])
  const teacherOptions = teachers
    .filter(t => {
      if (!subjectId) return true;
      if (!t.subjectIds?.length) return true;              // unassigned → always visible
      return t.subjectIds.includes(Number(subjectId));     // linked to this subject
    })
    .map(t => ({ value: String(t.id), label: `${t.fullName}${t.specialization ? " — " + t.specialization : ""}` }));

  const subjectOptions   = subjects.map(s => ({ value: String(s.id), label: s.name }));
  const classroomOptions = classrooms.map(c => ({ value: String(c.id), label: `${c.name} (${c.capacity} طالب)` }));

  // ── schedule helpers ──
  const usedDays = schedules.map(s => s.day);

  const addScheduleRow = () => {
    if (schedules.length >= 7) return;
    setSchedules(prev => [...prev, { day: "", startTime: "08:00", endTime: "09:30" }]);
  };

  const updateScheduleRow = (idx, updated) => {
    setSchedules(prev => prev.map((s, i) => i === idx ? updated : s));
  };

  const removeScheduleRow = (idx) => {
    setSchedules(prev => prev.filter((_, i) => i !== idx));
  };

  // ── validation ──
  const validate = () => {
    if (!name.trim())    return "أدخل اسم الوحدة";
    if (!subjectId)      return "اختر المادة الدراسية";
    if (!teacherId)      return "اختر الأستاذ";
    if (!classroomId)    return "اختر الفصل";
    if (!level.trim())   return "أدخل المستوى";
    if (!maxStudents || Number(maxStudents) < 1) return "أدخل الحد الأقصى للطلاب";
    if (!periodStart)    return "أدخل تاريخ بداية الفترة";
    if (!periodEnd)      return "أدخل تاريخ نهاية الفترة";
    if (periodStart >= periodEnd) return "تاريخ البداية يجب أن يكون قبل تاريخ النهاية";
    if (schedules.length === 0) return "أضف يوماً دراسياً على الأقل";
    for (const s of schedules) {
      if (!s.day)                     return "اختر اليوم لكل صف في الجدول";
      if (!s.startTime || !s.endTime) return "أدخل الوقت لكل صف في الجدول";
      if (s.startTime >= s.endTime)   return "وقت البداية يجب أن يكون قبل وقت النهاية";
    }
    return null;
  };

  // ── submit ──
  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setSaving(true);
    try {
      await postModule({
        name:        name.trim(),
        subjectId:   Number(subjectId),
        teacherId:   Number(teacherId),
        classroomId: Number(classroomId),
        level:       level.trim(),
        maxStudents: Number(maxStudents),
        monthlyprice: monthlyPrice ? Number(monthlyPrice) : null,
        periodStart,
        periodEnd,
        schedules: schedules.map(s => ({
          day:       s.day,
          startTime: s.startTime + ":00",
          endTime:   s.endTime   + ":00",
        })),
      });
      setSuccess(true);
      setTimeout(() => navigate("/schedule"), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data || "فشل إنشاء الوحدة. تحقق من البيانات.");
    } finally {
      setSaving(false);
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────
  if (dataLoading) {
    return (
      <div dir="rtl" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontFamily: "'Cairo',sans-serif" }}>
        <div style={{ textAlign: "center", color: "#94A3B8" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${P}`, borderTopColor: "transparent", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 13 }}>جارٍ تحميل البيانات...</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div dir="rtl" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontFamily: "'Cairo',sans-serif" }}>
        <div style={{ textAlign: "center", color: "#EF4444" }}>
          <AlertCircle size={36} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13 }}>{dataError}</div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ArrowRight size={16} color="#64748B" />
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>إنشاء وحدة دراسية جديدة</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: "3px 0 0" }}>
            سيتم توليد جميع الحصص تلقائياً بناءً على الجدول والفترة الزمنية
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 780 }}>

        {/* ── Basic Info ── */}
        <SectionCard title="المعلومات الأساسية" subtitle="اسم الوحدة والمستوى الدراسي">
          <Row cols={2}>
            <Field>
              <Label required>اسم الوحدة</Label>
              <TextInput value={name} onChange={setName} placeholder="مثال: Math 3ème - Group A" />
            </Field>
            <Field>
              <Label required>المستوى الدراسي</Label>
              <TextInput value={level} onChange={setLevel} placeholder="مثال: 3ème, 2AS, 1ère..." />
            </Field>
          </Row>
          <Row cols={2}>
            <Field>
              <Label required>الحد الأقصى للطلاب</Label>
              <TextInput type="number" value={maxStudents} onChange={setMaxStudents} placeholder="مثال: 25" min="1" />
            </Field>
            <Field>
              <Label>السعر الشهري (دج)</Label>
              <TextInput type="number" value={monthlyPrice} onChange={setMonthlyPrice} placeholder="اختياري" min="0" />
            </Field>
          </Row>
        </SectionCard>

        {/* ── Assignment ── */}
        <SectionCard title="التخصيص" subtitle="المادة، الأستاذ، والفصل الدراسي">
          <Field>
            <Label required>المادة الدراسية</Label>
            <Select
              value={subjectId}
              onChange={v => { setSubjectId(v); setTeacherId(""); }}
              options={subjectOptions}
              placeholder="اختر المادة..."
            />
          </Field>
          <Field>
            <Label required>الأستاذ</Label>
            <Select
              value={teacherId}
              onChange={setTeacherId}
              options={teacherOptions}
              placeholder="اختر الأستاذ..."
            />
          </Field>
          <Field>
            <Label required>الفصل الدراسي</Label>
            <Select
              value={classroomId}
              onChange={setClassroomId}
              options={classroomOptions}
              placeholder="اختر الفصل..."
            />
          </Field>
        </SectionCard>

        {/* ── Period ── */}
        <SectionCard title="الفترة الزمنية" subtitle="بداية ونهاية الوحدة الدراسية — ستُولَّد الحصص تلقائياً لكل هذه الفترة">
          <Row cols={2}>
            <Field>
              <Label required>تاريخ البداية</Label>
              <TextInput type="date" value={periodStart} onChange={setPeriodStart} />
            </Field>
            <Field>
              <Label required>تاريخ النهاية</Label>
              <TextInput type="date" value={periodEnd} onChange={v => { setPeriodEnd(v); }} min={periodStart} />
            </Field>
          </Row>
          {periodStart && periodEnd && periodStart < periodEnd && (
            <div style={{ fontSize: 12, color: "#0F6E56", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 9, padding: "8px 13px" }}>
              ✓ مدة الوحدة:{" "}
              {Math.ceil((new Date(periodEnd) - new Date(periodStart)) / (1000 * 60 * 60 * 24 * 7))} أسبوع تقريباً
            </div>
          )}
        </SectionCard>

        {/* ── Schedule ── */}
        <SectionCard title="الجدول الأسبوعي" subtitle="حدد أيام وأوقات الحصص الأسبوعية">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {schedules.map((entry, idx) => (
              <ScheduleRow
                key={idx}
                entry={entry}
                onChange={updated => updateScheduleRow(idx, updated)}
                onRemove={() => removeScheduleRow(idx)}
                usedDays={usedDays}
              />
            ))}
          </div>
          {schedules.length < 7 && (
            <button
              type="button"
              onClick={addScheduleRow}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 14px", borderRadius: 10,
                border: `1.5px dashed ${P}`, background: "#EBF4FE",
                color: P, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Cairo',sans-serif",
                width: "fit-content",
              }}
            >
              <Plus size={14} /> إضافة يوم آخر
            </button>
          )}
        </SectionCard>

        {/* ── Error ── */}
        {error && (
          <div style={{
            fontSize: 13, color: "#DC2626", background: "#FEF2F2",
            border: "1.5px solid #FECACA", borderRadius: 10, padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* ── Submit ── */}
        <div style={{ display: "flex", gap: 10, paddingBottom: "2rem" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              flex: 1, padding: "12px", borderRadius: 12,
              border: "1.5px solid #E2E8F0", background: "#fff",
              color: "#64748B", fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Cairo',sans-serif",
            }}
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || success}
            style={{
              flex: 3, padding: "12px", borderRadius: 12, border: "none",
              background: success ? "#10B981" : saving ? "#94A3B8" : P,
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: saving || success ? "default" : "pointer",
              fontFamily: "'Cairo',sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background .3s",
            }}
          >
            {success ? (
              <><Check size={16} /> تم إنشاء الوحدة بنجاح! جارٍ التحويل...</>
            ) : saving ? (
              <>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", animation: "spin .8s linear infinite" }} />
                جارٍ الحفظ...
              </>
            ) : (
              <><Plus size={16} /> إنشاء الوحدة الدراسية</>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}