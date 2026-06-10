import { useState, useEffect, useCallback } from "react";
import { Plus, X, Edit2, Trash2, Users, Check, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "../context/authContext";
import api from "../api";

// ── API ───────────────────────────────────────────────────
// GET  /api/sessions/school/{schoolId}         → List<SessionResponseDto>
// PUT  /api/sessions/{id}                      → SessionResponseDto  (body: SessionUpdateDto)
// PATCH /api/sessions/{id}/archive
// GET  /api/modules                            → List<CourseModuleResponseDto>
// GET  /api/students/by-module/{moduleId}      → List<StudentResponseDto>

const scheduleApi = {
  getSessions:  (schoolId)    => api.get(`/sessions/school/${schoolId}`),
  updateSession:(id, data)    => api.put(`/sessions/${id}`, data),
  archiveSession:(id)         => api.patch(`/sessions/${id}/archive`),
  getModules:   ()            => api.get("/modules"),
  getStudents:  (moduleId)    => api.get(`/students/by-module/${moduleId}`),
};

// ── Helpers ───────────────────────────────────────────────
const DAYS_AR = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const fmtTime = (t) => (t ? String(t).slice(0, 5) : "—");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("ar-MA", { weekday: "short", month: "short", day: "numeric" }) : "—");

// Map ISO weekday to Arabic index used in DAYS_AR
function dayOfWeekToIdx(date) {
  // JS getDay(): 0=Sun,1=Mon,...,6=Sat
  // Our DAYS_AR: 0=Sat,1=Sun,...
  const jsDay = new Date(date).getDay();
  const map   = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 }; // Sat→0…Thu→5
  return map[jsDay] ?? -1;
}

const SUBJECT_COLORS = [
  { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
  { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  { bg: "#F3E8FF", text: "#6B21A8", border: "#E9D5FF" },
  { bg: "#FFF1F2", text: "#9F1239", border: "#FECDD3" },
  { bg: "#F0FDF4", text: "#14532D", border: "#BBF7D0" },
];
const colFor = (id) => SUBJECT_COLORS[(id || 0) % SUBJECT_COLORS.length];

// ── Sub-components ────────────────────────────────────────
function Spinner({ size = 18 }) {
  return (
    <>
      <div style={{ width: size, height: size, borderRadius: "50%", border: "2px solid #185FA5", borderTopColor: "transparent", animation: "spin 1s linear infinite", flexShrink: 0 }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

function ModalWrap({ onClose, children, maxWidth = 420 }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}
    >
      <div dir="rtl" style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth, border: "1.5px solid #E2E8F0", overflow: "hidden", fontFamily: "'Cairo',sans-serif", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

// ── Students attendance modal ─────────────────────────────
// SessionResponseDto: { id, moduleId, schoolId, date, startTime, endTime }
// students fetched from /students/by-module/{moduleId}
function StudentsModal({ session, moduleMap, onClose }) {
  const mod = moduleMap[session.moduleId];
  const c   = colFor(session.moduleId);

  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [marks,    setMarks]    = useState({}); // id → "present"|"absent"

  useEffect(() => {
    scheduleApi.getStudents(session.moduleId)
      .then((r) => setStudents(r.data?.content ?? r.data ?? []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [session.moduleId]);

  const mark = (id, status) =>
    setMarks((prev) => ({ ...prev, [id]: prev[id] === status ? null : status }));

  const markedCount = Object.values(marks).filter(Boolean).length;

  return (
    <ModalWrap onClose={onClose} maxWidth={480}>
      {/* Header */}
      <div style={{ padding: "1.1rem 1.25rem", background: c.bg, borderBottom: `1.5px solid ${c.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>
              {mod?.subjectName ?? mod?.name ?? `وحدة #${session.moduleId}`}
            </div>
            <div style={{ fontSize: 11, color: c.text, opacity: .8, marginTop: 3, display: "flex", gap: 12 }}>
              <span>👨‍🏫 {mod?.teacherName ?? "—"}</span>
              <span>🕐 {fmtTime(session.startTime)} – {fmtTime(session.endTime)}</span>
              <span>📅 {fmtDate(session.date)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${c.border}`, background: "rgba(255,255,255,.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} color={c.text} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
          {[
            `${students.length} طالب`,
            `${Object.values(marks).filter((v) => v === "present").length} حاضر`,
            `${Object.values(marks).filter((v) => v === "absent").length} غائب`,
          ].map((lbl) => (
            <span key={lbl} style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,.5)", color: c.text, border: `1px solid ${c.border}` }}>{lbl}</span>
          ))}
        </div>
      </div>

      {/* Students */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><Spinner size={24} /></div>
        ) : students.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>لا يوجد تلاميذ في هذه الحصة</div>
        ) : students.map((s, i) => {
          const status = marks[s.id];
          return (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 1.25rem",
              borderBottom: i < students.length - 1 ? "1px solid #F8FAFC" : "none",
              background: status === "present" ? "rgba(225,245,238,.5)" : status === "absent" ? "rgba(254,226,226,.4)" : "#fff",
              transition: "background .2s",
            }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#EBF4FE", border: "2px solid #B5D4F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0C447C", flexShrink: 0 }}>
                {s.fullName?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{s.fullName}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{s.level ?? s.email ?? ""}</div>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => mark(s.id, "present")} title="حاضر"
                  style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", border: `1.5px solid ${status === "present" ? "#0F6E56" : "#E2E8F0"}`, background: status === "present" ? "#E1F5EE" : "#fff", color: status === "present" ? "#0F6E56" : "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                  <Check size={13} />
                </button>
                <button onClick={() => mark(s.id, "absent")} title="غائب"
                  style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", border: `1.5px solid ${status === "absent" ? "#DC2626" : "#E2E8F0"}`, background: status === "absent" ? "#FEE2E2" : "#fff", color: status === "absent" ? "#DC2626" : "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                  <XCircle size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: ".85rem 1.25rem", borderTop: "1.5px solid #F1F5F9", background: "#FAFCFF", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>{markedCount} من {students.length} تم تسجيلهم</span>
        <button onClick={onClose} style={{ padding: "7px 18px", borderRadius: 9, border: "none", background: "#185FA5", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          حفظ الحضور
        </button>
      </div>
    </ModalWrap>
  );
}

// ── Edit time modal ───────────────────────────────────────
// SessionUpdateDto: { startTime, endTime }
function EditModal({ session, onClose, onSaved }) {
  const [start, setStart] = useState(fmtTime(session.startTime));
  const [end,   setEnd]   = useState(fmtTime(session.endTime));
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const inp = { padding: "8px 11px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontSize: 13, fontFamily: "inherit", color: "#0F172A", background: "#FAFCFF", outline: "none", width: "100%", boxSizing: "border-box" };

  const handleSave = async () => {
    if (!start || !end) return setError("أدخل وقتي البداية والنهاية");
    setSaving(true);
    setError("");
    try {
      const res = await scheduleApi.updateSession(session.id, { startTime: start, endTime: end });
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "فشل التحديث");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrap onClose={onClose} maxWidth={340}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1.5px solid #F1F5F9", background: "#FAFCFF", flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>تعديل وقت الحصة</div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={13} color="#64748B" />
        </button>
      </div>
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 11 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>وقت البداية</label>
            <input style={inp} type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>وقت النهاية</label>
            <input style={inp} type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        {error && <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "7px 12px" }}>⚠️ {error}</div>}
      </div>
      <div style={{ display: "flex", gap: 8, padding: "1rem 1.25rem", borderTop: "1.5px solid #F1F5F9", background: "#FAFCFF" }}>
        <button onClick={onClose} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 9, border: "none", background: saving ? "#93B5D9" : "#185FA5", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {saving ? <Spinner size={13} /> : <Check size={13} />}
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>
    </ModalWrap>
  );
}

// ── Delete confirm ────────────────────────────────────────
function DeleteModal({ session, moduleMap, onClose, onConfirm }) {
  const mod = moduleMap[session.moduleId];
  return (
    <ModalWrap onClose={onClose} maxWidth={340}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1.5px solid #F1F5F9", background: "#FAFCFF" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>أرشفة الحصة</div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={13} color="#64748B" />
        </button>
      </div>
      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, margin: 0 }}>
          هل أنت متأكد من أرشفة حصة{" "}
          <strong style={{ color: "#0F172A" }}>{mod?.subjectName ?? mod?.name ?? `#${session.moduleId}`}</strong>
          {" "}بتاريخ <strong style={{ color: "#0F172A" }}>{fmtDate(session.date)}</strong>؟
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ padding: "7px 18px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
          <button onClick={onConfirm} style={{ padding: "7px 20px", borderRadius: 8, border: "none", background: "#E24B4A", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>أرشفة</button>
        </div>
      </div>
    </ModalWrap>
  );
}

// ── Session chip ──────────────────────────────────────────
function SessionChip({ session, mod, onEdit, onDelete, onStudents }) {
  const c = colFor(session.moduleId);
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ borderRadius: 8, padding: "5px 7px", background: c.bg, border: `1.5px solid ${c.border}`, position: "relative", filter: hov ? "brightness(.93)" : "none", boxShadow: hov ? "0 2px 8px rgba(0,0,0,.1)" : "none", transition: "filter .15s,box-shadow .15s", marginBottom: 3 }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: c.text }}>
        {mod?.subjectName ?? mod?.name ?? `وحدة #${session.moduleId}`}
      </div>
      <div style={{ fontSize: 9, color: c.text, opacity: .75, marginTop: 1 }}>
        {fmtTime(session.startTime)} – {fmtTime(session.endTime)}
      </div>
      <div style={{ fontSize: 9, color: c.text, opacity: .6, marginTop: 1 }}>
        {mod?.teacherName ?? ""}
      </div>

      {hov && (
        <div style={{ position: "absolute", top: 3, left: 3, display: "flex", gap: 3 }}>
          {[
            { icon: Edit2,  color: "#475569", fn: onEdit,     title: "تعديل" },
            { icon: Trash2, color: "#DC2626", fn: onDelete,   title: "أرشفة" },
            { icon: Users,  color: "#185FA5", fn: onStudents, title: "التلاميذ" },
          ].map(({ icon: Icon, color, fn, title }) => (
            <button key={title} onClick={(e) => { e.stopPropagation(); fn(); }} title={title}
              style={{ width: 20, height: 20, borderRadius: 5, border: "none", background: "rgba(255,255,255,.8)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={10} color={color} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function Schedule() {
  const { school } = useAuth();
  const schoolId = school?.id;
  const p = school?.primaryColor || "#185FA5";

  const [sessions,   setSessions]  = useState([]);
  const [moduleMap,  setModuleMap] = useState({});
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState(null);
  const [editModal,  setEditModal]  = useState(null); // session
  const [deleteModal,setDeleteModal]= useState(null); // session
  const [studentsModal,setStudents] = useState(null); // session

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const [sessRes, modRes] = await Promise.all([
        scheduleApi.getSessions(schoolId),
        scheduleApi.getModules(),
      ]);
      const raw  = sessRes.data?.content ?? sessRes.data ?? [];
      const mods = modRes.data?.content  ?? modRes.data  ?? [];
      setSessions(raw.filter((s) => !s.isArchived && !s.archived));
      const map = {};
      mods.forEach((m) => { map[m.id] = m; });
      setModuleMap(map);
    } catch (err) {
      setError(err?.response?.data?.message || "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const handleArchive = async (session) => {
    try {
      await scheduleApi.archiveSession(session.id);
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
    } catch {}
    setDeleteModal(null);
  };

  const handleUpdate = (updated) => {
    setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
  };

  // Group sessions by day-of-week for timetable
  // Sessions have `date` (specific date), group by weekday
  const byDay = {}; // dayIdx → SessionResponseDto[]
  DAYS_AR.forEach((_, i) => { byDay[i] = []; });
  sessions.forEach((s) => {
    const idx = dayOfWeekToIdx(s.date);
    if (idx >= 0) byDay[idx].push(s);
  });

  // Time range rows: collect unique startTimes sorted
  const allTimes = [...new Set(sessions.map((s) => fmtTime(s.startTime)))].sort();

  return (
    <div dir="rtl" style={{ padding: "1.25rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>الجدول الأسبوعي</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, margin: 0 }}>
            {loading ? "..." : `${sessions.length} حصة نشطة`}
          </p>
        </div>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          <RefreshCw size={13} /> تحديث
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={28} /></div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "2rem" }}>
          <AlertCircle size={32} color="#E2A84B" />
          <p style={{ color: "#64748B", fontSize: 13 }}>{error}</p>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1.5px solid #185FA5", background: "#EBF4FE", color: "#185FA5", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <RefreshCw size={13} /> إعادة المحاولة
          </button>
        </div>
      ) : (
        <>
          {/* Timetable */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #E2E8F0", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600, tableLayout: "fixed" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #E2E8F0" }}>
                  <th style={{ padding: "10px 8px", fontSize: 11, fontWeight: 700, color: "#64748B", textAlign: "right", width: 72 }}>الوقت</th>
                  {DAYS_AR.map((d) => (
                    <th key={d} style={{ padding: "10px 8px", fontSize: 11, fontWeight: 700, color: "#64748B", textAlign: "center" }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allTimes.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#94A3B8", fontSize: 13 }}>
                      لا توجد حصص — الحصص تُنشأ تلقائياً عند إنشاء وحدة دراسية
                    </td>
                  </tr>
                ) : allTimes.map((time, ri) => (
                  <tr key={time} style={{ borderBottom: ri < allTimes.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                    <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8" }}>{time}</span>
                    </td>
                    {DAYS_AR.map((_, dayIdx) => {
                      const inCell = byDay[dayIdx].filter((s) => fmtTime(s.startTime) === time);
                      return (
                        <td key={dayIdx} style={{ padding: "5px 4px", verticalAlign: "top" }}>
                          <div style={{ minHeight: 44, borderRadius: 8, padding: 2 }}>
                            {inCell.map((s) => (
                              <SessionChip
                                key={s.id}
                                session={s}
                                mod={moduleMap[s.moduleId]}
                                onEdit={()     => setEditModal(s)}
                                onDelete={()   => setDeleteModal(s)}
                                onStudents={() => setStudents(s)}
                              />
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sessions list (upcoming) */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #E8EEF6", padding: "1.25rem" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: "1rem" }}>
              الحصص القادمة
            </div>
            {sessions
              .filter((s) => new Date(s.date) >= new Date())
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .slice(0, 10)
              .map((s, i, arr) => {
                const c   = colFor(s.moduleId);
                const mod = moduleMap[s.moduleId];
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 9, padding: "5px 10px", textAlign: "center", flexShrink: 0, minWidth: 64 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{fmtDate(s.date)}</div>
                      <div style={{ fontSize: 10, color: "#64748B", marginTop: 1 }}>🕐 {fmtTime(s.startTime)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                        {mod?.subjectName ?? mod?.name ?? `وحدة #${s.moduleId}`}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                        👨‍🏫 {mod?.teacherName ?? "—"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => setEditModal(s)} title="تعديل الوقت" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Edit2 size={12} color="#64748B" />
                      </button>
                      <button onClick={() => setStudents(s)} title="التلاميذ" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Users size={12} color="#185FA5" />
                      </button>
                      <button onClick={() => setDeleteModal(s)} title="أرشفة" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={12} color="#DC2626" />
                      </button>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </>
      )}

      {/* Modals */}
      {editModal    && <EditModal    session={editModal}    onClose={() => setEditModal(null)}    onSaved={handleUpdate} />}
      {deleteModal  && <DeleteModal  session={deleteModal}  moduleMap={moduleMap} onClose={() => setDeleteModal(null)} onConfirm={() => handleArchive(deleteModal)} />}
      {studentsModal && <StudentsModal session={studentsModal} moduleMap={moduleMap} onClose={() => setStudents(null)} />}
    </div>
  );
}