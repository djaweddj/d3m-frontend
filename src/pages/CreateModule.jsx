import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Trash2, Check, ArrowRight, ArrowLeft, AlertCircle,
  Calendar, CalendarRange, CreditCard, BookOpen, Users, Clock,
} from "lucide-react";
import api from "../api";
import { useLanguage } from "../context/LanguageContext";
import NButton from "../components/home/NButton";
import { Field } from "../components/SchoolRegister/FormField"; // ← adjust path
import {
  Spinner, CenterState, EmptyBlock, Notice, InlineError,
  SectionCard, FormGrid, Tabs, TextInput, SelectInput, PricingOption,
} from "../components/createmodule/ModuleFormParts";
import {
  DAY_VALUES, LEVEL_KEYS, LEVEL_CANONICAL_AR, OTHER_LEVEL_VALUE, NEW_SCHEDULE_ROW,
  findClassroomConflicts, findTeacherConflicts,
} from "../components/createmodule/moduleHelpers";

// ─── API ──────────────────────────────────────────────────────────────────────
const getSubjects        = ()   => api.get("/api/subjects").then(r => r.data);
const getTeachers        = ()   => api.get("/api/teachers").then(r => r.data?.content ?? r.data ?? []);
const getClassrooms      = ()   => api.get("/api/classrooms").then(r => r.data);
const postModule         = (d)  => api.post("/api/modules", d).then(r => r.data);
const getArchivedModules = ()   => api.get("/api/modules/archived").then(r => r.data);
const restoreModule      = (id) => api.patch(`/api/modules/${id}/restore`).then(r => r.data);
// ASSUMPTION (unchanged): returns all modules with `classroomId`, `teacherId`
// and a `schedules` array of { day, startTime, endTime }.
const getModules         = ()   => api.get("/api/modules").then(r => r.data?.content ?? r.data ?? []);

const COLUMN = "flex w-full max-w-3xl flex-col gap-4";

// ─── Local pieces ─────────────────────────────────────────────────────────────
function ArchivedModuleCard({ module, onRestore, restoring }) {
  const { t } = useLanguage();
  return (
    <article className="flex flex-col gap-3 rounded-sm border border-gold/40 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-green-deep">{module.name}</h3>
        <p className="mt-1 text-xs text-green-deep/60">
          {module.subjectName} · {module.teacherName} · {module.level}
        </p>
        <p className="mt-0.5 text-[11px] text-green-deep/50">
          {module.periodStart} → {module.periodEnd}
        </p>
      </div>
      <NButton type="button" disabled={restoring} onClick={() => onRestore(module.id)}
        className="shrink-0 disabled:cursor-not-allowed disabled:opacity-60">
        {restoring ? <Spinner /> : (t("createModule.archived.restore") || "Restore")}
      </NButton>
    </article>
  );
}

function ScheduleRow({ index, entry, onChange, onRemove, usedDays, days, conflictMessage, teacherConflictMessage }) {
  const { t } = useLanguage();
  const availableDays = days.filter(d => !usedDays.includes(d.value) || d.value === entry.day);
  const hasConflict = !!(conflictMessage || teacherConflictMessage);
  const removeLabel = t("createModule.schedule.removeDay") || t("createModule.actions.cancel");

  return (
    <div className="flex flex-col gap-2">
      <div className={`grid grid-cols-2 items-end gap-3 rounded-sm border p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:p-4 ${
        hasConflict ? "border-algeria-red/50 bg-algeria-red/5" : "border-gold/40 bg-gold/10"
      }`}>
        <div className="col-span-2 sm:col-span-1">
          <Field id={`day-${index}`} label={t("createModule.schedule.day")}>
            <SelectInput id={`day-${index}`} value={entry.day}
              onChange={v => onChange({ ...entry, day: v })}
              options={availableDays.map(d => ({ value: d.value, label: d.label }))}
              placeholder={t("createModule.schedule.chooseDay")} />
          </Field>
        </div>
        <Field id={`start-${index}`} label={t("createModule.schedule.startTime")}>
          <TextInput id={`start-${index}`} type="time" value={entry.startTime}
            onChange={v => onChange({ ...entry, startTime: v })} />
        </Field>
        <Field id={`end-${index}`} label={t("createModule.schedule.endTime")}>
          <TextInput id={`end-${index}`} type="time" value={entry.endTime}
            onChange={v => onChange({ ...entry, endTime: v })} />
        </Field>
        <button type="button" onClick={onRemove} aria-label={removeLabel}
          className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-sm border border-algeria-red/40 bg-algeria-red/10 text-xs font-bold text-algeria-red transition-colors hover:bg-algeria-red hover:text-ivory sm:col-span-1 sm:w-12">
          <Trash2 className="size-4" />
          <span className="sm:hidden">{removeLabel}</span>
        </button>
      </div>

      {conflictMessage && (
        <InlineError>
          {t("createModule.errors.classroomConflict", { module: conflictMessage })
            || `This classroom is already booked at this time (${conflictMessage}).`}
        </InlineError>
      )}
      {teacherConflictMessage && (
        <InlineError>
          {t("createModule.errors.teacherConflict", { module: teacherConflictMessage })
            || `This teacher is already teaching at this time (${teacherConflictMessage}).`}
        </InlineError>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function CreateModule() {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const [subjects,    setSubjects]    = useState([]);
  const [teachers,    setTeachers]    = useState([]);
  const [classrooms,  setClassrooms]  = useState([]);
  const [modules,     setModules]     = useState([]); // existing modules, for conflict checks
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError,   setDataError]   = useState(null);

  const [name,            setName]            = useState("");
  const [subjectId,       setSubjectId]       = useState("");
  const [teacherId,       setTeacherId]       = useState("");
  const [classroomId,     setClassroomId]     = useState("");
  const [level,           setLevel]           = useState("");
  const [customLevel,     setCustomLevel]     = useState("");
  const [maxStudents,     setMaxStudents]     = useState("");
  const [cycleNumber,     setCycleNumber]     = useState("");
  const [pricingModel,    setPricingModel]    = useState("MONTHLY_FLAT");
  const [monthlyPrice,    setMonthlyPrice]    = useState("");
  const [pricePerSession, setPricePerSession] = useState("");
  const [periodStart,     setPeriodStart]     = useState("");
  const [periodEnd,       setPeriodEnd]       = useState("");
  const [schedules,       setSchedules]       = useState([{ ...NEW_SCHEDULE_ROW }]);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState(null);
  const [success,         setSuccess]         = useState(false);

  const [activeTab,       setActiveTab]       = useState("create");
  const [archivedModules, setArchivedModules] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedError,   setArchivedError]   = useState(null);
  const [restoringId,     setRestoringId]     = useState(null);
  const [restoreError,    setRestoreError]    = useState(null);

  const DAYS   = DAY_VALUES.map(v => ({ value: v, label: t(`dashboard.days.${v}`) }));
  const levels = LEVEL_KEYS.map(k => ({ value: LEVEL_CANONICAL_AR[k], label: t(`createModule.levels.${k}`) }));

  // archived tab
  useEffect(() => {
    if (activeTab !== "archived") return;
    setArchivedLoading(true);
    setArchivedError(null);
    getArchivedModules()
      .then(setArchivedModules)
      .catch(() => setArchivedError(t("createModule.archived.loadError") || "Failed to load archived modules"))
      .finally(() => setArchivedLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleRestore = async (id) => {
    setRestoreError(null);
    setRestoringId(id);
    try {
      await restoreModule(id);
      setArchivedModules(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      setRestoreError(err?.response?.data?.message || t("createModule.archived.restoreFailed") || "Could not restore this module");
    } finally {
      setRestoringId(null);
    }
  };

  // form data
  useEffect(() => {
    Promise.all([getSubjects(), getTeachers(), getClassrooms(), getModules()])
      .then(([s, tch, c, m]) => {
        setSubjects(s?.content ?? s ?? []);
        setTeachers((Array.isArray(tch) ? tch : []).filter(tc => !tc.archived));
        setClassrooms(c?.content ?? c ?? []);
        setModules(Array.isArray(m) ? m : []);
      })
      .catch(() => setDataError(t("createModule.loadError")))
      .finally(() => setDataLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teacherOptions = teachers
    .filter(tc => !subjectId || tc.subjectIds?.includes(Number(subjectId)))
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

  const classroomConflicts = findClassroomConflicts(classroomId, schedules, modules);
  const teacherConflicts   = findTeacherConflicts(teacherId, schedules, modules);
  const hasClassroomConflict = Object.keys(classroomConflicts).length > 0;
  const hasTeacherConflict   = Object.keys(teacherConflicts).length > 0;
  const hasAnyScheduleConflict = hasClassroomConflict || hasTeacherConflict;

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
    if (hasClassroomConflict) {
      return t("createModule.errors.classroomConflictGeneric")
        || t("createModule.errors.classroomConflict", { module: Object.values(classroomConflicts)[0] })
        || "This classroom is already booked at one of the chosen times.";
    }
    if (hasTeacherConflict) {
      return t("createModule.errors.teacherConflictGeneric")
        || t("createModule.errors.teacherConflict", { module: Object.values(teacherConflicts)[0] })
        || "This teacher is already teaching at one of the chosen times.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null); setSaving(true);
    try {
      await postModule({
        name:        name.trim(),
        subjectId:   Number(subjectId),
        teacherId:   Number(teacherId),
        classroomId: Number(classroomId),
        level:       level === OTHER_LEVEL_VALUE ? customLevel : level,
        maxStudents: Number(maxStudents),
        cycleNumber: cycleNumber !== "" ? Number(cycleNumber) : null,
        pricingModel,
        monthlyPrice:    pricingModel === "MONTHLY_FLAT" ? Number(monthlyPrice)    : null,
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
      if (err?.response?.status === 409) {
        setError(err?.response?.data?.message || t("createModule.errors.classroomConflictGeneric") || "This classroom is already booked at the selected time.");
      } else {
        setError(err?.response?.data?.message || t("createModule.errors.submitFailed"));
      }
    } finally { setSaving(false); }
  };

  // ─── page states ────────────────────────────────────────────────────────────
  if (dataLoading) return (
    <div dir={dir}>
      <CenterState>
        <Spinner className="mx-auto mb-3 size-9 text-gold-deep" />
        {t("createModule.loading")}
      </CenterState>
    </div>
  );

  if (dataError) return (
    <div dir={dir}>
      <CenterState tone="text-algeria-red">
        <AlertCircle className="mx-auto mb-3 size-9" />
        {dataError}
      </CenterState>
    </div>
  );

  const submitDisabled = saving || success || hasAnyScheduleConflict;

  return (
    <div dir={dir} className="min-h-screen bg-ivory p-4 sm:p-6">
      <header className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} aria-label={t("createModule.actions.cancel")}
          className="grid size-10 shrink-0 place-items-center rounded-sm border border-gold/40 bg-white text-green-deep transition-colors hover:bg-gold">
          <BackIcon className="size-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold text-green-deep sm:text-xl">{t("createModule.pageTitle")}</h1>
          <p className="mt-0.5 text-xs text-green-deep/60">{t("createModule.pageSubtitle")}</p>
        </div>
      </header>

      <div className="mb-4">
        <Tabs active={activeTab} onChange={setActiveTab}
          tabs={[
            { value: "create",   label: t("createModule.tabs.create")   || "Create"   },
            { value: "archived", label: t("createModule.tabs.archived") || "Archived" },
          ]} />
      </div>

      {activeTab === "create" && (
        <div className={COLUMN}>

          {/* Basic info */}
          <SectionCard icon={BookOpen} title={t("createModule.basicInfo.title")} subtitle={t("createModule.basicInfo.subtitle")}>
            <FormGrid>
              <Field id="moduleName" label={t("createModule.basicInfo.moduleName")} req>
                <TextInput id="moduleName" value={name} onChange={setName}
                  placeholder={t("createModule.basicInfo.moduleNamePlaceholder")} />
              </Field>
              <Field id="level" label={t("createModule.basicInfo.level")} req>
                <SelectInput id="level" value={level} options={levels}
                  placeholder={t("createModule.basicInfo.levelPlaceholder")}
                  onChange={v => { setLevel(v); if (v !== OTHER_LEVEL_VALUE) setCustomLevel(""); }} />
                {level === OTHER_LEVEL_VALUE && (
                  <TextInput id="customLevel" value={customLevel} onChange={setCustomLevel}
                    placeholder={t("createModule.basicInfo.customLevelPlaceholder")} />
                )}
              </Field>
              <Field id="maxStudents" label={t("createModule.basicInfo.maxStudents")} req>
                <TextInput id="maxStudents" type="number" min="1" value={maxStudents} onChange={setMaxStudents}
                  placeholder={t("createModule.basicInfo.maxStudentsPlaceholder")} />
              </Field>
              <Field id="cycleNumber" label={t("createModule.basicInfo.cycleNumber") || "Cycle Number"}>
                <TextInput id="cycleNumber" type="number" min="1" value={cycleNumber} onChange={setCycleNumber}
                  placeholder={t("createModule.basicInfo.cycleNumberPlaceholder") || "e.g. 1"} />
              </Field>
            </FormGrid>
          </SectionCard>

          {/* Pricing */}
          <SectionCard icon={CreditCard} title={t("createModule.pricing.title")} subtitle={t("createModule.pricing.subtitle")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <PricingOption
                selected={pricingModel === "MONTHLY_FLAT"} onClick={() => setPricingModel("MONTHLY_FLAT")}
                icon={Calendar}
                title={t("createModule.pricing.monthlyFlat.title")}
                desc={t("createModule.pricing.monthlyFlat.desc")}
                example={t("createModule.pricing.monthlyFlat.example")} />
              <PricingOption
                selected={pricingModel === "PER_SESSION"} onClick={() => setPricingModel("PER_SESSION")}
                icon={CreditCard}
                title={t("createModule.pricing.perSession.title")}
                desc={t("createModule.pricing.perSession.desc")}
                example={t("createModule.pricing.perSession.example")} />
            </div>

            {pricingModel === "MONTHLY_FLAT" ? (
              <Field id="monthlyPrice" label={t("createModule.pricing.monthlyPriceLabel")} req>
                <TextInput id="monthlyPrice" type="number" min="0" value={monthlyPrice} onChange={setMonthlyPrice}
                  placeholder={t("createModule.pricing.monthlyPricePlaceholder")} />
              </Field>
            ) : (
              <>
                <Field id="pricePerSession" label={t("createModule.pricing.perSessionPriceLabel")} req>
                  <TextInput id="pricePerSession" type="number" min="0" value={pricePerSession} onChange={setPricePerSession}
                    placeholder={t("createModule.pricing.perSessionPricePlaceholder")} />
                </Field>
                {estimatedMonthly && (
                  <Notice variant="gold">
                    {t("createModule.pricing.estimateIntro", { count: weeklySessionCount })}{" "}
                    <strong>{estimatedMonthly.toLocaleString()} {t("students.print.currency")}</strong>{" "}
                    {t("createModule.pricing.estimateSuffix")}{" "}
                    <span className="text-xs opacity-70">{t("createModule.pricing.estimateNote")}</span>
                  </Notice>
                )}
              </>
            )}
          </SectionCard>

          {/* Assignment */}
          <SectionCard icon={Users} title={t("createModule.assignment.title")} subtitle={t("createModule.assignment.subtitle")}>
            <Field id="subject" label={t("createModule.assignment.subject")} req>
              <SelectInput id="subject" value={subjectId} options={subjectOptions}
                placeholder={t("createModule.assignment.subjectPlaceholder")}
                onChange={v => { setSubjectId(v); setTeacherId(""); }} />
            </Field>
            <Field id="teacher" label={t("createModule.assignment.teacher")} req>
              <SelectInput id="teacher" value={teacherId} options={teacherOptions} onChange={setTeacherId}
                placeholder={t("createModule.assignment.teacherPlaceholder")} />
            </Field>
            <Field id="classroom" label={t("createModule.assignment.classroom")} req>
              <SelectInput id="classroom" value={classroomId} options={classroomOptions} onChange={setClassroomId}
                placeholder={t("createModule.assignment.classroomPlaceholder")} />
            </Field>
          </SectionCard>

          {/* Period */}
          <SectionCard icon={CalendarRange} title={t("createModule.period.title")} subtitle={t("createModule.period.subtitle")}>
            <FormGrid>
              <Field id="periodStart" label={t("createModule.period.startDate")} req>
                <TextInput id="periodStart" type="date" value={periodStart} onChange={setPeriodStart} />
              </Field>
              <Field id="periodEnd" label={t("createModule.period.endDate")} req>
                <TextInput id="periodEnd" type="date" min={periodStart} value={periodEnd} onChange={setPeriodEnd} />
              </Field>
            </FormGrid>
            {periodStart && periodEnd && periodStart < periodEnd && (
              <Notice variant="green">
                {t("createModule.period.durationText", {
                  weeks: Math.ceil((new Date(periodEnd) - new Date(periodStart)) / (1000 * 60 * 60 * 24 * 7)),
                })}
              </Notice>
            )}
          </SectionCard>

          {/* Schedule */}
          <SectionCard icon={Clock} title={t("createModule.schedule.title")} subtitle={t("createModule.schedule.subtitle")}>
            <div className="flex flex-col gap-3">
              {schedules.map((entry, idx) => (
                <ScheduleRow key={idx} index={idx} entry={entry} days={DAYS} usedDays={usedDays}
                  onChange={updated => setSchedules(prev => prev.map((s, i) => i === idx ? updated : s))}
                  onRemove={() => setSchedules(prev => prev.filter((_, i) => i !== idx))}
                  conflictMessage={classroomConflicts[idx]}
                  teacherConflictMessage={teacherConflicts[idx]} />
              ))}
            </div>
            {schedules.length < 7 && (
              <NButton type="button" variant="outline" className="w-full border-dashed sm:w-fit"
                onClick={() => setSchedules(prev => [...prev, { ...NEW_SCHEDULE_ROW }])}>
                <Plus className="size-4" /> {t("createModule.schedule.addDay")}
              </NButton>
            )}
          </SectionCard>

          {error && <Notice icon={AlertCircle}>{error}</Notice>}

          <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row">
            <NButton type="button" variant="outline" onClick={() => navigate(-1)} className="sm:flex-1">
              {t("createModule.actions.cancel")}
            </NButton>
            <NButton variant={success ? "gold" : "green"} onClick={handleSubmit} disabled={submitDisabled}
              className="disabled:cursor-not-allowed disabled:opacity-60 sm:flex-[3]">
              {success ? (
                <><Check className="size-4" /> {t("createModule.actions.success")}</>
              ) : saving ? (
                <><Spinner /> {t("createModule.actions.submitting")}</>
              ) : (
                <><Plus className="size-4" /> {t("createModule.actions.submit")}</>
              )}
            </NButton>
          </div>
        </div>
      )}

      {activeTab === "archived" && (
        <div className={COLUMN}>
          {archivedLoading && (
            <EmptyBlock>{t("createModule.archived.loading") || "Loading..."}</EmptyBlock>
          )}
          {archivedError && <Notice icon={AlertCircle}>{archivedError}</Notice>}
          {restoreError  && <Notice icon={AlertCircle}>{restoreError}</Notice>}
          {!archivedLoading && !archivedError && archivedModules.length === 0 && (
            <EmptyBlock>{t("createModule.archived.empty") || "No archived modules"}</EmptyBlock>
          )}
          {archivedModules.map(module => (
            <ArchivedModuleCard key={module.id} module={module}
              restoring={restoringId === module.id} onRestore={handleRestore} />
          ))}
        </div>
      )}
    </div>
  );
}