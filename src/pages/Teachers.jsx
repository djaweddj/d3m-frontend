import { useState, useEffect, useCallback } from "react";
import { Plus, Phone, Mail, BookOpen, RefreshCw, AlertCircle, X, Check, Archive } from "lucide-react";
import { useAuth } from "../context/authContext";
import api from "../api";

// ── API ───────────────────────────────────────────────────
// GET  /api/teachers           → List<TeacherResponseDto>
// POST /api/teachers           → TeacherResponseDto  (body: TeacherRequestDto)
// PATCH /api/teachers/{id}/archive
// GET  /api/subjects           → List<SubjectResponseDto>

const teacherApi = {
  getAll:    ()        => api.get("/teachers"),
  create:    (data)    => api.post("/teachers", data),
  archive:   (id)      => api.patch(`/teachers/${id}/archive`),
  getSubjects: ()      => api.get("/subjects"),
};

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

// ── Spinner / Error ───────────────────────────────────────
function Spinner({ size = 20 }) {
  return (
    <>
      <div style={{ width: size, height: size, borderRadius: "50%", border: "2px solid #185FA5", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

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
      // TeacherRequestDto: fullName, email, specialization, bio, subjectId, password
      const payload = {
        fullName:       form.fullName,
        email:          form.email,
        specialization: form.specialization,
        bio:            form.bio,
        subjectId:      form.subjectId ? Number(form.subjectId) : null,
        // password is required — backend creates a user account for the teacher
        password:       "Teacher@123", // default; admin should inform teacher to reset
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
            { key: "fullName",       label: "الاسم الكامل *",          type: "text",  placeholder: "اسم الأستاذ" },
            { key: "email",          label: "البريد الإلكتروني *",      type: "email", placeholder: "example@mail.com", dir: "ltr" },
            { key: "specialization", label: "التخصص",                   type: "text",  placeholder: "مثال: رياضيات تطبيقية" },
            { key: "bio",            label: "نبذة مختصرة",              type: "text",  placeholder: "وصف قصير عن الأستاذ" },
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

          {/* Subject select */}
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

// ── Main ──────────────────────────────────────────────────
export default function Teachers() {
  const { school } = useAuth();
  const p = school?.primaryColor || "#185FA5";

  const [teachers,    setTeachers]    = useState([]);
  const [subjects,    setSubjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [showModal,   setShowModal]   = useState(false);
  const [archiving,   setArchiving]   = useState(null); // id being archived

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

  useEffect(() => { load(); }, [load]);

  const handleArchive = async (id) => {
    setArchiving(id);
    try {
      await teacherApi.archive(id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // silently fail — could add toast here
    } finally {
      setArchiving(null);
    }
  };

  // Enrich teacher with subject name
  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const activeTeachers = teachers.filter((t) => !t.archived);

  return (
    <div dir="rtl" style={{ padding: "1.25rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>الأساتذة</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, margin: 0 }}>
            {loading ? "..." : `${activeTeachers.length} أستاذ نشط`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, border: "none", background: p, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = ".88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Plus size={15} /> إضافة أستاذ
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={28} /></div>
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : activeTeachers.length === 0 ? (
        <div style={{ textAlign: "center", color: "#94A3B8", padding: "3rem", fontSize: 13 }}>
          لا يوجد أساتذة مسجلون بعد — أضف أستاذاً جديداً
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
          {activeTeachers.map((t) => (
            <div
              key={t.id}
              style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8EEF6", padding: "1.25rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8, transition: "border-color .15s, box-shadow .15s", position: "relative" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8EEF6"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Archive button */}
              <button
                onClick={() => handleArchive(t.id)}
                disabled={archiving === t.id}
                title="أرشفة الأستاذ"
                style={{ position: "absolute", top: 10, left: 10, width: 26, height: 26, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: .6, transition: "opacity .15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = ".6")}
              >
                {archiving === t.id ? <Spinner size={10} /> : <Archive size={11} color="#DC2626" />}
              </button>

              {/* Avatar */}
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: p, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, border: "3px solid #EBF4FE" }}>
                {initials(t.fullName)}
              </div>

              <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t.fullName}</p>

              {/* Subject */}
              <p style={{ fontSize: 11, color: "#64748B", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                <BookOpen size={11} />
                {subjectMap[t.subjectId] || t.specialization || "—"}
              </p>

              {/* Specialization badge */}
              {t.specialization && (
                <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 12px", borderRadius: 20, background: "#EBF4FE", color: p, border: "1px solid #B5D4F4" }}>
                  {t.specialization}
                </span>
              )}

              {/* Bio */}
              {t.bio && (
                <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, lineHeight: 1.4, textAlign: "center", maxWidth: 160 }}>
                  {t.bio}
                </p>
              )}

              {/* Contact */}
              <div style={{ width: "100%", paddingTop: 10, borderTop: "1.5px solid #F1F5F9", display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                  <Mail size={11} style={{ flexShrink: 0 }} />
                  <span dir="ltr" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.email || "—"}
                  </span>
                </div>
              </div>
            </div>
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