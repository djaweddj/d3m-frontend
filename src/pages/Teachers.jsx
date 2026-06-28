import { useState, useEffect, useCallback } from "react";
import { Plus, Phone, Mail, BookOpen, RefreshCw, AlertCircle, X, Check, Archive, Eye } from "lucide-react";
import { useAuth } from "../context/authContext";
import api from "../api";

// ── API ───────────────────────────────────────────────────
// GET  /api/teachers                → List<TeacherResponseDto>  (active only)
// GET  /api/teachers/archived       → List<TeacherResponseDto>  (archived only)
// POST /api/teachers                → TeacherResponseDto
// PATCH /api/teachers/{id}/archive
// PATCH /api/teachers/{id}/unarchive
// GET  /api/subjects                → List<SubjectResponseDto>

const teacherApi = {
  getAll:       ()     => api.get("api/teachers"),
  getArchived:  ()     => api.get("api/teachers/archived"),
  create:       (data) => api.post("api/teachers/create", data),
  archive:      (id)   => api.patch(`api/teachers/${id}/archive`),
  unarchive:    (id)   => api.patch(`api/teachers/${id}/unarchive`),
  getSubjects:  ()     => api.get("api/subjects"),
};

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

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
    fullName: "", email: "", specialization: "", bio: "", subjectId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const inp = {
    padding: "8px 11px", borderRadius: 9, border: "1.5px solid #E2E8F0",
    fontSize: 13, fontFamily: "inherit", color: "#0F172A",
    background: "#FAFCFF", outline: "none", width: "100%", boxSizing: "border-box",
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) return setError("الاسم مطلوب");
    if (!form.email.trim())    return setError("البريد الإلكتروني مطلوب");
    setSaving(true);
    setError("");
    try {
      const payload = {
        fullName:       form.fullName,
        email:          form.email,
        specialization: form.specialization,
        bio:            form.bio,
        subjectId:      form.subjectId ? Number(form.subjectId) : null,
        password:       "Teacher@123",
      };
      const res = await teacherApi.create(payload);
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}
    >
      <div dir="rtl" style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 420, border: "1.5px solid #E2E8F0", overflow: "hidden", fontFamily: "'Cairo',sans-serif" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1.5px solid #F1F5F9", background: "#FAFCFF" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#EBF4FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👨‍🏫</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>إضافة أستاذ جديد</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>سيتم إنشاء حساب للأستاذ تلقائياً</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={13} color="#64748B" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 11 }}>
          {[
            { key: "fullName",       label: "الاسم الكامل *",      type: "text",  placeholder: "اسم الأستاذ" },
            { key: "email",          label: "البريد الإلكتروني *",  type: "email", placeholder: "example@mail.com", dir: "ltr" },
            { key: "specialization", label: "التخصص",               type: "text",  placeholder: "مثال: رياضيات تطبيقية" },
            { key: "bio",            label: "نبذة مختصرة",          type: "text",  placeholder: "وصف قصير عن الأستاذ" },
          ].map(({ key, label, type, placeholder, dir: d }) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>{label}</label>
              <input
                style={{ ...inp, direction: d || "rtl" }}
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>المادة الدراسية</label>
            <select
              style={{ ...inp, cursor: "pointer" }}
              value={form.subjectId}
              onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
            >
              <option value="">-- اختر مادة --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "7px 12px" }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 8, padding: "1rem 1.25rem", borderTop: "1.5px solid #F1F5F9", background: "#FAFCFF" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 9, border: "none", background: saving ? "#93B5D9" : primaryColor, color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
          >
            {saving ? <Spinner size={13} /> : <Check size={13} />}
            {saving ? "جارٍ الحفظ..." : "إضافة الأستاذ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Teacher Card ──────────────────────────────────────────
function TeacherCard({ t, subjectMap, primaryColor, isArchived, onArchive, onUnarchive, actionId }) {
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
      {/* Action button top-left */}
      {isArchived ? (
        // Unarchive button
        <button
          onClick={() => onUnarchive(t.id)}
          disabled={actionId === t.id}
          title="استعادة الأستاذ"
          style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 7, border: "1px solid #D1FAE5", background: "#ECFDF5", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#059669", transition: "opacity .15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = ".8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {actionId === t.id ? <Spinner size={10} /> : <RefreshCw size={10} />}
          استعادة
        </button>
      ) : (
        // Archive button
        <button
          onClick={() => onArchive(t.id)}
          disabled={actionId === t.id}
          title="أرشفة الأستاذ"
          style={{ position: "absolute", top: 10, left: 10, width: 26, height: 26, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: .6, transition: "opacity .15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = ".6")}
        >
          {actionId === t.id ? <Spinner size={10} /> : <Archive size={11} color="#DC2626" />}
        </button>
      )}

      {/* Archived badge */}
      {isArchived && (
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
        {subjectMap[t.subjectId] || t.specialization || "—"}
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

  const [teachers,         setTeachers]         = useState([]);
  const [archivedTeachers, setArchivedTeachers] = useState([]);
  const [subjects,         setSubjects]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [archivedLoading,  setArchivedLoading]  = useState(false);
  const [error,            setError]            = useState(null);
  const [showModal,        setShowModal]        = useState(false);
  const [showArchived,     setShowArchived]     = useState(false);
  const [actionId,         setActionId]         = useState(null); // id being archived/unarchived

  // Load active teachers + subjects
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, sRes] = await Promise.all([
        teacherApi.getAll(),
        teacherApi.getSubjects(),
      ]);
      setTeachers(tRes.data?.content ?? tRes.data ?? []);
      setSubjects(sRes.data?.content ?? sRes.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load archived teachers (only when panel is opened)
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

  // When archived panel opens, fetch archived list
  useEffect(() => {
    if (showArchived) loadArchived();
  }, [showArchived, loadArchived]);

  const handleArchive = async (id) => {
    setActionId(id);
    try {
      await teacherApi.archive(id);
      // Remove from active list
      const archived = teachers.find((t) => t.id === id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      // If archived panel is open, add to it
      if (showArchived && archived) {
        setArchivedTeachers((prev) => [{ ...archived, archived: true }, ...prev]);
      }
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
      // Remove from archived list
      const restored = archivedTeachers.find((t) => t.id === id);
      setArchivedTeachers((prev) => prev.filter((t) => t.id !== id));
      // Add back to active list
      if (restored) {
        setTeachers((prev) => [{ ...restored, archived: false }, ...prev]);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "فشلت الاستعادة");
    } finally {
      setActionId(null);
    }
  };

  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
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
          {/* Refresh */}
          <button
            onClick={showArchived ? loadArchived : load}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            <RefreshCw size={13} />
          </button>

          {/* Toggle archived */}
          <button
            onClick={() => setShowArchived((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 14px", borderRadius: 9,
              border: `1.5px solid ${showArchived ? "#FECACA" : "#E2E8F0"}`,
              background: showArchived ? "#FEF2F2" : "#fff",
              color: showArchived ? "#DC2626" : "#64748B",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              transition: "all .15s",
            }}
          >
            <Archive size={13} />
            {showArchived ? "إخفاء المؤرشفين" : "الأساتذة المؤرشفون"}
          </button>

          {/* Add teacher — only shown in active view */}
          {!showArchived && (
            <button
              onClick={() => setShowModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, border: "none", background: p, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = ".88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Plus size={15} /> إضافة أستاذ
            </button>
          )}
        </div>
      </div>

      {/* Archived section label */}
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
              key={t.id}
              t={t}
              subjectMap={subjectMap}
              primaryColor={p}
              isArchived={showArchived}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              actionId={actionId}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddTeacherModal
          subjects={subjects}
          primaryColor={p}
          onClose={() => setShowModal(false)}
          onSaved={(newTeacher) => setTeachers((prev) => [newTeacher, ...prev])}
        />
      )}
    </div>
  );
}