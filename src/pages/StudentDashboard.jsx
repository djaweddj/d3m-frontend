import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockStudent, WEEK_DAYS } from "../data/mockStudentData";

// ── palette helpers ────────────────────────────────────────
const SCHOOL_COLORS = [
  { bg: "#EBF4FE", text: "#0C447C", border: "#85B7EB" },   // blue
  { bg: "#E1F5EE", text: "#085041", border: "#5DCAA5" },   // teal
  { bg: "#EEEDFE", text: "#3C3489", border: "#AFA9EC" },   // purple
  { bg: "#FAECE7", text: "#712B13", border: "#F0997B" },   // coral
];
const color = (i) => SCHOOL_COLORS[i % SCHOOL_COLORS.length];

// ── tiny shared components ─────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      border: "0.5px solid #e2e8f0", padding: "1.25rem",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 16, fontWeight: 500, color: "#0f172a", margin: "0 0 1rem" }}>
      {children}
    </h2>
  );
}

function Chip({ children, bg, text, border }) {
  return (
    <span style={{
      background: bg, color: text, border: `0.5px solid ${border}`,
      fontSize: 12, padding: "2px 10px", borderRadius: 6, display: "inline-block",
    }}>
      {children}
    </span>
  );
}

// ── Stat cards row ─────────────────────────────────────────
function StatRow({ student }) {
  const totalSessions = student.enrollments.reduce((a, e) => a + e.sessions.length, 0);
  const totalMonthly  = student.enrollments.reduce((a, e) => a + e.price, 0);

  const stats = [
    { label: "عدد المدارس",    value: student.enrollments.length },
    { label: "إجمالي الحصص",  value: totalSessions              },
    { label: "الرسوم الشهرية", value: `${totalMonthly} درهم`    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: "1.5rem" }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: "#f8fafc", borderRadius: 10, padding: "1rem",
          textAlign: "center", border: "0.5px solid #e2e8f0",
        }}>
          <div style={{ fontSize: 24, fontWeight: 500, color: "#185FA5" }}>{s.value}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Profile sidebar ────────────────────────────────────────
function ProfileCard({ student }) {
  return (
    <Card>
      {/* Avatar */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", background: "#EBF4FE",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 500, color: "#0C447C", marginBottom: 10,
        }}>
          {student.avatar}
        </div>
        <div style={{ fontSize: 17, fontWeight: 500, color: "#0f172a" }}>{student.name}</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>طالب</div>
      </div>

      <hr style={{ border: "none", borderTop: "0.5px solid #e2e8f0", margin: "0 0 1rem" }} />

      {/* Info rows */}
      {[
        { icon: "👤", label: "العمر",   val: `${student.age} سنة`  },
        { icon: "📞", label: "الهاتف",  val: student.phone         },
        { icon: "✉️",  label: "البريد",  val: student.email         },
        { icon: "📅", label: "تاريخ الانضمام", val: student.joinedAt },
      ].map(r => (
        <div key={r.label} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{r.icon}</span>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.label}</div>
            <div style={{ fontSize: 13, color: "#0f172a", marginTop: 1 }}>{r.val}</div>
          </div>
        </div>
      ))}
    </Card>
  );
}

// ── Enrolled schools list ──────────────────────────────────
function SchoolsSection({ enrollments }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {enrollments.map((enr, i) => {
        const c = color(i);
        return (
          <Card key={enr.schoolId}>
            {/* School header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: "1rem" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: c.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                🏫
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: "#0f172a" }}>{enr.schoolName}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  📍 {enr.location} · {enr.teacher}
                </div>
              </div>
              <Chip bg={c.bg} text={c.text} border={c.border}>
                {enr.price} درهم/شهر
              </Chip>
            </div>

            {/* Sessions list */}
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>الحصص الأسبوعية</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {enr.sessions.map(ses => (
                <div key={ses.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", borderRadius: 8, background: c.bg,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: c.text, minWidth: 80 }}>{ses.subject}</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{ses.day}</span>
                  <span style={{ fontSize: 12, color: "#64748b", marginRight: "auto" }}>{ses.time}</span>
                  <span style={{ fontSize: 11, color: c.text, background: "#fff", borderRadius: 4, padding: "1px 7px", border: `0.5px solid ${c.border}` }}>
                    {ses.room}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── Weekly timetable ───────────────────────────────────────
function WeeklyTimetable({ enrollments }) {
  // Build a map: day → [{subject, time, schoolName, colorIdx}]
  const byDay = {};
  WEEK_DAYS.forEach(d => { byDay[d] = []; });

  enrollments.forEach((enr, i) => {
    enr.sessions.forEach(ses => {
      if (byDay[ses.day]) {
        byDay[ses.day].push({ ...ses, schoolName: enr.schoolName, colorIdx: i });
      }
    });
  });

  return (
    <Card>
      <SectionTitle>الجدول الأسبوعي</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
        {WEEK_DAYS.map(day => {
          const slots = byDay[day];
          return (
            <div key={day}>
              <div style={{
                fontSize: 12, fontWeight: 500, color: "#185FA5",
                textAlign: "center", marginBottom: 6, padding: "4px 0",
                borderBottom: "1.5px solid #EBF4FE",
              }}>
                {day}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {slots.length === 0
                  ? <div style={{ height: 40, borderRadius: 6, background: "#f8fafc", border: "0.5px dashed #e2e8f0" }} />
                  : slots.map((s, idx) => {
                      const c = color(s.colorIdx);
                      return (
                        <div key={idx} style={{
                          background: c.bg, border: `0.5px solid ${c.border}`,
                          borderRadius: 6, padding: "5px 6px",
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 500, color: c.text }}>{s.subject}</div>
                          <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{s.time.split(" - ")[0]}</div>
                        </div>
                      );
                    })
                }
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Upcoming sessions ──────────────────────────────────────
function UpcomingSessions({ enrollments }) {
  // Flatten and sort by date
  const all = enrollments.flatMap((enr, i) =>
    enr.upcoming.map(u => ({ ...u, schoolName: enr.schoolName, colorIdx: i }))
  ).sort((a, b) => a.date.localeCompare(b.date));

  const fmt = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-MA", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <Card>
      <SectionTitle>الحصص القادمة</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {all.map((s, i) => {
          const c = color(s.colorIdx);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", borderRadius: 8,
              border: "0.5px solid #e2e8f0", background: "#fafafa",
            }}>
              {/* Date pill */}
              <div style={{
                background: c.bg, border: `0.5px solid ${c.border}`,
                borderRadius: 8, padding: "4px 10px", textAlign: "center", flexShrink: 0,
              }}>
                <div style={{ fontSize: 11, color: c.text, fontWeight: 500 }}>{fmt(s.date)}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{s.time}</div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{s.subject}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.schoolName}</div>
              </div>

              <Chip bg={c.bg} text={c.text} border={c.border}>{s.type}</Chip>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Main Dashboard ─────────────────────────────────────────
export default function StudentDashboard() {
  const navigate = useNavigate();
  const student = mockStudent;

  return (
    <div dir="rtl" style={{
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: "system-ui, Arial, sans-serif", paddingBottom: "3rem",
    }}>

      {/* Top bar */}
      <header style={{
        background: "#fff", borderBottom: "0.5px solid #e2e8f0",
        padding: "0.9rem 1.5rem", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          onClick={() => navigate("/")}>
          <span style={{ fontSize: 24 }}>🎓</span>
          <span style={{ fontSize: 18, fontWeight: 500, color: "#185FA5" }}>منصة مدارس الدعم</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/schools")}
            style={{ padding: "6px 14px", borderRadius: 8, border: "0.5px solid #cbd5e1",
              background: "transparent", color: "#0f172a", fontSize: 13, cursor: "pointer" }}>
            تصفح المدارس
          </button>
          {/* Avatar button */}
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "#EBF4FE",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 500, color: "#0C447C", cursor: "pointer",
          }}>
            {student.avatar}
          </div>
        </div>
      </header>

      {/* Page title */}
      <div style={{ background: "#185FA5", padding: "1.5rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 13, color: "#B5D4F4", marginBottom: 4 }}>مرحباً بك،</div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "#fff", margin: 0 }}>{student.name}</h1>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 1.5rem",
        display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.5rem" }}>

        {/* Left: profile */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <ProfileCard student={student} />

          {/* Quick links */}
          <Card style={{ padding: "1rem" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>روابط سريعة</div>
            {[
              { label: "تصفح المدارس", path: "/schools" },
              { label: "الإعدادات",    path: "/settings" },
            ].map(l => (
              <button key={l.label}
                onClick={() => navigate(l.path)}
                style={{ display: "block", width: "100%", textAlign: "right",
                  padding: "7px 0", background: "none", border: "none",
                  borderBottom: "0.5px solid #f1f5f9", color: "#185FA5",
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                {l.label} ›
              </button>
            ))}
          </Card>
        </div>

        {/* Right: main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <StatRow student={student} />
          <WeeklyTimetable enrollments={student.enrollments} />
          <UpcomingSessions enrollments={student.enrollments} />
          <div>
            <SectionTitle>مدارسي المسجلة</SectionTitle>
            <SchoolsSection enrollments={student.enrollments} />
          </div>
        </div>
      </div>
    </div>
  );
}