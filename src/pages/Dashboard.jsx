import { useEffect, useRef, useState } from "react";
import { useSchool } from "../context/SchoolContext";
import api from "../api/axios";

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ emoji, label, value, sub, subNeutral = false, accent, iconBg }) {
  return (
    <div
      style={{
        background: "#fff", borderRadius: 14, padding: "1.1rem 1.25rem",
        border: "1.5px solid #E8EEF6", position: "relative", overflow: "hidden",
        transition: "border-color .2s, box-shadow .2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8EEF6"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: 4, height: "100%", background: accent, borderRadius: "0 14px 14px 0" }} />
      <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginBottom: 10 }}>
        {emoji}
      </div>
      <div style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 11, color: subNeutral ? "#94A3B8" : "#0F6E56", display: "flex", alignItems: "center", gap: 4 }}>
        {subNeutral ? "—" : "▲"} {sub}
      </div>
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────
function IncomeChart({ data, color }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current || !window.Chart || !data.length) return;
    if (chartRef.current) chartRef.current.destroy();

    const amounts = data.map(m => m.amount);
    const maxIdx  = amounts.indexOf(Math.max(...amounts));

    chartRef.current = new window.Chart(ref.current, {
      type: "bar",
      data: {
        labels: data.map(m => m.month),
        datasets: [{
          label: "الدخل",
          data: amounts,
          backgroundColor: amounts.map((_, i) => i === maxIdx ? color : "#B5D4F4"),
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: v => v.raw.toLocaleString("ar-DZ") + " دج" } },
        },
        scales: {
          x: { ticks: { font: { family: "Cairo", size: 10 }, maxRotation: 0 }, grid: { display: false }, border: { display: false } },
          y: { ticks: { font: { family: "Cairo", size: 10 }, callback: v => (v / 1000) + "K" }, grid: { color: "#F1F5F9" }, border: { display: false } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data, color]);

  return <div style={{ position: "relative", height: 190, width: "100%" }}><canvas ref={ref} /></div>;
}

// ── Card shell ────────────────────────────────────────────
function Card({ title, sub, children }) {
  return (
    <div
      style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1.5px solid #E8EEF6", transition: "border-color .2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#CBD5E1"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#E8EEF6"}
    >
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{title}</span>
          {sub && <span style={{ fontSize: 11, color: "#94A3B8" }}>{sub}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Session row ───────────────────────────────────────────
function SessionRow({ session, isLast }) {
  const COLORS = [
    { bg: "#EBF4FE", color: "#185FA5", border: "#B5D4F4" },
    { bg: "#E1F5EE", color: "#0F6E56", border: "#5DCAA5" },
    { bg: "#FAEEDA", color: "#BA7517", border: "#F0C87A" },
    { bg: "#EEEDFE", color: "#534AB7", border: "#C4C2F5" },
  ];
  const c = COLORS[session.id % COLORS.length];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: isLast ? "none" : "1px solid #F1F5F9" }}>
      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "#EBF4FE", color: "#185FA5", border: "1px solid #B5D4F4", whiteSpace: "nowrap", minWidth: 52, textAlign: "center" }}>
        {session.startTime}
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>
        {session.moduleName}
      </span>
      <span style={{ flex: 1, fontSize: 12, color: "#64748B" }}>{session.teacherName}</span>
      <span style={{ fontSize: 10, color: "#64748B", background: "#F8FAFC", border: "1px solid #CBD5E1", padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>
        {session.classroomName}
      </span>
    </div>
  );
}

// ── DAYS ─────────────────────────────────────────────────
const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// ── Dashboard ─────────────────────────────────────────────
export default function Dashboard() {
  const { school, loading: schoolLoading } = useSchool();
  const p = school.primaryColor;

  const [stats, setStats]             = useState(null);
  const [monthlyIncome, setMonthly]   = useState([]);
  const [todaySessions, setToday]     = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!school.id) return;

    const schoolId = school.id;
    const todayName = DAY_NAMES[new Date().getDay()];

    Promise.all([
      api.get(`/api/school-admin/stats`),
      api.get(`/api/school-admin/revenue/monthly`),
      api.get(`/api/sessions`, { params: { schoolId } }),
    ])
      .then(([statsRes, revenueRes, sessionsRes]) => {
        setStats(statsRes.data);

        // Revenue: expects [{ month, amount }] or similar
        const rev = Array.isArray(revenueRes.data)
          ? revenueRes.data
          : revenueRes.data.content ?? [];
        setMonthly(rev);

        // Today's sessions
        const allSessions = Array.isArray(sessionsRes.data)
          ? sessionsRes.data
          : sessionsRes.data.content ?? [];
        const today = allSessions
          .filter(s => s.day === todayName || s.dayOfWeek === todayName)
          .sort((a, b) => (a.startTime > b.startTime ? 1 : -1));
        setToday(today);
      })
      .catch(err => console.error("Dashboard fetch error:", err))
      .finally(() => setLoadingStats(false));
  }, [school.id]);

  if (schoolLoading || loadingStats) {
    return (
      <div dir="rtl" style={{ padding: "2rem", fontFamily: "'Cairo', sans-serif", color: "#64748B", fontSize: 15 }}>
        جارٍ تحميل البيانات...
      </div>
    );
  }

  const totalYear  = monthlyIncome.reduce((s, m) => s + (m.amount ?? m.totalAmount ?? 0), 0);
  const thisMonth  = monthlyIncome.length ? (monthlyIncome[monthlyIncome.length - 1].amount ?? monthlyIncome[monthlyIncome.length - 1].totalAmount ?? 0) : 0;

  return (
    <div dir="rtl" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", fontFamily: "'Cairo', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* School name header */}
      <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
        لوحة تحكم — {school.schoolName}
        <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 400, marginRight: 10 }}>
          {school.wilaya} · {school.commune}
        </span>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <StatCard
          emoji="💰" label="الدخل السنوي"
          value={totalYear.toLocaleString("ar-DZ") + " دج"}
          sub="إجمالي هذه السنة"
          accent={p} iconBg="#EBF4FE"
        />
        <StatCard
          emoji="📅" label="دخل هذا الشهر"
          value={thisMonth.toLocaleString("ar-DZ") + " دج"}
          sub="الشهر الحالي"
          accent="#0F6E56" iconBg="#E1F5EE"
        />
        <StatCard
          emoji="👥" label="إجمالي التلاميذ"
          value={stats?.totalStudents ?? "—"}
          sub={`${stats?.newStudentsThisMonth ?? 0} جديد هذا الشهر`}
          accent="#BA7517" iconBg="#FAEEDA"
        />
        <StatCard
          emoji="🎓" label="الأساتذة"
          value={stats?.totalTeachers ?? "—"}
          sub="ثابت" subNeutral
          accent="#534AB7" iconBg="#EEEDFE"
        />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: 12 }}>
        <Card title="الدخل الشهري" sub="الدينار الجزائري">
          {monthlyIncome.length > 0
            ? <IncomeChart data={monthlyIncome} color={p} />
            : <div style={{ height: 190, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 13 }}>لا توجد بيانات دخل بعد</div>
          }
        </Card>

        <Card title="معلومات الاشتراك">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            <InfoItem label="حالة الاشتراك" value={school.subscriptionStatus} highlight />
            <InfoItem label="انتهاء الاشتراك" value={school.subscriptionExpiresAt ?? "—"} />
            <InfoItem label="السعر السنوي" value={(school.yearlyPrice ?? 0).toLocaleString("ar-DZ") + " دج"} />
            <InfoItem label="البريد الإلكتروني" value={school.email} />
            <InfoItem label="الهاتف" value={school.phone} />
          </div>
        </Card>
      </div>

      {/* Today's sessions */}
      <Card title="حصص اليوم" sub={DAY_NAMES[new Date().getDay()]}>
        {todaySessions.length === 0
          ? <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 13, padding: "1.5rem 0" }}>لا توجد حصص اليوم</div>
          : todaySessions.map((s, i) => (
              <SessionRow key={s.id} session={s} isLast={i === todaySessions.length - 1} />
            ))
        }
      </Card>
    </div>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
      <span style={{ color: "#64748B" }}>{label}</span>
      <span style={{
        fontWeight: 600,
        color: highlight ? "#0F6E56" : "#0F172A",
        background: highlight ? "#E1F5EE" : "transparent",
        padding: highlight ? "2px 10px" : 0,
        borderRadius: highlight ? 20 : 0,
        border: highlight ? "1px solid #5DCAA5" : "none",
        fontSize: highlight ? 11 : 13,
      }}>
        {value}
      </span>
    </div>
  );
}