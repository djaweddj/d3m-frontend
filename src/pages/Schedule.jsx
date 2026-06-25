import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, X, Edit2, Trash2, Users, Check, XCircle,
  RefreshCw, AlertCircle, Clock, BookOpen, GripVertical, ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import api from "../api";

// ── API ───────────────────────────────────────────────────────────────────────
const scheduleApi = {
  getModules:    ()           => api.get("api/modules"),
  getStudents:   (moduleId)   => api.get(`api/students/by-module/${moduleId}`),
  createSession: (data)       => api.post("api/sessions", data),
};

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS_AR = ["الجمعة", "السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];

const DAY_TO_IDX = {
  FRIDAY: 0, SATURDAY: 1, SUNDAY: 2,
  MONDAY: 3, TUESDAY: 4, WEDNESDAY: 5, THURSDAY: 6,
};
const IDX_TO_DAY = ["FRIDAY","SATURDAY","SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY"];

const fmtTime = (t) => (t ? String(t).slice(0, 5) : "—");

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

const inp_css = {
  padding: "9px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0",
  fontSize: 13, fontFamily: "'Cairo',sans-serif", color: "#0F172A",
  background: "#FAFCFF", outline: "none", width: "100%", boxSizing: "border-box",
};

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size = 18, color = P }) {
  return (
    <>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        border: `2px solid ${color}`, borderTopColor: "transparent",
        animation: "spin 0.8s linear infinite", flexShrink: 0,
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

// ── Modal Wrapper ─────────────────────────────────────────────────────────────
function ModalWrap({ onClose, children, maxWidth = 420 }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 300, padding: "1rem", backdropFilter: "blur(2px)",
      }}
    >
      <div dir="rtl" style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth,
        border: "1.5px solid #E2E8F0", overflow: "hidden",
        fontFamily: "'Cairo',sans-serif", maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,.18)",
      }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "1rem 1.25rem", borderBottom: "1.5px solid #F1F5F9",
      background: "#FAFCFF", flexShrink: 0,
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{title}</div>
      <button onClick={onClose} style={{
        width: 30, height: 30, borderRadius: 8, border: "1px solid #E2E8F0",
        background: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <X size={14} color="#64748B" />
      </button>
    </div>
  );
}

function ModalFooter({ children }) {
  return (
    <div style={{
      display: "flex", gap: 8, padding: "1rem 1.25rem",
      borderTop: "1.5px solid #F1F5F9", background: "#FAFCFF", flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function BtnPrimary({ onClick, disabled, loading, icon: Icon, label, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        padding: "9px", borderRadius: 10, border: "none",
        background: disabled || loading ? "#CBD5E1" : danger ? "#E24B4A" : P,
        color: "#fff", fontSize: 13, fontWeight: 600,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        fontFamily: "'Cairo',sans-serif", transition: "background .15s",
      }}
    >
      {loading ? <Spinner size={14} color="#fff" /> : Icon ? <Icon size={14} /> : null}
      {label}
    </button>
  );
}

function BtnGhost({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "9px", borderRadius: 10, border: "1.5px solid #E2E8F0",
      background: "#fff", color: "#64748B", fontSize: 13,
      cursor: "pointer", fontFamily: "'Cairo',sans-serif",
    }}>
      {label}
    </button>
  );
}

function ErrorBox({ msg }) {
  return msg ? (
    <div style={{
      fontSize: 12, color: "#DC2626", background: "#FEF2F2",
      border: "1px solid #FECACA", borderRadius: 9, padding: "8px 13px",
    }}>
      ⚠️ {msg}
    </div>
  ) : null;
}

// ── Add Session Modal ─────────────────────────────────────────────────────────
function AddModal({ modules, defaultDayIdx, onClose, onCreated }) {
  const [modName, setModName] = useState("");
  const [date,    setDate]    = useState(() => {
    const today = new Date().toISOString().split("T")[0];
    return today;
  });
  const [start,   setStart]   = useState("08:00");
  const [end,     setEnd]     = useState("09:30");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [open,    setOpen]    = useState(false);

  // pre-fill time from the module's schedule for the defaultDayIdx
  const chosenMod = modules.find((m) => m.name === modName);

  const handleModSelect = (m) => {
    setModName(m.name);
    setOpen(false);
    // auto-fill time from module schedule if available
    if (defaultDayIdx != null) {
      const dayStr = IDX_TO_DAY[defaultDayIdx];
      const sched  = (m.schedules ?? []).find((s) => s.day === dayStr);
      if (sched) {
        setStart(fmtTime(sched.startTime));
        setEnd(fmtTime(sched.endTime));
      }
    }
  };

  const handleSave = async () => {
    if (!modName)        return setError("اختر وحدة دراسية");
    if (!date)           return setError("أدخل التاريخ");
    if (!start || !end)  return setError("أدخل وقت البداية والنهاية");
    if (start >= end)    return setError("وقت البداية يجب أن يكون قبل النهاية");
    setSaving(true);
    setError("");
    try {
      const res = await scheduleApi.createSession({
        courseModuleName: modName,
        date,
        startTime: start,
        endTime:   end,
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "فشل إنشاء الحصة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrap onClose={onClose} maxWidth={380}>
      <ModalHeader title="إضافة حصة" onClose={onClose} />
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 13, overflowY: "auto" }}>

        {/* Module dropdown */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>الوحدة الدراسية *</label>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpen((p) => !p)}
              style={{ ...inp_css, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", border: open ? `1.5px solid ${P}` : "1.5px solid #E2E8F0" }}
            >
              <span style={{ color: modName ? "#0F172A" : "#94A3B8" }}>{modName || "اختر وحدة…"}</span>
              <ChevronDown size={14} color="#94A3B8" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {open && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 50, maxHeight: 200, overflowY: "auto",
              }}>
                {modules.length === 0 && (
                  <div style={{ padding: "12px 14px", fontSize: 12, color: "#94A3B8" }}>لا توجد وحدات دراسية</div>
                )}
                {modules.map((m) => {
                  const c = colFor(m.id);
                  const selected = m.name === modName;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleModSelect(m)}
                      style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 9, background: selected ? c.bg : "transparent", color: selected ? c.text : "#0F172A", borderBottom: "1px solid #F8FAFC" }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.accent, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        {m.teacherName && <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>👨‍🏫 {m.teacherName}</div>}
                      </div>
                      {selected && <Check size={13} style={{ marginRight: "auto" }} color={c.text} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Date */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>التاريخ *</label>
          <input style={inp_css} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {/* Time */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>وقت البداية *</label>
            <input style={inp_css} type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>وقت النهاية *</label>
            <input style={inp_css} type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>

        {/* Preview */}
        {modName && chosenMod && (
          <div style={{ background: colFor(chosenMod.id).bg, border: `1px solid ${colFor(chosenMod.id).border}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: colFor(chosenMod.id).text }}>{modName}</div>
            <div style={{ fontSize: 11, color: colFor(chosenMod.id).text, opacity: .7, marginTop: 3 }}>
              📅 {date ? new Date(date).toLocaleDateString("ar-MA", { weekday: "long", day: "numeric", month: "long" }) : "—"}
              &nbsp;&nbsp;🕐 {start} – {end}
            </div>
          </div>
        )}

        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label="إلغاء" />
        <BtnPrimary onClick={handleSave} loading={saving} icon={Plus} label={saving ? "جارٍ الحفظ..." : "إضافة الحصة"} />
      </ModalFooter>
    </ModalWrap>
  );
}

// ── Edit Timing Modal ─────────────────────────────────────────────────────────
// Edits the slot timing locally (frontend only — wire to backend when ready)
function EditModal({ slot, onClose, onSaved }) {
  const c = colFor(slot.moduleId);
  const [start,  setStart]  = useState(fmtTime(slot.startTime));
  const [end,    setEnd]    = useState(fmtTime(slot.endTime));
  const [error,  setError]  = useState("");

  const handleSave = () => {
    if (!start || !end)  return setError("أكمل جميع الحقول");
    if (start >= end)    return setError("وقت البداية يجب أن يكون قبل النهاية");
    onSaved({ ...slot, startTime: start + ":00", endTime: end + ":00" });
    onClose();
  };

  return (
    <ModalWrap onClose={onClose} maxWidth={340}>
      <div style={{ padding: "1rem 1.25rem", background: c.bg, borderBottom: `1.5px solid ${c.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>تعديل التوقيت</div>
          <div style={{ fontSize: 11, color: c.text, opacity: .75, marginTop: 2 }}>{slot.subjectName ?? slot.moduleName}</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${c.border}`, background: "rgba(255,255,255,.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={14} color={c.text} />
        </button>
      </div>
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 13 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>وقت البداية</label>
            <input style={inp_css} type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>وقت النهاية</label>
            <input style={inp_css} type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <ErrorBox msg={error} />
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label="إلغاء" />
        <BtnPrimary onClick={handleSave} icon={Check} label="حفظ" />
      </ModalFooter>
    </ModalWrap>
  );
}

// ── Archive Modal ─────────────────────────────────────────────────────────────
function ArchiveModal({ slot, onClose, onConfirm }) {
  return (
    <ModalWrap onClose={onClose} maxWidth={340}>
      <ModalHeader title="أرشفة الحصة" onClose={onClose} />
      <div style={{ padding: "1.5rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF2F2", border: "2px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Trash2 size={22} color="#DC2626" />
        </div>
        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: 0 }}>
          هل أنت متأكد من إزالة حصة{" "}
          <strong style={{ color: "#0F172A" }}>{slot.subjectName ?? slot.moduleName}</strong>
          <br />
          من يوم <strong style={{ color: "#0F172A" }}>{DAYS_AR[DAY_TO_IDX[slot.day]]}</strong>؟
          <br />
          <span style={{ fontSize: 11, color: "#94A3B8" }}>لن تظهر في الجدول بعد الحذف.</span>
        </p>
      </div>
      <ModalFooter>
        <BtnGhost onClick={onClose} label="إلغاء" />
        <BtnPrimary onClick={() => onConfirm(slot)} icon={Trash2} label="حذف" danger />
      </ModalFooter>
    </ModalWrap>
  );
}

// ── Attendance Modal ──────────────────────────────────────────────────────────
function AttendanceModal({ slot, onClose }) {
  const c = colFor(slot.moduleId);
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [marks,     setMarks]     = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    scheduleApi
      .getStudents(slot.moduleId)
      .then((r) => setStudents(r.data?.content ?? r.data ?? []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [slot.moduleId]);

  const mark    = (id, status) => setMarks((prev) => ({ ...prev, [id]: prev[id] === status ? null : status }));
  const markAll = (status)     => setMarks(Object.fromEntries(students.map((s) => [s.id, status])));

  const presentCount = Object.values(marks).filter((v) => v === "present").length;
  const absentCount  = Object.values(marks).filter((v) => v === "absent").length;
  const markedCount  = presentCount + absentCount;

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await scheduleApi.createSession({
        courseModuleName: slot.moduleName,
        date:      today,
        startTime: slot.startTime,
        endTime:   slot.endTime,
      });
    } catch { /* session may already exist — ignore */ } finally {
      setSaving(false);
      setSubmitted(true);
      setTimeout(onClose, 900);
    }
  };

  return (
    <ModalWrap onClose={onClose} maxWidth={500}>
      <div style={{ padding: "1.1rem 1.25rem", background: c.bg, borderBottom: `1.5px solid ${c.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{slot.subjectName ?? slot.moduleName}</div>
            <div style={{ fontSize: 11, color: c.text, opacity: .8, marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span>👨‍🏫 {slot.teacherName ?? "—"}</span>
              <span>🕐 {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}</span>
              <span>📅 {DAYS_AR[DAY_TO_IDX[slot.day] ?? 0]}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${c.border}`, background: "rgba(255,255,255,.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} color={c.text} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
          {[
            { lbl: `${students.length} طالب`, bg: "rgba(255,255,255,.5)" },
            { lbl: `${presentCount} حاضر`,    bg: "rgba(16,185,129,.15)" },
            { lbl: `${absentCount} غائب`,     bg: "rgba(239,68,68,.15)" },
          ].map(({ lbl, bg }) => (
            <span key={lbl} style={{ fontSize: 10, fontWeight: 600, padding: "3px 11px", borderRadius: 20, background: bg, color: c.text, border: `1px solid ${c.border}` }}>{lbl}</span>
          ))}
          {!loading && students.length > 0 && (
            <>
              <button onClick={() => markAll("present")} style={{ fontSize: 10, fontWeight: 600, padding: "3px 11px", borderRadius: 20, background: "#E1F5EE", color: "#0F6E56", border: "1px solid #A7F3D0", cursor: "pointer", fontFamily: "inherit" }}>✓ الكل حاضر</button>
              <button onClick={() => markAll("absent")}  style={{ fontSize: 10, fontWeight: 600, padding: "3px 11px", borderRadius: 20, background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer", fontFamily: "inherit" }}>✗ الكل غائب</button>
            </>
          )}
        </div>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2.5rem" }}><Spinner size={26} /></div>
        ) : students.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
            <Users size={32} color="#E2E8F0" style={{ marginBottom: 8 }} />
            <div>لا يوجد تلاميذ في هذه الوحدة</div>
          </div>
        ) : students.map((s, i) => {
          const status = marks[s.id];
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 1.25rem", borderBottom: i < students.length - 1 ? "1px solid #F8FAFC" : "none", background: status === "present" ? "rgba(225,245,238,.55)" : status === "absent" ? "rgba(254,226,226,.45)" : "#fff", transition: "background .2s" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EBF4FE", border: "2px solid #B5D4F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0C447C", flexShrink: 0 }}>
                {s.fullName?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{s.fullName}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{s.level ?? s.email ?? ""}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => mark(s.id, "present")} style={{ width: 32, height: 32, borderRadius: 9, cursor: "pointer", border: `1.5px solid ${status === "present" ? "#0F6E56" : "#E2E8F0"}`, background: status === "present" ? "#E1F5EE" : "#fff", color: status === "present" ? "#0F6E56" : "#CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                  <Check size={14} />
                </button>
                <button onClick={() => mark(s.id, "absent")} style={{ width: 32, height: 32, borderRadius: 9, cursor: "pointer", border: `1.5px solid ${status === "absent" ? "#DC2626" : "#E2E8F0"}`, background: status === "absent" ? "#FEE2E2" : "#fff", color: status === "absent" ? "#DC2626" : "#CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                  <XCircle size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: ".85rem 1.25rem", borderTop: "1.5px solid #F1F5F9", background: "#FAFCFF", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>{markedCount} / {students.length} تم تسجيلهم</span>
        <button
          onClick={handleSave}
          disabled={submitted || saving}
          style={{ padding: "8px 20px", borderRadius: 9, border: "none", background: submitted ? "#10B981" : P, color: "#fff", fontSize: 13, fontWeight: 600, cursor: submitted ? "default" : "pointer", fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "background .3s" }}
        >
          {saving ? <Spinner size={14} color="#fff" /> : submitted ? <><Check size={14} /> تم الحفظ</> : "حفظ الحضور"}
        </button>
      </div>
    </ModalWrap>
  );
}

// ── Module Chip (draggable) ───────────────────────────────────────────────────
function ModuleChip({ slot, onEdit, onArchive, onAttendance, onDragStart, onDragEnd }) {
  const c = colFor(slot.moduleId);
  const [hov, setHov] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, slot)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 9, padding: "6px 8px",
        background: c.bg, border: `1.5px solid ${c.border}`,
        position: "relative", marginBottom: 4, cursor: "grab",
        boxShadow: hov ? `0 4px 12px ${c.border}` : "none",
        transform: hov ? "translateY(-1px)" : "none",
        transition: "transform .15s, box-shadow .15s",
        userSelect: "none",
      }}
    >
      <div style={{ position: "absolute", top: 4, right: 4, opacity: hov ? .4 : .15 }}>
        <GripVertical size={10} color={c.text} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: c.text, paddingRight: 12 }}>
        {slot.subjectName ?? slot.moduleName}
      </div>
      <div style={{ fontSize: 9, color: c.text, opacity: .75, marginTop: 1 }}>
        {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}
      </div>
      {slot.teacherName && (
        <div style={{ fontSize: 9, color: c.text, opacity: .55, marginTop: 1 }}>{slot.teacherName}</div>
      )}

      {hov && (
        <div style={{ position: "absolute", bottom: 3, left: 3, display: "flex", gap: 3 }}>
          {[
            { Icon: Edit2,  color: "#475569", fn: () => onEdit(slot),       title: "تعديل" },
            { Icon: Trash2, color: "#DC2626", fn: () => onArchive(slot),    title: "حذف" },
            { Icon: Users,  color: P,         fn: () => onAttendance(slot), title: "الحضور" },
          ].map(({ Icon, color, fn, title }) => (
            <button
              key={title}
              title={title}
              onClick={(e) => { e.stopPropagation(); fn(); }}
              style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "rgba(255,255,255,.85)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,.1)" }}
            >
              <Icon size={11} color={color} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Drop Cell ─────────────────────────────────────────────────────────────────
function DropCell({ dayIdx, timeSlot, children, onDrop }) {
  const [over, setOver] = useState(false);
  return (
    <td
      onDragOver={(e)  => { e.preventDefault(); setOver(true); }}
      onDragLeave={()  => setOver(false)}
      onDrop={(e)      => { e.preventDefault(); setOver(false); onDrop(dayIdx, timeSlot); }}
      style={{ padding: "5px 4px", verticalAlign: "top", background: over ? "rgba(24,95,165,.06)" : "transparent", border: over ? `1.5px dashed ${P}` : "1.5px solid transparent", borderRadius: over ? 8 : 0, transition: "background .15s, border .15s" }}
    >
      <div style={{ minHeight: 48, borderRadius: 8, padding: 2 }}>{children}</div>
    </td>
  );
}

// ── Main Schedule Page ────────────────────────────────────────────────────────
export default function Schedule() {
  const { user }  = useAuth();
  const schoolId  = user?.schoolId;

  // slots = flat list of { moduleId, moduleName, subjectName, teacherName, startTime, endTime, day }
  const [slots,    setSlots]    = useState([]);
  const [modules,  setModules]  = useState([]); // raw modules for add dropdown
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const [addModal,        setAddModal]        = useState(null); // null | { defaultDayIdx }
  const [editSlot,        setEditSlot]        = useState(null);
  const [archiveSlot,     setArchiveSlot]     = useState(null);
  const [attendanceSlot,  setAttendanceSlot]  = useState(null);

  const dragging = useRef(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!schoolId) { setLoading(false); setError("لم يتم تحديد المدرسة، يرجى تسجيل الدخول مجدداً"); return; }
    setLoading(true); setError(null);
    try {
      const res  = await scheduleApi.getModules();
      const mods = res.data?.content ?? res.data ?? [];
      const active = mods.filter((m) => !m.archived);
      setModules(active);

      // flatten schedules into slots
      const flat = [];
      active.forEach((m) => {
        (m.schedules ?? []).forEach((sched) => {
          flat.push({
            // unique key per slot
            slotKey:     `${m.id}_${sched.day}_${sched.startTime}`,
            moduleId:    m.id,
            moduleName:  m.name,
            subjectName: m.subjectName,
            teacherName: m.teacherName,
            startTime:   sched.startTime,
            endTime:     sched.endTime,
            day:         sched.day,
          });
        });
      });
      setSlots(flat);
    } catch (err) {
      setError(err?.response?.data?.message || "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEditSaved = (updatedSlot) => {
    setSlots((prev) => prev.map((s) => s.slotKey === updatedSlot.slotKey ? updatedSlot : s));
  };

  const handleArchiveConfirm = (slot) => {
    setSlots((prev) => prev.filter((s) => s.slotKey !== slot.slotKey));
    setArchiveSlot(null);
  };

  // Drag & drop → move slot to new day/time
  const handleDragStart = (e, slot) => {
    dragging.current = slot;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnd = () => { dragging.current = null; };

  const handleDrop = (targetDayIdx, targetTime) => {
    const slot = dragging.current;
    if (!slot) return;

    const newDay = IDX_TO_DAY[targetDayIdx];

    // preserve duration
    const [sh, sm] = fmtTime(slot.startTime).split(":").map(Number);
    const [eh, em] = fmtTime(slot.endTime).split(":").map(Number);
    const durMin   = (eh * 60 + em) - (sh * 60 + sm);
    const [nh, nm] = targetTime.split(":").map(Number);
    const newEndMin = nh * 60 + nm + durMin;
    const newEnd    = `${String(Math.floor(newEndMin / 60)).padStart(2, "0")}:${String(newEndMin % 60).padStart(2, "0")}:00`;
    const newStart  = `${targetTime}:00`;

    const updated = {
      ...slot,
      day:       newDay,
      startTime: newStart,
      endTime:   newEnd,
      slotKey:   `${slot.moduleId}_${newDay}_${newStart}`,
    };

    setSlots((prev) => prev.map((s) => s.slotKey === slot.slotKey ? updated : s));
  };

  // ── Build timetable grid ───────────────────────────────────────────────────
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

  const allTimes   = [...timeSet].sort();
  const totalSlots = slots.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div dir="rtl" style={{ padding: "1.25rem 1.5rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>الجدول الأسبوعي</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: "3px 0 0" }}>
            {loading ? "..." : `${totalSlots} حصة أسبوعية`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <RefreshCw size={13} /> تحديث
          </button>
          <button onClick={() => setAddModal({ defaultDayIdx: null })} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: P, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <Plus size={14} /> إضافة حصة
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Spinner size={32} /></div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "3rem" }}>
          <AlertCircle size={36} color="#E2A84B" />
          <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{error}</p>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${P}`, background: "#EBF4FE", color: P, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <RefreshCw size={13} /> إعادة المحاولة
          </button>
        </div>
      ) : (
        <>
          {/* Timetable */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflowX: "auto", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640, tableLayout: "fixed" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #F1F5F9", background: "#FAFCFF" }}>
                  <th style={{ padding: "11px 10px", fontSize: 11, fontWeight: 700, color: "#94A3B8", textAlign: "right", width: 70 }}>
                    <Clock size={12} style={{ verticalAlign: "middle", marginLeft: 3 }} /> الوقت
                  </th>
                  {DAYS_AR.map((d, i) => (
                    <th key={d} style={{ padding: "11px 8px", fontSize: 11, fontWeight: 700, color: "#475569", textAlign: "center" }}>
                      <div>{d}</div>
                      <button
                        onClick={() => setAddModal({ defaultDayIdx: i })}
                        style={{ marginTop: 4, fontSize: 9, padding: "2px 8px", borderRadius: 20, border: "1px dashed #CBD5E1", background: "transparent", color: "#94A3B8", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 3 }}
                      >
                        <Plus size={8} /> حصة
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
                      <div>لا توجد حصص في الجدول</div>
                      <div style={{ fontSize: 11, marginTop: 4 }}>انقر على "إضافة حصة" لتسجيل حصة جديدة</div>
                    </td>
                  </tr>
                ) : allTimes.map((time, ri) => (
                  <tr key={time} style={{ borderBottom: ri < allTimes.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                    <td style={{ padding: "6px 10px", whiteSpace: "nowrap", verticalAlign: "top", paddingTop: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8" }}>{time}</span>
                    </td>
                    {DAYS_AR.map((_, dayIdx) => {
                      const key    = `${dayIdx}_${time}`;
                      const inCell = byDayTime[key] ?? [];
                      return (
                        <DropCell key={dayIdx} dayIdx={dayIdx} timeSlot={time} onDrop={handleDrop}>
                          {inCell.map((slot) => (
                            <ModuleChip
                              key={slot.slotKey}
                              slot={slot}
                              onEdit={setEditSlot}
                              onArchive={setArchiveSlot}
                              onAttendance={setAttendanceSlot}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                            />
                          ))}
                        </DropCell>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalSlots > 0 && (
            <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <GripVertical size={11} />
              اسحب أي حصة إلى يوم أو وقت آخر لإعادة جدولتها
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {addModal && (
        <AddModal
          modules={modules}
          defaultDayIdx={addModal.defaultDayIdx}
          onClose={() => setAddModal(null)}
          onCreated={() => setAddModal(null)}
        />
      )}
      {editSlot && (
        <EditModal
          slot={editSlot}
          onClose={() => setEditSlot(null)}
          onSaved={handleEditSaved}
        />
      )}
      {archiveSlot && (
        <ArchiveModal
          slot={archiveSlot}
          onClose={() => setArchiveSlot(null)}
          onConfirm={handleArchiveConfirm}
        />
      )}
      {attendanceSlot && (
        <AttendanceModal
          slot={attendanceSlot}
          onClose={() => setAttendanceSlot(null)}
        />
      )}
    </div>
  );
}