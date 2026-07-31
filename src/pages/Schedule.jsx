import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, X, Edit2, Trash2, Users, Check, XCircle, Clock4, MinusCircle,
  RefreshCw, AlertCircle, Clock, BookOpen, GripVertical, ChevronDown,
  Calendar, LayoutGrid, ChevronLeft, ChevronRight, Repeat, ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../api";

// ══════════════════════════════════════════════════════════════════
//  API — wired to the new backend endpoints
// ══════════════════════════════════════════════════════════════════
const scheduleApi = {
  getModules:        ()                    => api.get("api/modules"),
  createSession:      (data)                => api.post("api/sessions", data),
  updateSchedule:      (moduleId, day, data) => api.put(`api/modules/${moduleId}/schedules/${day}`, data),
  archiveModule:       (moduleId)            => api.patch(`api/modules/${moduleId}/archive`),

  getSessionsByDate:   (schoolId, date)      => api.get("api/sessions/by-date", { params: { schoolId, date } }),
  getWeek:             (schoolId, date)      => api.get("api/sessions/week", { params: { schoolId, date } }),

  getAttendanceSheet:  (sessionId)           => api.get(`api/sessions/${sessionId}/attendance-sheet`),
  submitAttendance:    (sessionId, entries,user)  => api.post(`api/sessions/${sessionId}/attendance`, entries,user),

  // ── تعويض (makeup attendance) ──
  getSiblingModules:   (moduleId)            => api.get(`api/sessions/module/${moduleId}/siblings`),
  getStudentsByModule: (moduleId)            => api.get(`api/students/by-module/${moduleId}`),
};

// ══════════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════════
const DAY_TO_IDX = {
  FRIDAY: 0, SATURDAY: 1, SUNDAY: 2,
  MONDAY: 3, TUESDAY: 4, WEDNESDAY: 5, THURSDAY: 6,
};
const IDX_TO_DAY = ["FRIDAY","SATURDAY","SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY"];

const fmtTime = (t) => (t ? String(t).slice(0, 5) : "—");
const toLocalDate = (d) => d.toLocaleDateString("fr-CA");

const PALETTE = [
  { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE", accent: "#6366F1" },
  { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0", accent: "#10B981" },
  { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A", accent: "#F59E0B" },
  { bg: "#F3E8FF", text: "#6B21A8", border: "#E9D5FF", accent: "#A855F7" },
  { bg: "#FFF1F2", text: "#9F1239", border: "#FECDD3", accent: "#F43F5E" },
  { bg: "#F0FDF4", text: "#14532D", border: "#BBF7D0", accent: "#22C55E" },
  { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA", accent: "#F97316" },
  { bg: "#F0F9FF", text: "#0C4A6E", border: "#BAE6FD", accent: "#0EA5E9" },
];
const colFor = (id) => PALETTE[(Number(id) || 0) % PALETTE.length];
const P = "#185FA5";
const MAKEUP_COLOR = "#7C3AED";

// ══════════════════════════════════════════════════════════════════
//  SHARED PRIMITIVES
// ══════════════════════════════════════════════════════════════════
function Spinner({ size = 18, color = P }) {
  return (
    <>
      <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${color}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

function ModalWrap({ onClose, children, maxWidth = 420, zIndex = 300 }) {
  const { dir } = useLanguage();
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex, padding: "1rem", backdropFilter: "blur(2px)" }}>
      <div dir={dir} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth, border: "1.5px solid #E2E8F0", overflow: "hidden", fontFamily: "'Cairo',sans-serif", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.18)" }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1.5px solid #F1F5F9", background: "#FAFCFF", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onBack && (
          <button onClick={onBack} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowLeft size={13} color="#64748B" />
          </button>
        )}
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{title}</div>
      </div>
      <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
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

function BtnPrimary({ onClick, disabled, loading, icon: Icon, label, danger }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px", borderRadius: 10, border: "none", background: disabled || loading ? "#CBD5E1" : danger ? "#E24B4A" : P, color: "#fff", fontSize: 13, fontWeight: 600, cursor: disabled || loading ? "not-allowed" : "pointer", fontFamily: "'Cairo',sans-serif", transition: "background .15s" }}>
      {loading ? <Spinner size={14} color="#fff" /> : Icon ? <Icon size={14} /> : null}
      {label}
    </button>
  );
}

function BtnGhost({ onClick, label }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
      {label}
    </button>
  );
}

function ErrorBox({ msg }) {
  return msg ? (
    <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, padding: "8px 13px" }}>
      ⚠️ {msg}
    </div>
  ) : null;
}

const inp_css = {
  padding: "9px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0",
  fontSize: 13, fontFamily: "'Cairo',sans-serif", color: "#0F172A",
  background: "#FAFCFF", outline: "none", width: "100%", boxSizing: "border-box",
};

// ══════════════════════════════════════════════════════════════════
//  ADD SESSION MODAL  (unchanged)
// ══════════════════════════════════════════════════════════════════
function AddModal({ modules, defaultDayIdx, onClose, onCreated }) {
  const { t, locale } = useLanguage();
  const PRICING_BADGE = {
    MONTHLY_FLAT: { label: t("schedule.pricing.monthly"), bg: "#EBF4FE", color: "#185FA5" },
    PER_SESSION:  { label: t("schedule.pricing.perSession"), bg: "#FAEEDA", color: "#854F0B" },
  };
  const [modName, setModName] = useState("");
  const [date,    setDate]    = useState(() => new Date().toISOString().split("T")[0]);
  const [start,   setStart]   = useState("08:00");
  const [end,     setEnd]     = useState("09:30");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [open,    setOpen]    = useState(false);

  const chosenMod = modules.find((m) => m.name === modName);

  const handleModSelect = (m) => {
    setModName(m.name);
    setOpen(false);
    if (defaultDayIdx != null) {
      const dayStr = IDX_TO_DAY[defaultDayIdx];
      const sched  = (m.schedules ?? []).find((s) => s.day === dayStr);
      if (sched) { setStart(fmtTime(sched.startTime)); setEnd(fmtTime(sched.endTime)); }
    }
  };

  const handleSave = async () => {
    if (!modName)       return setError(t("schedule.addModal.errors.selectModule"));
    if (!date)          return setError(t("schedule.addModal.errors.enterDate"));
    if (!start || !end) return setError(t("schedule.addModal.errors.enterTimes"));
    if (start >= end)   return setError(t("schedule.addModal.errors.startBeforeEnd"));
    setSaving(true); setError("");
    try {
      const res = await scheduleApi.createSession({ courseModuleName: modName, date, startTime: start, endTime: end });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t("schedule.addModal.errors.createFailed"));
    } finally { setSaving(false); }
  };

  return (
    <ModalWrap onClose={onClose} maxWidth={380}>
      <ModalHeader title={t("schedule.addModal.title")} onClose={onClose} />
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 13, overflowY: "auto" }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>{t("schedule.addModal.moduleLabel")}</label>
          <div style={{ position: "relative" }}>
            <button onClick={() => setOpen((p) => !p)}
              style={{ ...inp_css, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", border: open ? `1.5px solid ${P}` : "1.5px solid #E2E8F0" }}>
              <span style={{ color: modName ? "#0F172A" : "#94A3B8" }}>{modName || t("schedule.addModal.modulePlaceholder")}</span>
              <ChevronDown size={14} color="#94A3B8" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {open && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 50, maxHeight: 200, overflowY: "auto" }}>
                {modules.length === 0 && <div style={{ padding: "12px 14px", fontSize: 12, color: "#94A3B8" }}>{t("schedule.addModal.noModules")}</div>}
                {modules.map((m) => {
                  const c = colFor(m.id); const selected = m.name === modName;
                  return (
                    <div key={m.id} onClick={() => handleModSelect(m)}
                      style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 9, background: selected ? c.bg : "transparent", color: selected ? c.text : "#0F172A", borderBottom: "1px solid #F8FAFC" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.accent, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        {m.teacherName && <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{t("schedule.attendance.teacherLabel", { name: m.teacherName })}</div>}
                      </div>
                      {selected && <Check size={13} style={{ marginRight: "auto" }} color={c.text} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>{t("schedule.addModal.dateLabel")}</label>
          <input style={inp_css} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>{t("schedule.addModal.startLabel")}</label>
            <input style={inp_css} type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>{t("schedule.addModal.endLabel")}</label>
            <input style={inp_css} type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        {modName && chosenMod && (
          <div style={{ background: colFor(chosenMod.id).bg, border: `1px solid ${colFor(chosenMod.id).border}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: colFor(chosenMod.id).text }}>{modName}</div>
            <div style={{ fontSize: 11, color: colFor(chosenMod.id).text, opacity: .7, marginTop: 3 }}>
              📅 {date ? new Date(date).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }) : "—"}
              &nbsp;&nbsp;🕐 {start} – {end}
            </div>
          </div>
        )}
        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label={t("schedule.addModal.cancel")} />
        <BtnPrimary onClick={handleSave} loading={saving} icon={Plus} label={saving ? t("schedule.addModal.saving") : t("schedule.addModal.save")} />
      </ModalFooter>
    </ModalWrap>
  );
}

// ══════════════════════════════════════════════════════════════════
//  EDIT TIMING MODAL  (unchanged)
// ══════════════════════════════════════════════════════════════════
function EditModal({ slot, onClose, onSaved }) {
  const { t } = useLanguage();
  const c = colFor(slot.moduleId);
  const [start,   setStart]   = useState(fmtTime(slot.startTime));
  const [end,     setEnd]     = useState(fmtTime(slot.endTime));
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const handleSave = async () => {
    if (!start || !end) return setError(t("schedule.editModal.errors.fillAll"));
    if (start >= end)   return setError(t("schedule.editModal.errors.startBeforeEnd"));
    setSaving(true); setError("");
    try {
      await scheduleApi.updateSchedule(slot.moduleId, slot.day, {
        startTime: start + ":00",
        endTime:   end   + ":00",
      });
      onSaved({ ...slot, startTime: start + ":00", endTime: end + ":00" });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t("schedule.editModal.errors.updateFailed"));
    } finally { setSaving(false); }
  };

  return (
    <ModalWrap onClose={onClose} maxWidth={340}>
      <div style={{ padding: "1rem 1.25rem", background: c.bg, borderBottom: `1.5px solid ${c.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{t("schedule.editModal.title")}</div>
          <div style={{ fontSize: 11, color: c.text, opacity: .75, marginTop: 2 }}>{slot.subjectName ?? slot.moduleName}</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${c.border}`, background: "rgba(255,255,255,.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={14} color={c.text} />
        </button>
      </div>
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 13 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>{t("schedule.editModal.startLabel")}</label>
            <input style={inp_css} type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>{t("schedule.editModal.endLabel")}</label>
            <input style={inp_css} type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", background: "#F8FAFC", borderRadius: 8, padding: "8px 12px" }}>
          {t("schedule.editModal.note")}
        </div>
        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label={t("schedule.editModal.cancel")} />
        <BtnPrimary onClick={handleSave} loading={saving} icon={Check} label={saving ? t("schedule.editModal.saving") : t("schedule.editModal.save")} />
      </ModalFooter>
    </ModalWrap>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ARCHIVE MODAL  (unchanged)
// ══════════════════════════════════════════════════════════════════
function ArchiveModal({ slot, onClose, onConfirm }) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleConfirm = async () => {
    setSaving(true); setError("");
    try {
      await scheduleApi.archiveModule(slot.moduleId);
      onConfirm(slot);
    } catch (err) {
      setError(err?.response?.data?.message || t("schedule.archiveModal.errors.archiveFailed"));
      setSaving(false);
    }
  };

  return (
    <ModalWrap onClose={onClose} maxWidth={340}>
      <ModalHeader title={t("schedule.archiveModal.title")} onClose={onClose} />
      <div style={{ padding: "1.5rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF2F2", border: "2px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Trash2 size={22} color="#DC2626" />
        </div>
        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: 0 }}>
          {t("schedule.archiveModal.confirmQuestion", { name: slot.subjectName ?? slot.moduleName })}
          <br />
          <span style={{ fontSize: 11, color: "#94A3B8" }}>
            {t("schedule.archiveModal.note")}
          </span>
        </p>
        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label={t("schedule.archiveModal.cancel")} />
        <BtnPrimary onClick={handleConfirm} loading={saving} icon={Trash2} label={saving ? t("schedule.archiveModal.archiving") : t("schedule.archiveModal.confirm")} danger />
      </ModalFooter>
    </ModalWrap>
  );
}

// ══════════════════════════════════════════════════════════════════
//  تعويض PICKER MODAL
//  Step 1: pick a sibling group (same subject + same teacher + same level)
//  Step 2: pick a student from that group's roster
//  No creditedModuleId sent — backend auto-detects and redirects the mark
//  to the student's own session for this subject, same week.
// ══════════════════════════════════════════════════════════════════
function MakeupPickerModal({ moduleId, alreadyAddedIds, onClose, onPick }) {
  const { t } = useLanguage();

  const [step,        setStep]        = useState(1); // 1 = pick group, 2 = pick student
  const [siblings,     setSiblings]     = useState([]);
  const [loadingSibs,  setLoadingSibs]  = useState(true);
  const [siblingError, setSiblingError] = useState("");

  const [chosenGroup,  setChosenGroup]  = useState(null);
  const [roster,       setRoster]       = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterError,  setRosterError]  = useState("");

  useEffect(() => {
    scheduleApi.getSiblingModules(moduleId)
      .then((r) => setSiblings(r.data ?? []))
      .catch((err) => setSiblingError(err?.response?.data?.message || t("schedule.makeup.errors.loadGroupsFailed")))
      .finally(() => setLoadingSibs(false));
  }, [moduleId]);

  const handlePickGroup = (group) => {
    setChosenGroup(group);
    setStep(2);
    setLoadingRoster(true);
    setRosterError("");
    scheduleApi.getStudentsByModule(group.id)
      .then((r) => setRoster(r.data?.content ?? r.data ?? []))
      .catch((err) => setRosterError(err?.response?.data?.message || t("schedule.makeup.errors.loadRosterFailed")))
      .finally(() => setLoadingRoster(false));
  };

  const handlePickStudent = (student) => {
    onPick({
      studentId:     student.id,
      fullName:       student.fullName ?? student.name,
      level:          student.level,
      fromGroupName:  chosenGroup.name, // local display only, not sent to backend
    });
    onClose();
  };

  return (
    <ModalWrap onClose={onClose} maxWidth={380} zIndex={320}>
      <ModalHeader
        title={step === 1 ? t("schedule.makeup.pickGroupTitle") : t("schedule.makeup.pickStudentTitle", { group: chosenGroup?.name })}
        onClose={onClose}
        onBack={step === 2 ? () => setStep(1) : null}
      />
      <div style={{ padding: "0.75rem", overflowY: "auto", minHeight: 220 }}>
        {step === 1 && (
          loadingSibs ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><Spinner size={22} /></div>
          ) : siblingError ? (
            <div style={{ padding: "1rem" }}><ErrorBox msg={siblingError} /></div>
          ) : siblings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94A3B8", fontSize: 12 }}>
              {t("schedule.makeup.noGroups")}
            </div>
          ) : siblings.map((g) => {
            const c = colFor(g.id);
            return (
              <div key={g.id} onClick={() => handlePickGroup(g)}
                style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginBottom: 6, background: c.bg, border: `1.5px solid ${c.border}` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.accent, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{g.name}</div>
                  {g.level && <div style={{ fontSize: 10, color: c.text, opacity: .7, marginTop: 1 }}>{g.level}</div>}
                </div>
                <ChevronDown size={13} color={c.text} style={{ transform: "rotate(-90deg)" }} />
              </div>
            );
          })
        )}

        {step === 2 && (
          loadingRoster ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><Spinner size={22} /></div>
          ) : rosterError ? (
            <div style={{ padding: "1rem" }}><ErrorBox msg={rosterError} /></div>
          ) : roster.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94A3B8", fontSize: 12 }}>
              {t("schedule.makeup.noStudents")}
            </div>
          ) : roster.map((s) => {
            const disabled = alreadyAddedIds.includes(s.id);
            return (
              <div key={s.id} onClick={() => !disabled && handlePickStudent(s)}
                style={{ padding: "9px 14px", borderRadius: 9, cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 10, marginBottom: 4, opacity: disabled ? .45 : 1, background: "#FAFCFF", border: "1px solid #F1F5F9" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#EBF4FE", border: "2px solid #B5D4F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#0C447C", flexShrink: 0 }}>
                  {(s.fullName ?? s.name)?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{s.fullName ?? s.name}</div>
                  {disabled && <div style={{ fontSize: 10, color: "#94A3B8" }}>{t("schedule.makeup.alreadyAdded")}</div>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </ModalWrap>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ATTENDANCE SHEET MODAL — session-based, month badge + تعويض
//  تعويض marks now save directly onto the student's OWN session (same week,
//  auto-detected by backend) — not onto this session. So after saving, a
//  تعويض student won't reappear here on reload; their mark lives in their
//  own group's history instead.
// ══════════════════════════════════════════════════════════════════
function AttendanceSheetModal({ session, onClose }) {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const c = colFor(session.moduleId);

  const [sheet,     setSheet]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [marks,     setMarks]     = useState({});

  // Newly picked تعويض students this session (local only, until saved)
  const [makeupEntries, setMakeupEntries] = useState([]); // [{studentId, fullName, level, fromGroupName}]
  const [pickerOpen,    setPickerOpen]    = useState(false);

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    scheduleApi.getAttendanceSheet(session.id)
      .then((r) => {
        setSheet(r.data);
        const initMarks = {};
        (r.data.students ?? []).forEach((s) => {
          if (s.status) initMarks[s.studentId] = s.status;
        });
        setMarks(initMarks);
      })
      .catch((err) => setError(err?.response?.data?.message || t("schedule.attendance.loadFailed")))
      .finally(() => setLoading(false));
  }, [session.id]);

  const students = sheet?.students ?? [];

  const mark = (id, status) => setMarks((prev) => ({ ...prev, [id]: prev[id] === status ? null : status }));
  const markAll = (status) => {
    const all = {};
    students.forEach((s) => { all[s.studentId] = status; });
    makeupEntries.forEach((m) => { all[m.studentId] = marks[m.studentId] ?? "PRESENT"; });
    setMarks(all);
  };

  const presentCount = Object.values(marks).filter((v) => v === "PRESENT").length;
  const absentCount  = Object.values(marks).filter((v) => v === "ABSENT").length;
  const markedCount  = Object.values(marks).filter(Boolean).length;
  const totalPeople  = students.length + makeupEntries.length;

  const handleAddMakeup = (entry) => {
    setMakeupEntries((prev) => [...prev, entry]);
    setMarks((prev) => ({ ...prev, [entry.studentId]: "PRESENT" }));
  };

  const handleRemoveMakeup = (studentId) => {
    setMakeupEntries((prev) => prev.filter((m) => m.studentId !== studentId));
    setMarks((prev) => { const next = { ...prev }; delete next[studentId]; return next; });
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const rosterEntries = students
        .filter((s) => marks[s.studentId])
        .map((s) => ({
          studentId: s.studentId,
          status:    marks[s.studentId],
        }));

      const makeupSubmitEntries = makeupEntries
        .filter((m) => marks[m.studentId])
        .map((m) => ({
          studentId: m.studentId,
          status:    marks[m.studentId],
          // no creditedModuleId — backend detects they're not enrolled here and
          // auto-redirects the mark onto their own session for this subject, same week
        }));

      const entries = [...rosterEntries, ...makeupSubmitEntries];

      await scheduleApi.submitAttendance(session.id, entries, user);
      setSubmitted(true);
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err?.response?.data?.message || t("schedule.attendance.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const STATUS_BTNS = [
    { key: "PRESENT", Icon: Check,   activeColor: "#0F6E56", activeBg: "#E1F5EE", title: t("schedule.attendance.presentTitle") },
    { key: "ABSENT",  Icon: XCircle, activeColor: "#DC2626", activeBg: "#FEE2E2", title: t("schedule.attendance.absentTitle") },
  ];

  return (
    <>
      <ModalWrap onClose={onClose} maxWidth={560}>
        <div style={{ padding: "1.1rem 1.25rem", background: c.bg, borderBottom: `1.5px solid ${c.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>
                  {sheet?.subjectName ?? session.subjectName ?? session.moduleName}
                </div>
                {!loading && sheet?.totalSessionsInMonth > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: "rgba(255,255,255,.7)", color: c.text, border: `1px solid ${c.border}` }}>
                    {t("schedule.attendance.sessionOfMonth", { ordinal: sheet.sessionOrdinalInMonth, total: sheet.totalSessionsInMonth })}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: c.text, opacity: .8, marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span>{t("schedule.attendance.teacherLabel", { name: sheet?.teacherName ?? session.teacherName ?? "—" })}</span>
                <span>🕐 {fmtTime(sheet?.startTime ?? session.startTime)} – {fmtTime(sheet?.endTime ?? session.endTime)}</span>
                <span>📅 {sheet?.date ? new Date(sheet.date).toLocaleDateString(locale, { day: "numeric", month: "long" }) : "—"}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => setPickerOpen(true)}
                title={t("schedule.makeup.buttonTitle")}
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${MAKEUP_COLOR}55`, background: "#F5F3FF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Repeat size={14} color={MAKEUP_COLOR} />
              </button>
              <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${c.border}`, background: "rgba(255,255,255,.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} color={c.text} />
              </button>
            </div>
          </div>

          {!loading && (
            <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 11px", borderRadius: 20, background: "rgba(255,255,255,.6)", color: c.text, border: `1px solid ${c.border}` }}>
                {t("schedule.attendance.studentsCount", { count: totalPeople })}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 11px", borderRadius: 20, background: "rgba(16,185,129,.15)", color: c.text, border: `1px solid ${c.border}` }}>
                {t("schedule.attendance.presentCount", { count: presentCount })}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 11px", borderRadius: 20, background: "rgba(239,68,68,.15)", color: c.text, border: `1px solid ${c.border}` }}>
                {t("schedule.attendance.absentCount", { count: absentCount })}
              </span>
              {makeupEntries.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 11px", borderRadius: 20, background: "#EDE9FE", color: MAKEUP_COLOR, border: `1px solid ${MAKEUP_COLOR}55` }}>
                  {t("schedule.makeup.countBadge", { count: makeupEntries.length })}
                </span>
              )}

              {students.length > 0 && (
                <>
                  <button onClick={() => markAll("PRESENT")} style={{ fontSize: 10, fontWeight: 600, padding: "3px 11px", borderRadius: 20, background: "#E1F5EE", color: "#0F6E56", border: "1px solid #A7F3D0", cursor: "pointer", fontFamily: "inherit" }}>{t("schedule.attendance.markAllPresent")}</button>
                  <button onClick={() => markAll("ABSENT")} style={{ fontSize: 10, fontWeight: 600, padding: "3px 11px", borderRadius: 20, background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer", fontFamily: "inherit" }}>{t("schedule.attendance.markAllAbsent")}</button>
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2.5rem" }}><Spinner size={26} /></div>
          ) : error && !sheet ? (
            <div style={{ padding: "2.5rem", textAlign: "center" }}>
              <AlertCircle size={32} color="#E2A84B" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: "#64748B" }}>{error}</div>
            </div>
          ) : totalPeople === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
              <Users size={32} color="#E2E8F0" style={{ marginBottom: 8 }} />
              <div>{t("schedule.attendance.noStudents")}</div>
            </div>
          ) : (
            <>
              {students.map((s) => {
                const status = marks[s.studentId];
                const rowBg =
                  status === "PRESENT" ? "rgba(225,245,238,.55)" :
                  status === "ABSENT"  ? "rgba(254,226,226,.45)" :
                  "#fff";
                return (
                  <div key={s.studentId} style={{ padding: "10px 1.25rem", borderBottom: "1px solid #F8FAFC", background: rowBg, transition: "background .2s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EBF4FE", border: "2px solid #B5D4F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0C447C", flexShrink: 0 }}>
                        {s.fullName?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{s.fullName}</span>
                          {s.isMakeup && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#EDE9FE", color: MAKEUP_COLOR }}>
                              {t("schedule.makeup.tag")}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{s.level ?? s.parentPhone ?? ""}</div>
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {STATUS_BTNS.map(({ key, Icon, activeColor, activeBg, title }) => (
                          <button key={key} title={title} onClick={() => mark(s.studentId, key)}
                            style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", border: `1.5px solid ${status === key ? activeColor : "#E2E8F0"}`, background: status === key ? activeBg : "#fff", color: status === key ? activeColor : "#CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                            <Icon size={13} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Newly picked تعويض students this session — not yet saved */}
              {makeupEntries.map((m) => {
                const status = marks[m.studentId];
                const rowBg =
                  status === "PRESENT" ? "rgba(225,245,238,.55)" :
                  status === "ABSENT"  ? "rgba(254,226,226,.45)" :
                  "#FAF5FF";
                return (
                  <div key={`makeup-${m.studentId}`} style={{ padding: "10px 1.25rem", borderBottom: "1px solid #F8FAFC", background: rowBg, borderInlineStart: `3px solid ${MAKEUP_COLOR}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EDE9FE", border: `2px solid ${MAKEUP_COLOR}88`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: MAKEUP_COLOR, flexShrink: 0 }}>
                        {m.fullName?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{m.fullName}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#EDE9FE", color: MAKEUP_COLOR }}>
                            {t("schedule.makeup.tag")}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>
                          {t("schedule.makeup.fromGroup", { group: m.fromGroupName })}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {STATUS_BTNS.map(({ key, Icon, activeColor, activeBg, title }) => (
                          <button key={key} title={title} onClick={() => mark(m.studentId, key)}
                            style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", border: `1.5px solid ${status === key ? activeColor : "#E2E8F0"}`, background: status === key ? activeBg : "#fff", color: status === key ? activeColor : "#CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                            <Icon size={13} />
                          </button>
                        ))}
                        <button title={t("schedule.makeup.remove")} onClick={() => handleRemoveMakeup(m.studentId)}
                          style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", border: "1.5px solid #FECACA", background: "#fff", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {error && sheet && <div style={{ padding: "0 1.25rem" }}><ErrorBox msg={error} /></div>}

        <div style={{ padding: ".85rem 1.25rem", borderTop: "1.5px solid #F1F5F9", background: "#FAFCFF", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>{t("schedule.attendance.markedCount", { marked: markedCount, total: totalPeople })}</span>
          <button onClick={handleSave} disabled={submitted || saving || totalPeople === 0}
            style={{ padding: "8px 20px", borderRadius: 9, border: "none", background: submitted ? "#10B981" : P, color: "#fff", fontSize: 13, fontWeight: 600, cursor: submitted ? "default" : "pointer", fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "background .3s" }}>
            {saving ? <Spinner size={14} color="#fff" /> : submitted ? <><Check size={14} /> {t("schedule.attendance.saved")}</> : t("schedule.attendance.save")}
          </button>
        </div>
      </ModalWrap>

      {pickerOpen && (
        <MakeupPickerModal
          moduleId={session.moduleId}
          alreadyAddedIds={[...students.map((s) => s.studentId), ...makeupEntries.map((m) => m.studentId)]}
          onClose={() => setPickerOpen(false)}
          onPick={handleAddMakeup}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  AGENDA VIEW  (unchanged)
// ══════════════════════════════════════════════════════════════════
function AgendaSessionRow({ session, onAttendance }) {
  const { t } = useLanguage();
  const c  = colFor(session.moduleId);
  const PRICING_BADGE = {
    MONTHLY_FLAT: { label: t("schedule.pricing.monthly"), bg: "#EBF4FE", color: "#185FA5" },
    PER_SESSION:  { label: t("schedule.pricing.perSession"), bg: "#FAEEDA", color: "#854F0B" },
  };
  const pm = PRICING_BADGE[session.pricingModel];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px", borderRadius: 12,
      background: "#fff", border: `1.5px solid ${c.border}`,
      marginBottom: 8,
    }}>
      <div style={{
        width: 56, textAlign: "center", flexShrink: 0,
        padding: "6px 4px", borderRadius: 9, background: c.bg,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{fmtTime(session.startTime)}</div>
        <div style={{ fontSize: 9, color: c.text, opacity: .6 }}>{fmtTime(session.endTime)}</div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
            {session.moduleName}
          </span>
          {session.level && (
            <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: "#F1F5F9", color: "#64748B" }}>
              {session.level}
            </span>
          )}
          {pm && (
            <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: pm.bg, color: pm.color }}>
              {pm.label}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span>{t("schedule.attendance.teacherLabel", { name: session.teacherName })}</span>
          <span>{t("schedule.agenda.enrolledCount", { count: session.enrolledCount ?? 0 })}</span>
        </div>
      </div>

      <button
        onClick={() => onAttendance(session)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 9,
          background: session.attendanceMarked ? "#E1F5EE" : P,
          color: session.attendanceMarked ? "#0F6E56" : "#fff",
          fontSize: 11, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", flexShrink: 0,
          border: session.attendanceMarked ? "1.5px solid #A7F3D0" : "none",
        }}
      >
        <Users size={12} />
        {session.attendanceMarked ? t("schedule.agenda.attendanceDone") : t("schedule.agenda.markAttendance")}
      </button>
    </div>
  );
}

function AgendaView({ schoolId, onAttendance, refreshKey }) {
  const { t, locale } = useLanguage();
  const [date,     setDate]     = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await scheduleApi.getSessionsByDate(schoolId, toLocalDate(date));
      setSessions(res.data ?? []);
    } catch {
      setSessions([]);
    } finally { setLoading(false); }
  }, [schoolId, date]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const shiftDay = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d);
  };

  const isToday = toLocalDate(date) === toLocalDate(new Date());

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => shiftDay(-1)} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronRight size={14} color="#64748B" />
          </button>
          <div style={{ textAlign: "center", minWidth: 160 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
              {date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
            </div>
            {isToday && (
              <span style={{ fontSize: 9, fontWeight: 600, color: "#0F6E56", background: "#E1F5EE", padding: "1px 8px", borderRadius: 20, border: "1px solid #A7F3D0" }}>
                {t("schedule.agenda.today")}
              </span>
            )}
          </div>
          <button onClick={() => shiftDay(1)} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={14} color="#64748B" />
          </button>
        </div>

        {!isToday && (
          <button onClick={() => setDate(new Date())} style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${P}`, background: "#EBF4FE", color: P, cursor: "pointer", fontFamily: "inherit" }}>
            {t("schedule.agenda.backToToday")}
          </button>
        )}

        <input
          type="date"
          value={toLocalDate(date)}
          onChange={(e) => setDate(new Date(e.target.value + "T00:00:00"))}
          style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontFamily: "inherit", background: "#fff" }}
        />
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={26} /></div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94A3B8" }}>
          <Calendar size={32} color="#E2E8F0" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13 }}>{t("schedule.agenda.noSessions")}</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 11, color: "#64748B" }}>
            <span>{t("schedule.agenda.sessionsCount", { count: sessions.length })}</span>
            <span style={{ color: "#0F6E56" }}>{t("schedule.agenda.markedCount", { count: sessions.filter((s) => s.attendanceMarked).length })}</span>
            <span style={{ color: "#BA7517" }}>{t("schedule.agenda.pendingCount", { count: sessions.filter((s) => !s.attendanceMarked).length })}</span>
          </div>
          {sessions
            .slice()
            .sort((a, b) => fmtTime(a.startTime).localeCompare(fmtTime(b.startTime)))
            .map((s) => (
              <AgendaSessionRow key={s.id} session={s} onAttendance={onAttendance} />
            ))}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  WEEK GRID VIEW  (unchanged)
// ══════════════════════════════════════════════════════════════════
function ModuleChip({ slot, onEdit, onArchive, onDragStart, onDragEnd }) {
  const { t } = useLanguage();
  const c = colFor(slot.moduleId);
  const PRICING_BADGE = {
    MONTHLY_FLAT: { label: t("schedule.pricing.monthly"), bg: "#EBF4FE", color: "#185FA5" },
    PER_SESSION:  { label: t("schedule.pricing.perSession"), bg: "#FAEEDA", color: "#854F0B" },
  };
  const pm = PRICING_BADGE[slot.pricingModel];
  const [hov, setHov] = useState(false);

  return (
    <div draggable onDragStart={(e) => onDragStart(e, slot)} onDragEnd={onDragEnd}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius: 9, padding: "6px 8px", background: c.bg, border: `1.5px solid ${c.border}`, position: "relative", marginBottom: 4, cursor: "grab", boxShadow: hov ? `0 4px 12px ${c.border}` : "none", transform: hov ? "translateY(-1px)" : "none", transition: "transform .15s, box-shadow .15s", userSelect: "none" }}>
      <div style={{ position: "absolute", top: 4, right: 4, opacity: hov ? .4 : .15 }}>
        <GripVertical size={10} color={c.text} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: c.text, paddingRight: 12 }}>
        {slot.subjectName ?? slot.moduleName}
      </div>
      <div style={{ fontSize: 9, color: c.text, opacity: .75, marginTop: 1 }}>
        {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
        {slot.teacherName && (
          <span style={{ fontSize: 9, color: c.text, opacity: .55 }}>{slot.teacherName}</span>
        )}
        {pm && (
          <span style={{ fontSize: 8, fontWeight: 700, padding: "0 4px", borderRadius: 6, background: "rgba(255,255,255,.6)", color: c.text }}>
            {pm.label}
          </span>
        )}
      </div>
      {hov && (
        <div style={{ position: "absolute", bottom: 3, left: 3, display: "flex", gap: 3 }}>
          {[
            { Icon: Edit2,  color: "#475569", fn: () => onEdit(slot),    title: t("schedule.grid.edit") },
            { Icon: Trash2, color: "#DC2626", fn: () => onArchive(slot), title: t("schedule.grid.archive") },
          ].map(({ Icon, color, fn, title }) => (
            <button key={title} title={title} onClick={(e) => { e.stopPropagation(); fn(); }}
              style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "rgba(255,255,255,.85)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,.1)" }}>
              <Icon size={11} color={color} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DropCell({ dayIdx, timeSlot, children, onDrop }) {
  const [over, setOver] = useState(false);
  return (
    <td onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onDrop(dayIdx, timeSlot); }}
      style={{ padding: "5px 4px", verticalAlign: "top", background: over ? "rgba(24,95,165,.06)" : "transparent", border: over ? `1.5px dashed ${P}` : "1.5px solid transparent", borderRadius: over ? 8 : 0, transition: "background .15s, border .15s" }}>
      <div style={{ minHeight: 48, borderRadius: 8, padding: 2 }}>{children}</div>
    </td>
  );
}

function WeekGrid({ modules, onAddModal, setEditSlot, setArchiveSlot, onModuleArchived }) {
  const { t } = useLanguage();
  const DAYS = t("schedule.days");
  const [slots, setSlots] = useState([]);
  const dragging = useRef(null);

  useEffect(() => {
    const flat = [];
    modules.forEach((m) => {
      (m.schedules ?? []).forEach((sched) => {
        flat.push({
          slotKey:      `${m.id}_${sched.day}_${sched.startTime}`,
          moduleId:     m.id,
          moduleName:   m.name,
          subjectName:  m.subjectName,
          teacherName:  m.teacherName,
          startTime:    sched.startTime,
          endTime:      sched.endTime,
          day:          sched.day,
          pricingModel: m.pricingModel,
        });
      });
    });
    setSlots(flat);
  }, [modules]);

  const handleArchiveConfirm = (slot) => {
    setSlots((prev) => prev.filter((s) => s.moduleId !== slot.moduleId));
    onModuleArchived(slot.moduleId);
  };

  const handleDragStart = (e, slot) => { dragging.current = slot; e.dataTransfer.effectAllowed = "move"; };
  const handleDragEnd   = () => { dragging.current = null; };

  const handleDrop = (targetDayIdx, targetTime) => {
    const slot = dragging.current;
    if (!slot) return;
    const newDay = IDX_TO_DAY[targetDayIdx];
    const [sh, sm] = fmtTime(slot.startTime).split(":").map(Number);
    const [eh, em] = fmtTime(slot.endTime).split(":").map(Number);
    const durMin   = (eh * 60 + em) - (sh * 60 + sm);
    const [nh, nm] = targetTime.split(":").map(Number);
    const newEndMin = nh * 60 + nm + durMin;
    const newEnd    = `${String(Math.floor(newEndMin / 60)).padStart(2, "0")}:${String(newEndMin % 60).padStart(2, "0")}:00`;
    const newStart  = `${targetTime}:00`;
    setSlots((prev) => prev.map((s) => s.slotKey === slot.slotKey
      ? { ...s, day: newDay, startTime: newStart, endTime: newEnd, slotKey: `${s.moduleId}_${newDay}_${newStart}` }
      : s
    ));
  };

  const byDayTime = {};
  const timeSet   = new Set();
  slots.forEach((slot) => {
    const idx = DAY_TO_IDX[slot.day];
    if (idx === undefined) return;
    const time = fmtTime(slot.startTime);
    timeSet.add(time);
    const key = `${idx}_${time}`;
    if (!byDayTime[key]) byDayTime[key] = [];
    byDayTime[key].push(slot);
  });
  const allTimes = [...timeSet].sort();

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflowX: "auto", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640, tableLayout: "fixed" }}>
          <thead>
            <tr style={{ borderBottom: "1.5px solid #F1F5F9", background: "#FAFCFF" }}>
              <th style={{ padding: "11px 10px", fontSize: 11, fontWeight: 700, color: "#94A3B8", textAlign: "right", width: 70 }}>
                <Clock size={12} style={{ verticalAlign: "middle", marginLeft: 3 }} /> {t("schedule.grid.timeHeader")}
              </th>
              {DAYS.map((d, i) => (
                <th key={d} style={{ padding: "11px 8px", fontSize: 11, fontWeight: 700, color: "#475569", textAlign: "center" }}>
                  <div>{d}</div>
                  <button onClick={() => onAddModal(i)}
                    style={{ marginTop: 4, fontSize: 9, padding: "2px 8px", borderRadius: 20, border: "1px dashed #CBD5E1", background: "transparent", color: "#94A3B8", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <Plus size={8} /> {t("schedule.grid.addSessionShort")}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allTimes.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#94A3B8", fontSize: 13 }}>
                  <BookOpen size={32} color="#E2E8F0" style={{ marginBottom: 10 }} />
                  <div>{t("schedule.grid.emptyTitle")}</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>{t("schedule.grid.emptyHint")}</div>
                </td>
              </tr>
            ) : allTimes.map((time, ri) => (
              <tr key={time} style={{ borderBottom: ri < allTimes.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                <td style={{ padding: "6px 10px", whiteSpace: "nowrap", verticalAlign: "top", paddingTop: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>{time}</span>
                </td>
                {DAYS.map((_, dayIdx) => {
                  const key    = `${dayIdx}_${time}`;
                  const inCell = byDayTime[key] ?? [];
                  return (
                    <DropCell key={dayIdx} dayIdx={dayIdx} timeSlot={time} onDrop={handleDrop}>
                      {inCell.map((slot) => (
                        <ModuleChip key={slot.slotKey} slot={slot}
                          onEdit={setEditSlot} onArchive={setArchiveSlot}
                          onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
                      ))}
                    </DropCell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {slots.length > 0 && (
        <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12 }}>
          <GripVertical size={11} />
          {t("schedule.grid.dragHint")}
        </div>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN SCHEDULE PAGE  (unchanged)
// ══════════════════════════════════════════════════════════════════
export default function Schedule() {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const schoolId = user?.schoolId;

  const [view, setView] = useState("agenda");
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [addModal,       setAddModal]       = useState(null);
  const [editSlot,       setEditSlot]       = useState(null);
  const [archiveSlot,    setArchiveSlot]    = useState(null);
  const [attendanceSession, setAttendanceSession] = useState(null);

  const loadModules = useCallback(async () => {
    if (!schoolId) { setLoading(false); setError(t("schedule.errors.noSchool")); return; }
    setLoading(true); setError(null);
    try {
      const res  = await scheduleApi.getModules();
      const mods = res.data?.content ?? res.data ?? [];
      setModules(mods.filter((m) => !m.archived));
    } catch (err) {
      setError(err?.response?.data?.message || t("schedule.errors.loadFailed"));
    } finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { loadModules(); }, [loadModules]);

  const handleModuleArchived = (moduleId) => {
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
  };

  const handleAttendanceClosed = () => {
    setAttendanceSession(null);
    setRefreshKey((k) => k + 1);
  };

  const totalSessions = modules.reduce((sum, m) => sum + (m.schedules?.length ?? 0), 0);

  return (
    <div dir={dir} style={{ padding: "1.25rem 1.5rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("schedule.title")}</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: "3px 0 0" }}>
            {loading ? t("schedule.loading") : t("schedule.subtitle", { sessions: totalSessions, modules: modules.length })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", padding: 3, borderRadius: 10, background: "#fff", border: "1.5px solid #E2E8F0" }}>
            <button onClick={() => setView("agenda")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", background: view === "agenda" ? P : "transparent", color: view === "agenda" ? "#fff" : "#64748B" }}>
              <Calendar size={12} /> {t("schedule.views.agenda")}
            </button>
            <button onClick={() => setView("grid")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", background: view === "grid" ? P : "transparent", color: view === "grid" ? "#fff" : "#64748B" }}>
              <LayoutGrid size={12} /> {t("schedule.views.grid")}
            </button>
          </div>
          <button onClick={loadModules} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <RefreshCw size={13} /> {t("schedule.actions.refresh")}
          </button>
          <button onClick={() => setAddModal({ defaultDayIdx: null })} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: P, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <Plus size={14} /> {t("schedule.actions.addSession")}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Spinner size={32} /></div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "3rem" }}>
          <AlertCircle size={36} color="#E2A84B" />
          <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{error}</p>
          <button onClick={loadModules} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${P}`, background: "#EBF4FE", color: P, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <RefreshCw size={13} /> {t("schedule.actions.retry")}
          </button>
        </div>
      ) : view === "agenda" ? (
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "1.25rem" }}>
          <AgendaView
            schoolId={schoolId}
            onAttendance={setAttendanceSession}
            refreshKey={refreshKey}
          />
        </div>
      ) : (
        <WeekGrid
          modules={modules}
          onAddModal={(dayIdx) => setAddModal({ defaultDayIdx: dayIdx })}
          setEditSlot={setEditSlot}
          setArchiveSlot={setArchiveSlot}
          onModuleArchived={handleModuleArchived}
        />
      )}

      {addModal && (
        <AddModal
          modules={modules}
          defaultDayIdx={addModal.defaultDayIdx}
          onClose={() => setAddModal(null)}
          onCreated={() => { setAddModal(null); loadModules(); setRefreshKey((k) => k + 1); }}
        />
      )}
      {editSlot && (
        <EditModal
          slot={editSlot}
          onClose={() => setEditSlot(null)}
          onSaved={() => { setEditSlot(null); loadModules(); }}
        />
      )}
      {archiveSlot && (
        <ArchiveModal
          slot={archiveSlot}
          onClose={() => setArchiveSlot(null)}
          onConfirm={() => { setArchiveSlot(null); loadModules(); setRefreshKey((k) => k + 1); }}
        />
      )}
      {attendanceSession && (
        <AttendanceSheetModal
          session={attendanceSession}
          onClose={handleAttendanceClosed}
        />
      )}
    </div>
  );
}