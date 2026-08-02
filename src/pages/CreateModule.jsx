import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ChevronDown, Check, ArrowRight, AlertCircle, Calendar, CreditCard } from "lucide-react";
import api from "../api";
// NOTE: adjust this path to wherever your LanguageProvider file actually lives
// (the same one Students.jsx / Schedule.jsx / Sidebar.jsx already import).
import { useLanguage } from "../context/LanguageContext";

const getSubjects   = ()  => api.get("/api/subjects").then(r => r.data);
const getTeachers   = ()  => api.get("/api/teachers").then(r => r.data?.content ?? r.data ?? []);
const getClassrooms = ()  => api.get("/api/classrooms").then(r => r.data);
const postModule    = (d) => api.post("/api/modules", d).then(r => r.data);

// Day order is language-agnostic (backend enum values). Labels come from
// the existing dashboard.days.* keys so we don't duplicate translations.
const DAY_VALUES = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

// Level keys are language-agnostic. IMPORTANT: the value actually stored/submitted
// stays the ORIGINAL ARABIC string (LEVEL_CANONICAL_AR), same as before this change,
// so existing data/backend/other pages that compare or display `level` keep working
// no matter which UI language is active. Only the on-screen *label* is translated.
const LEVEL_KEYS = [
  "preparatory", "primary1", "primary2", "primary3", "primary4", "primary5",
  "middle1", "middle2", "middle3", "middle4",
  "secondary1", "secondary2", "secondary3", "other",
];
const LEVEL_CANONICAL_AR = {
  preparatory: "التحضيري",
  primary1: "السنة الأولى ابتدائي",
  primary2: "السنة الثانية ابتدائي",
  primary3: "السنة الثالثة ابتدائي",
  primary4: "السنة الرابعة ابتدائي",
  primary5: "السنة الخامسة ابتدائي",
  middle1: "السنة الأولى متوسط",
  middle2: "السنة الثانية متوسط",
  middle3: "السنة الثالثة متوسط",
  middle4: "السنة الرابعة متوسط",
  secondary1: "السنة الأولى ثانوي",
  secondary2: "السنة الثانية ثانوي",
  secondary3: "السنة الثالثة ثانوي (البكالوريا)",
  other: "مستوى آخر...",
};
const OTHER_LEVEL_VALUE = LEVEL_CANONICAL_AR.other;

const P = "#185FA5";

// --- NEW: simple mobile breakpoint hook (no extra deps) ---
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

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
  const { t } = useLanguage();
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
              {t("createModule.noData")}
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

function SectionCard({ title, subtitle, children, icon: Icon, isMobile }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0",
      padding: isMobile ? "1rem" : "1.25rem 1.5rem",
      display: "flex", flexDirection: "column", gap: 16,
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

function Row({ children, cols = 2, isMobile }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : `repeat(${cols}, 1fr)`,
      gap: 14,
    }}>
      {children}
    </div>
  );
}

function Field({ children }) {
  return <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>;
}

function PricingModelCard({ value, current, onClick, title, desc, icon: Icon, example, isMobile }) {
  const isSelected = current === value;
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: isMobile ? "14px" : "16px 18px", borderRadius: 12, cursor: "pointer",
      border: isSelected ? `2px solid ${P}` : "1.5px solid #E2E8F0",
      background: isSelected ? "#EBF4FE" : "#fff",
      transition: "all .15s", position: "relative",
      minWidth: 0,
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

function ScheduleRow({ entry, onChange, onRemove, usedDays, days, isMobile }) {
  const { t } = useLanguage();
  const availableDays = days.filter(d => !usedDays.includes(d.value) || d.value === entry.day);
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr auto",
      gap: 10, alignItems: "end",
      padding: "12px 14px", borderRadius: 10,
      background: "#F8FAFC", border: "1.5px solid #E2E8F0",
    }}>
      <Field style={isMobile ? { gridColumn: "1 / -1" } : undefined}>
        <Label>{t("createModule.schedule.day")}</Label>
        <Select value={entry.day} onChange={v => onChange({ ...entry, day: v })}
          options={availableDays.map(d => ({ value: d.value, label: d.label }))}
          placeholder={t("createModule.schedule.chooseDay")} />
      </Field>
      <Field>
        <Label>{t("createModule.schedule.startTime")}</Label>
        <TextInput type="time" value={entry.startTime} onChange={v => onChange({ ...entry, startTime: v })} />
      </Field>
      <Field>
        <Label>{t("createModule.schedule.endTime")}</Label>
        <TextInput type="time" value={entry.endTime} onChange={v => onChange({ ...entry, endTime: v })} />
      </Field>
      <button type="button" onClick={onRemove}
        style={{
          width: 36, height: 36, borderRadius: 9, border: "1.5px solid #FECACA",
          background: "#FEF2F2", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          ...(isMobile ? { gridColumn: "1 / -1", width: "100%" } : {}),
        }}>
        <Trash2 size={14} color="#EF4444" />
        {isMobile && <span style={{ marginInlineStart: 6, fontSize: 12, fontWeight: 600, fontFamily: "'Cairo',sans-serif" }}>{t("createModule.schedule.day") ? "" : ""}</span>}
      </button>
    </div>
  );
}

export default function CreateModule() {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const isMobile = useIsMobile();

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
  const [cycleNumber,    setCycleNumber]    = useState(""); // NEW: matches CourseModuleRequestDto.cycleNumber
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

  // Labels are translated; the stored/submitted value stays the canonical Arabic
  // string so it matches what's already in your database and other pages.
  const DAYS = DAY_VALUES.map(v => ({ value: v, label: t(`dashboard.days.${v}`) }));
  const levels = LEVEL_KEYS.map(k => ({
    value: LEVEL_CANONICAL_AR[k],
    label: t(`createModule.levels.${k}`),
  }));

  useEffect(() => {
    Promise.all([getSubjects(), getTeachers(), getClassrooms()])
      .then(([s, t, c]) => {
        setSubjects(s?.content ?? s ?? []);
        setTeachers((Array.isArray(t) ? t : []).filter(tc => !tc.archived));
        setClassrooms(c?.content ?? c ?? []);
      })
      .catch(() => setDataError(t("createModule.loadError")))
      .finally(() => setDataLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teacherOptions = teachers
    .filter(tc => !subjectId || !tc.subjectIds?.length || tc.subjectIds.includes(Number(subjectId)))
    .map(tc => ({ value: String(tc.id), label: `${tc.fullName}${tc.specialization ? " — " + tc.specialization : ""}` }));

  const subjectOptions   = subjects.map(s => ({ value: String(s.id), label: s.name }));
  const classroomOptions = classrooms.map(c => ({
    value: String(c.id),
    label: t("createModule.assignment.classroomCapacity", { name: c.name, capacity: c.capacity }),
  }));

  const usedDays = schedules.map(s => s.day);
  const weeklySessionCount = schedules.filter(s => s.day).length;
  const estimatedMonthly =
    pricingModel === "PER_SESSION" && pricePerSession && weeklySessionCount > 0
      ? Math.round(Number(pricePerSession) * weeklySessionCount * 4.3)
      : null;

  const validate = () => {
    if (!name.trim())    return t("createModule.errors.moduleName");
    if (!subjectId)      return t("createModule.errors.subject");
    if (!teacherId)      return t("createModule.errors.teacher");
    if (!classroomId)    return t("createModule.errors.classroom");
    if (!level.trim())   return t("createModule.errors.level");
    if (!maxStudents || Number(maxStudents) < 1) return t("createModule.errors.maxStudents");
    if (pricingModel === "MONTHLY_FLAT" && (!monthlyPrice || Number(monthlyPrice) <= 0))
      return t("createModule.errors.monthlyPrice");
    if (pricingModel === "PER_SESSION" && (!pricePerSession || Number(pricePerSession) <= 0))
      return t("createModule.errors.perSessionPrice");
    if (!periodStart)    return t("createModule.errors.periodStart");
    if (!periodEnd)      return t("createModule.errors.periodEnd");
    if (periodStart >= periodEnd) return t("createModule.errors.periodOrder");
    if (schedules.length === 0)   return t("createModule.errors.atLeastOneDay");
    for (const s of schedules) {
      if (!s.day)                     return t("createModule.errors.chooseDayEachRow");
      if (!s.startTime || !s.endTime) return t("createModule.errors.enterTimeEachRow");
      if (s.startTime >= s.endTime)   return t("createModule.errors.timeOrder");
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
        level: level === OTHER_LEVEL_VALUE ? customLevel : level,
        maxStudents:    Number(maxStudents),
        cycleNumber:    cycleNumber !== "" ? Number(cycleNumber) : null, // NEW
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
      setError(err?.response?.data?.message || t("createModule.errors.submitFailed"));
    } finally { setSaving(false); }
  };

  if (dataLoading) return (
    <div dir={dir} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontFamily: "'Cairo',sans-serif" }}>
      <div style={{ textAlign: "center", color: "#94A3B8" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${P}`, borderTopColor: "transparent", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 13 }}>{t("createModule.loading")}</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (dataError) return (
    <div dir={dir} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontFamily: "'Cairo',sans-serif" }}>
      <div style={{ textAlign: "center", color: "#EF4444" }}>
        <AlertCircle size={36} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 13 }}>{dataError}</div>
      </div>
    </div>
  );

  return (
    <div dir={dir} style={{ padding: isMobile ? "1rem" : "1.5rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
        <button onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ArrowRight size={16} color="#64748B" />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("createModule.pageTitle")}</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: "3px 0 0" }}>
            {t("createModule.pageSubtitle")}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 780, width: "100%", boxSizing: "border-box" }}>

        {/* Basic Info */}
        <SectionCard isMobile={isMobile} title={t("createModule.basicInfo.title")} subtitle={t("createModule.basicInfo.subtitle")}>
          <Row cols={2} isMobile={isMobile}>
            <Field>
              <Label required>{t("createModule.basicInfo.moduleName")}</Label>
              <TextInput value={name} onChange={setName} placeholder={t("createModule.basicInfo.moduleNamePlaceholder")} />
            </Field>
            <Field>
              <Label required>{t("createModule.basicInfo.level")}</Label>

              <select
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);

                  // Clear custom value if another option is selected
                  if (e.target.value !== OTHER_LEVEL_VALUE) {
                    setCustomLevel("");
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("createModule.basicInfo.levelPlaceholder")}</option>

                {levels.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              {level === OTHER_LEVEL_VALUE && (
                <div className="mt-3">
                  <TextInput
                    value={customLevel}
                    onChange={setCustomLevel}
                    placeholder={t("createModule.basicInfo.customLevelPlaceholder")}
                  />
                </div>
              )}
            </Field>
          </Row>
          <Row cols={2} isMobile={isMobile}>
            <Field>
              <Label required>{t("createModule.basicInfo.maxStudents")}</Label>
              <TextInput type="number" value={maxStudents} onChange={setMaxStudents} placeholder={t("createModule.basicInfo.maxStudentsPlaceholder")} min="1" />
            </Field>
            {/* NEW FIELD: cycleNumber (maps to CourseModuleRequestDto.cycleNumber) */}
            <Field>
              <Label>{t("createModule.basicInfo.cycleNumber") || "Cycle Number"}</Label>
              <TextInput
                type="number"
                value={cycleNumber}
                onChange={setCycleNumber}
                placeholder={t("createModule.basicInfo.cycleNumberPlaceholder") || "e.g. 1"}
                min="1"
              />
            </Field>
          </Row>
        </SectionCard>

        {/* Pricing Model */}
        <SectionCard isMobile={isMobile} title={t("createModule.pricing.title")} subtitle={t("createModule.pricing.subtitle")} icon={CreditCard}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12 }}>
            <PricingModelCard
              value="MONTHLY_FLAT" current={pricingModel}
              onClick={() => setPricingModel("MONTHLY_FLAT")}
              icon={Calendar}
              title={t("createModule.pricing.monthlyFlat.title")}
              desc={t("createModule.pricing.monthlyFlat.desc")}
              example={t("createModule.pricing.monthlyFlat.example")}
              isMobile={isMobile}
            />
            <PricingModelCard
              value="PER_SESSION" current={pricingModel}
              onClick={() => setPricingModel("PER_SESSION")}
              icon={CreditCard}
              title={t("createModule.pricing.perSession.title")}
              desc={t("createModule.pricing.perSession.desc")}
              example={t("createModule.pricing.perSession.example")}
              isMobile={isMobile}
            />
          </div>

          {pricingModel === "MONTHLY_FLAT" ? (
            <Field>
              <Label required>{t("createModule.pricing.monthlyPriceLabel")}</Label>
              <TextInput type="number" value={monthlyPrice} onChange={setMonthlyPrice} placeholder={t("createModule.pricing.monthlyPricePlaceholder")} min="0" />
            </Field>
          ) : (
            <>
              <Field>
                <Label required>{t("createModule.pricing.perSessionPriceLabel")}</Label>
                <TextInput type="number" value={pricePerSession} onChange={setPricePerSession} placeholder={t("createModule.pricing.perSessionPricePlaceholder")} min="0" />
              </Field>
              {estimatedMonthly && (
                <div style={{ fontSize: 12, color: "#854F0B", background: "#FAEEDA", border: "1px solid #F0C87A", borderRadius: 9, padding: "10px 14px" }}>
                  {t("createModule.pricing.estimateIntro", { count: weeklySessionCount })}{" "}
                  <strong>{estimatedMonthly.toLocaleString()} {t("students.print.currency")}</strong> {t("createModule.pricing.estimateSuffix")}
                  <span style={{ fontSize: 10, opacity: .7 }}> {t("createModule.pricing.estimateNote")}</span>
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* Assignment */}
        <SectionCard isMobile={isMobile} title={t("createModule.assignment.title")} subtitle={t("createModule.assignment.subtitle")}>
          <Field>
            <Label required>{t("createModule.assignment.subject")}</Label>
            <Select value={subjectId} onChange={v => { setSubjectId(v); setTeacherId(""); }}
              options={subjectOptions} placeholder={t("createModule.assignment.subjectPlaceholder")} />
          </Field>
          <Field>
            <Label required>{t("createModule.assignment.teacher")}</Label>
            <Select value={teacherId} onChange={setTeacherId} options={teacherOptions} placeholder={t("createModule.assignment.teacherPlaceholder")} />
          </Field>
          <Field>
            <Label required>{t("createModule.assignment.classroom")}</Label>
            <Select value={classroomId} onChange={setClassroomId} options={classroomOptions} placeholder={t("createModule.assignment.classroomPlaceholder")} />
          </Field>
        </SectionCard>

        {/* Period */}
        <SectionCard isMobile={isMobile} title={t("createModule.period.title")} subtitle={t("createModule.period.subtitle")}>
          <Row cols={2} isMobile={isMobile}>
            <Field>
              <Label required>{t("createModule.period.startDate")}</Label>
              <TextInput type="date" value={periodStart} onChange={setPeriodStart} />
            </Field>
            <Field>
              <Label required>{t("createModule.period.endDate")}</Label>
              <TextInput type="date" value={periodEnd} onChange={setPeriodEnd} min={periodStart} />
            </Field>
          </Row>
          {periodStart && periodEnd && periodStart < periodEnd && (
            <div style={{ fontSize: 12, color: "#0F6E56", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 9, padding: "8px 13px" }}>
              {t("createModule.period.durationText", {
                weeks: Math.ceil((new Date(periodEnd) - new Date(periodStart)) / (1000 * 60 * 60 * 24 * 7)),
              })}
            </div>
          )}
        </SectionCard>

        {/* Schedule */}
        <SectionCard isMobile={isMobile} title={t("createModule.schedule.title")} subtitle={t("createModule.schedule.subtitle")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {schedules.map((entry, idx) => (
              <ScheduleRow key={idx} entry={entry} days={DAYS} isMobile={isMobile}
                onChange={updated => setSchedules(prev => prev.map((s, i) => i === idx ? updated : s))}
                onRemove={() => setSchedules(prev => prev.filter((_, i) => i !== idx))}
                usedDays={usedDays} />
            ))}
          </div>
          {schedules.length < 7 && (
            <button type="button"
              onClick={() => setSchedules(prev => [...prev, { day: "", startTime: "08:00", endTime: "09:30" }])}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10, border: `1.5px dashed ${P}`, background: "#EBF4FE", color: P, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif", width: isMobile ? "100%" : "fit-content", justifyContent: "center" }}>
              <Plus size={14} /> {t("createModule.schedule.addDay")}
            </button>
          )}
        </SectionCard>

        {error && (
          <div style={{ fontSize: 13, color: "#DC2626", background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: isMobile ? "column-reverse" : "row", gap: 10, paddingBottom: "2rem" }}>
          <button onClick={() => navigate(-1)}
            style={{ flex: isMobile ? "none" : 1, width: isMobile ? "100%" : "auto", padding: "12px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
            {t("createModule.actions.cancel")}
          </button>
          <button onClick={handleSubmit} disabled={saving || success}
            style={{ flex: isMobile ? "none" : 3, width: isMobile ? "100%" : "auto", padding: "12px", borderRadius: 12, border: "none", background: success ? "#10B981" : saving ? "#94A3B8" : P, color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving || success ? "default" : "pointer", fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .3s" }}>
            {success ? (
              <><Check size={16} /> {t("createModule.actions.success")}</>
            ) : saving ? (
              <>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", animation: "spin .8s linear infinite" }} />
                {t("createModule.actions.submitting")}
              </>
            ) : (
              <><Plus size={16} /> {t("createModule.actions.submit")}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}