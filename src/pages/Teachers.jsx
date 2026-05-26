import { useState } from "react";
import { Plus, Phone, Mail, BookOpen } from "lucide-react";
import { useSchool } from "../context/SchoolContext";
import AddTeacherModal from "../components/AddTeacherModal";
import { TEACHERS as INITIAL_TEACHERS } from "../data/Mockdata2";

export default function Teachers() {
  const { school } = useSchool();
  const p = school.primaryColor;

  const [teachers, setTeachers] = useState(INITIAL_TEACHERS);
  const [showModal, setShowModal] = useState(false);

  const initials = (name) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2);

  const handleSave = (form) => {
    const newTeacher = {
      id: Date.now(),
      name: form.name,
      subject: form.subjects.join(" · "),
      phone: form.phone,
      email: form.email,
      salary: form.salary,
      sessionsPerWeek: form.days.length || 0,
      days: form.days,
      startTime: form.startTime,
      endTime: form.endTime,
    };
    setTeachers((prev) => [...prev, newTeacher]);
    setShowModal(false);
  };

  return (
    <div dir="rtl" style={{ padding: "1.25rem", fontFamily: "'Cairo', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>أساتذتنا</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{teachers.length} أستاذ مسجل</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 16px", borderRadius: 9, border: "none",
            background: p, color: "#fff",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit", transition: "opacity .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <Plus size={15} />
          إضافة أستاذ
        </button>
      </div>

      {/* ── Cards grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
        {teachers.map((t) => (
          <div
            key={t.id}
            style={{
              background: "#fff", borderRadius: 14,
              border: "1.5px solid #E8EEF6",
              padding: "1.25rem 1rem",
              display: "flex", flexDirection: "column", alignItems: "center",
              textAlign: "center", gap: 8,
              transition: "border-color .15s, box-shadow .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8EEF6"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {/* Avatar */}
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: p, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700,
              border: "3px solid #EBF4FE",
            }}>
              {initials(t.name)}
            </div>

            {/* Name */}
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t.name}</p>

            {/* Subject */}
            <p style={{ fontSize: 11, color: "#64748B", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <BookOpen size={11} />
              {t.subject}
            </p>

            {/* Sessions badge */}
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "3px 12px",
              borderRadius: 20, background: "#EBF4FE", color: p,
              border: `1px solid #B5D4F4`,
            }}>
              {t.sessionsPerWeek} حصة / أسبوع
            </span>

            {/* Divider + contact */}
            <div style={{ width: "100%", paddingTop: 10, borderTop: "1.5px solid #F1F5F9", display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                <Phone size={11} style={{ flexShrink: 0 }} />
                <span dir="ltr">{t.phone || "—"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B", overflow: "hidden" }}>
                <Mail size={11} style={{ flexShrink: 0 }} />
                <span dir="ltr" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.email || "—"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add Teacher Modal ── */}
      {showModal && (
        <AddTeacherModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}