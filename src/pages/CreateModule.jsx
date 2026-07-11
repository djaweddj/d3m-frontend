import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ChevronDown, Check, ArrowRight, AlertCircle, Calendar, CreditCard } from "lucide-react";
import api from "../api";

const getSubjects   = ()  => api.get("/api/subjects").then(r => r.data);
const getTeachers   = ()  => api.get("/api/teachers").then(r => r.data?.content ?? r.data ?? []);
const getClassrooms = ()  => api.get("/api/classrooms").then(r => r.data);
const postModule    = (d) => api.post("/api/modules", d).then(r => r.data);

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

function Label({ children, required }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
      {children} {required && <span style={{ color: "#EF4444" }}>*</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", min, disabled }) {
  return (
    <input
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min} disabled={disabled}
      style={{
        width: "100%", padding: "10px 12px", borderRadius: 10,
        border: "1.5px solid #E2E8F0", fontSize: 13, color: "#0F172A",
        fontFamily: "'Cairo',sans-serif",
        background: disabled ? "#F1F5F9" : "#FAFCFF",
        outline: "none", boxSizing: "border-box",
        opacity: disabled ? 0.6 : 1,
      }}
      onFocus={e => !disabled && (e.target.style.borderColor = P)}
      onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(p => !p)}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 10,
          border: `1.5px solid ${open ? P : "#E2E8F0"}`, fontSize: 13,
          fontFamily: "'Cairo',sans-serif", background: "#FAFCFF",
          color: selected ? "#0F172A" : "#94A3B8", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxSizing: "border-box",
        }}>
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} color="#94A3B8"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
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
            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: "10px 14px", cursor: "pointer", fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: o.value === value ? "#EBF4FE" : "transparent",
                color: o.value === value ? P : "#0F172A",
                borderBottom: "1px solid #F8FAFC", fontFamily: "'Cairo',sans-serif",
              }}
              onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "#F8FAFC"; }}
              onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}>
              <span>{o.label}</span>
              {o.value === value && <Check size={13} color={P} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, children, icon: Icon }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0",
      padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {Icon && (
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#EBF4FE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={15} color={P} />
          </div>
        )}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>{subtitle}</div>}
        </div>
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

function PricingModelCard({ value, current, onClick, title, desc, icon: Icon, example }) {
  const isSelected = current === value;
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: "16px 18px", borderRadius: 12, cursor: "pointer",
      border: isSelected ? `2px solid ${P}` : "1.5px solid #E2E8F0",
      background: isSelected ? "#EBF4FE" : "#fff",
      transition: "all .15s", position: "relative",
    }}>
      {isSelected && (
        <div style={{
          position: "absolute", top: 12, left: 12,
          width: 20, height: 20, borderRadius: "50%",
          background: P, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Check size={11} color="#fff" />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Icon size={16} color={isSelected ? P : "#64748B"} />
        <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? P : "#0F172A" }}>{title}</span>
      </div>
      <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6, margin: "0 0 8px" }}>{desc}</p>
      <div style={{
        fontSize: 10, color: isSelected ? P : "#94A3B8",
        background: isSelected ? "rgba(24,95,165,.08)" : "#F8FAFC",
        padding: "5px 9px", borderRadius: 7,
        border: `1px dashed ${isSelected ? "#B5D4F4" : "#E2E8F0"}`,
      }}>
        {example}
      </div>
    </div>
  );
}

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
        <Select value={entry.day} onChange={v => onChange({ ...entry, day: v })}
          options={availableDays.map(d => ({ value: d.value, label: d.label }))}
          placeholder="اختر يوماً" />
      </Field>
      <Field>
        <Label>وقت البداية</Label>
        <TextInput type="time" value={entry.startTime} onChange={v => onChange({ ...entry, startTime: v })} />
      </Field>
      <Field>
        <Label>وقت النهاية</Label>
        <TextInput type="time" value={entry.endTime} onChange={v => onChange({ ...entry, endTime: v })} />
      </Field>
      <button type="button" onClick={onRemove}
        style={{
          width: 36, height: 36, borderRadius: 9, border: "1.5px solid #FECACA",
          background: "#FEF2F2", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
        <Trash2 size={14} color="#EF4444" />
      </button>
    </div>
  );
}

export default function CreateModule() {
  const navigate = useNavigate();

  const [subjects,    setSubjects]    = useState([]);
  const [teachers,    setTeachers]    = useState([]);
  const [classrooms,  setClassrooms]  = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError,   setDataError]   = useState(null);

  const [name,           setName]           = useState("");
  const [subjectId,      setSubjectId]      = useState("");
  const [teacherId,      setTeacherId]      = useState("");
  const [classroomId,    setClassroomId]    = useState("");
  const [level,          setLevel]          = useState("");
  const [maxStudents,    setMaxStudents]    = useState("");
  const [pricingModel,   setPricingModel]   = useState("MONTHLY_FLAT");
  const [monthlyPrice,   setMonthlyPrice]   = useState("");
  const [pricePerSession,setPricePerSession]= useState("");
  const [periodStart,    setPeriodStart]    = useState("");
  const [periodEnd,      setPeriodEnd]      = useState("");
  const [schedules,      setSchedules]      = useState([{ day: "", startTime: "08:00", endTime: "09:30" }]);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState(null);
  const [success,        setSuccess]        = useState(false);
  
const [customLevel, setCustomLevel] = useState("");

const levels = [
  "التحضيري",
  "السنة الأولى ابتدائي",
  "السنة الثانية ابتدائي",
  "السنة الثالثة ابتدائي",
  "السنة الرابعة ابتدائي",
  "السنة الخامسة ابتدائي",
  "السنة الأولى متوسط",
  "السنة الثانية متوسط",
  "السنة الثالثة متوسط",
  "السنة الرابعة متوسط",
  "السنة الأولى ثانوي",
  "السنة الثانية ثانوي",
  "السنة الثالثة ثانوي (البكالوريا)",
  "مستوى آخر...",
];

  useEffect(() => {
    Promise.all([getSubjects(), getTeachers(), getClassrooms()])
      .then(([s, t, c]) => {
        setSubjects(s?.content ?? s ?? []);
        setTeachers((Array.isArray(t) ? t : []).filter(tc => !tc.archived));
        setClassrooms(c?.content ?? c ?? []);
      })
      .catch(() => setDataError("فشل تحميل البيانات. أعد تحميل الصفحة."))
      .finally(() => setDataLoading(false));
  }, []);

  const teacherOptions = teachers
    .filter(t => !subjectId || !t.subjectIds?.length || t.subjectIds.includes(Number(subjectId)))
    .map(t => ({ value: String(t.id), label: `${t.fullName}${t.specialization ? " — " + t.specialization : ""}` }));

  const subjectOptions   = subjects.map(s => ({ value: String(s.id), label: s.name }));
  const classroomOptions = classrooms.map(c => ({ value: String(c.id), label: `${c.name} (${c.capacity} طالب)` }));

  const usedDays = schedules.map(s => s.day);
  const weeklySessionCount = schedules.filter(s => s.day).length;
  const estimatedMonthly =
    pricingModel === "PER_SESSION" && pricePerSession && weeklySessionCount > 0
      ? Math.round(Number(pricePerSession) * weeklySessionCount * 4.3)
      : null;

  const validate = () => {
    if (!name.trim())    return "أدخل اسم الوحدة";
    if (!subjectId)      return "اختر المادة الدراسية";
    if (!teacherId)      return "اختر الأستاذ";
    if (!classroomId)    return "اختر الفصل";
    if (!level.trim())   return "أدخل المستوى";
    if (!maxStudents || Number(maxStudents) < 1) return "أدخل الحد الأقصى للطلاب";
    if (pricingModel === "MONTHLY_FLAT" && (!monthlyPrice || Number(monthlyPrice) <= 0))
      return "أدخل السعر الشهري";
    if (pricingModel === "PER_SESSION" && (!pricePerSession || Number(pricePerSession) <= 0))
      return "أدخل سعر الحصة الواحدة";
    if (!periodStart)    return "أدخل تاريخ بداية الفترة";
    if (!periodEnd)      return "أدخل تاريخ نهاية الفترة";
    if (periodStart >= periodEnd) return "تاريخ البداية يجب أن يكون قبل تاريخ النهاية";
    if (schedules.length === 0)   return "أضف يوماً دراسياً على الأقل";
    for (const s of schedules) {
      if (!s.day)                     return "اختر اليوم لكل صف في الجدول";
      if (!s.startTime || !s.endTime) return "أدخل الوقت لكل صف في الجدول";
      if (s.startTime >= s.endTime)   return "وقت البداية يجب أن يكون قبل وقت النهاية";
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null); setSaving(true);
    try {
      await postModule({
        name:           name.trim(),
        subjectId:      Number(subjectId),
        teacherId:      Number(teacherId),
        classroomId:    Number(classroomId),
        level:          "مستوى آخر..." ? customLevel : level,
        maxStudents:    Number(maxStudents),
        pricingModel,
        monthlyprice:    pricingModel === "MONTHLY_FLAT" ? Number(monthlyPrice)    : null,
        pricePerSession: pricingModel === "PER_SESSION"  ? Number(pricePerSession) : null,
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
      setError(err?.response?.data?.message || "فشل إنشاء الوحدة. تحقق من البيانات.");
    } finally { setSaving(false); }
  };

  if (dataLoading) return (
    <div dir="rtl" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontFamily: "'Cairo',sans-serif" }}>
      <div style={{ textAlign: "center", color: "#94A3B8" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${P}`, borderTopColor: "transparent", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 13 }}>جارٍ تحميل البيانات...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (dataError) return (
    <div dir="rtl" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontFamily: "'Cairo',sans-serif" }}>
      <div style={{ textAlign: "center", color: "#EF4444" }}>
        <AlertCircle size={36} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 13 }}>{dataError}</div>
      </div>
    </div>
  );

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
        <button onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
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

        {/* Basic Info */}
        <SectionCard title="المعلومات الأساسية" subtitle="اسم الوحدة والمستوى الدراسي">
          <Row cols={2}>
            <Field>
              <Label required>اسم الوحدة</Label>
              <TextInput value={name} onChange={setName} placeholder="مثال: Math 3ème - Group A" />
            </Field>
           <Field>
  <Label required>المستوى الدراسي</Label>

  <select
    value={level}
    onChange={(e) => {
      setLevel(e.target.value);

      // Clear custom value if another option is selected
      if (e.target.value !== "مستوى آخر...") {
        setCustomLevel("");
      }
    }}
    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">اختر المستوى الدراسي</option>

    {levels.map((item) => (
      <option key={item} value={item}>
        {item}
      </option>
    ))}
  </select>

  {level === "مستوى آخر..." && (
    <div className="mt-3">
      <TextInput
        value={customLevel}
        onChange={setCustomLevel}
        placeholder="أدخل المستوى الدراسي"
      />
    </div>
  )}
</Field>
          </Row>
          <Row cols={1}>
            <Field>
              <Label required>الحد الأقصى للطلاب</Label>
              <TextInput type="number" value={maxStudents} onChange={setMaxStudents} placeholder="مثال: 25" min="1" />
            </Field>
          </Row>
        </SectionCard>

        {/* Pricing Model */}
        <SectionCard title="نظام الدفع" subtitle="اختر كيفية احتساب رسوم هذه الوحدة على الطلاب" icon={CreditCard}>
          <div style={{ display: "flex", gap: 12 }}>
            <PricingModelCard
              value="MONTHLY_FLAT" current={pricingModel}
              onClick={() => setPricingModel("MONTHLY_FLAT")}
              icon={Calendar}
              title="سعر شهري ثابت"
              desc="الطالب يدفع نفس المبلغ كل شهر بغض النظر عن عدد الحصص التي حضرها."
              example="مثال: 2500 دج شهرياً ثابتة"
            />
            <PricingModelCard
              value="PER_SESSION" current={pricingModel}
              onClick={() => setPricingModel("PER_SESSION")}
              icon={CreditCard}
              title="حسب الحضور"
              desc="الطالب يدفع فقط مقابل الحصص التي حضرها فعلياً خلال الشهر."
              example="مثال: 400 دج لكل حصة حضرها"
            />
          </div>

          {pricingModel === "MONTHLY_FLAT" ? (
            <Field>
              <Label required>السعر الشهري (دج)</Label>
              <TextInput type="number" value={monthlyPrice} onChange={setMonthlyPrice} placeholder="مثال: 2500" min="0" />
            </Field>
          ) : (
            <>
              <Field>
                <Label required>سعر الحصة الواحدة (دج)</Label>
                <TextInput type="number" value={pricePerSession} onChange={setPricePerSession} placeholder="مثال: 400" min="0" />
              </Field>
              {estimatedMonthly && (
                <div style={{ fontSize: 12, color: "#854F0B", background: "#FAEEDA", border: "1px solid #F0C87A", borderRadius: 9, padding: "10px 14px" }}>
                  💡 تقدير: إذا حضر الطالب جميع الحصص ({weeklySessionCount} حصة أسبوعياً)، فسيدفع تقريباً{" "}
                  <strong>{estimatedMonthly.toLocaleString()} دج</strong> شهرياً.
                  <span style={{ fontSize: 10, opacity: .7 }}> (الفاتورة الفعلية تُحتسب من الحضور الحقيقي فقط)</span>
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* Assignment */}
        <SectionCard title="التخصيص" subtitle="المادة، الأستاذ، والفصل الدراسي">
          <Field>
            <Label required>المادة الدراسية</Label>
            <Select value={subjectId} onChange={v => { setSubjectId(v); setTeacherId(""); }}
              options={subjectOptions} placeholder="اختر المادة..." />
          </Field>
          <Field>
            <Label required>الأستاذ</Label>
            <Select value={teacherId} onChange={setTeacherId} options={teacherOptions} placeholder="اختر الأستاذ..." />
          </Field>
          <Field>
            <Label required>الفصل الدراسي</Label>
            <Select value={classroomId} onChange={setClassroomId} options={classroomOptions} placeholder="اختر الفصل..." />
          </Field>
        </SectionCard>

        {/* Period */}
        <SectionCard title="الفترة الزمنية" subtitle="بداية ونهاية الوحدة — ستُولَّد الحصص تلقائياً لكل هذه الفترة">
          <Row cols={2}>
            <Field>
              <Label required>تاريخ البداية</Label>
              <TextInput type="date" value={periodStart} onChange={setPeriodStart} />
            </Field>
            <Field>
              <Label required>تاريخ النهاية</Label>
              <TextInput type="date" value={periodEnd} onChange={setPeriodEnd} min={periodStart} />
            </Field>
          </Row>
          {periodStart && periodEnd && periodStart < periodEnd && (
            <div style={{ fontSize: 12, color: "#0F6E56", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 9, padding: "8px 13px" }}>
              ✓ مدة الوحدة: {Math.ceil((new Date(periodEnd) - new Date(periodStart)) / (1000 * 60 * 60 * 24 * 7))} أسبوع تقريباً
            </div>
          )}
        </SectionCard>

        {/* Schedule */}
        <SectionCard title="الجدول الأسبوعي" subtitle="حدد أيام وأوقات الحصص الأسبوعية">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {schedules.map((entry, idx) => (
              <ScheduleRow key={idx} entry={entry}
                onChange={updated => setSchedules(prev => prev.map((s, i) => i === idx ? updated : s))}
                onRemove={() => setSchedules(prev => prev.filter((_, i) => i !== idx))}
                usedDays={usedDays} />
            ))}
          </div>
          {schedules.length < 7 && (
            <button type="button"
              onClick={() => setSchedules(prev => [...prev, { day: "", startTime: "08:00", endTime: "09:30" }])}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10, border: `1.5px dashed ${P}`, background: "#EBF4FE", color: P, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif", width: "fit-content" }}>
              <Plus size={14} /> إضافة يوم آخر
            </button>
          )}
        </SectionCard>

        {error && (
          <div style={{ fontSize: 13, color: "#DC2626", background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, paddingBottom: "2rem" }}>
          <button onClick={() => navigate(-1)}
            style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
            إلغاء
          </button>
          <button onClick={handleSubmit} disabled={saving || success}
            style={{ flex: 3, padding: "12px", borderRadius: 12, border: "none", background: success ? "#10B981" : saving ? "#94A3B8" : P, color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving || success ? "default" : "pointer", fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .3s" }}>
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
    </div>
  );
}
