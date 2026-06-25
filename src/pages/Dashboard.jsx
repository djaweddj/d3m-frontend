import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/authContext";
import api from "../api";
import { RefreshCw, AlertCircle } from "lucide-react";

// ── helpers ───────────────────────────────────────────────
const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const fmtTime   = (t) => (t ? String(t).slice(0, 5) : "—");

function todayYearMonth() {
  
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Stat card ─────────────────────────────────────────────
function StatCard({ emoji, label, value, sub, subNeutral, accent, iconBg }) {
  return (
    <div
      style={{
        background: "#fff", borderRadius: 14, padding: "1.1rem 1.25rem",
        border: "1.5px solid #E8EEF6", position: "relative", overflow: "hidden",
        transition: "border-color .2s, box-shadow .2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.07)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8EEF6"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: 4, height: "100%", background: accent, borderRadius: "0 14px 14px 0" }} />
      <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginBottom: 10 }}>
        {emoji}
      </div>
      <div style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", lineHeight: 1, marginBottom: 6 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 11, color: subNeutral ? "#94A3B8" : "#0F6E56", display: "flex", alignItems: "center", gap: 4 }}>
        {subNeutral ? "—" : "▲"} {sub}
      </div>
    </div>
  );
}

// ── Bar chart ─────────────────────────────────────────────
function IncomeChart({ data, color }) {
  const ref      = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current || !window.Chart || !data.length) return;
    chartRef.current?.destroy();

    const amounts = data.map((m) => m.totalCollected ?? m.amount ?? 0);
    const maxIdx  = amounts.indexOf(Math.max(...amounts));

    chartRef.current = new window.Chart(ref.current, {
      type: "bar",
      data: {
        labels: data.map((m) => m.period ? String(m.period).slice(0, 7) : m.month ?? ""),
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
          tooltip: { callbacks: { label: (v) => v.raw.toLocaleString("ar-DZ") + " دج" } },
        },
        scales: {
          x: { ticks: { font: { family: "Cairo", size: 10 }, maxRotation: 0 }, grid: { display: false }, border: { display: false } },
          y: { ticks: { font: { family: "Cairo", size: 10 }, callback: (v) => (v / 1000) + "K" }, grid: { color: "#F1F5F9" }, border: { display: false } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data, color]);

  return <div style={{ position: "relative", height: 190, width: "100%" }}><canvas ref={ref} /></div>;
}

function Card({ title, sub, children }) {
  return (
    <div
      style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1.5px solid #E8EEF6", transition: "border-color .2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E8EEF6")}
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
        {value ?? "—"}
      </span>
    </div>
  );
}

function SessionRow({ session, isLast }) {
  const COLORS = [
    { bg: "#EBF4FE", color: "#185FA5", border: "#B5D4F4" },
    { bg: "#E1F5EE", color: "#0F6E56", border: "#5DCAA5" },
    { bg: "#FAEEDA", color: "#BA7517", border: "#F0C87A" },
    { bg: "#EEEDFE", color: "#534AB7", border: "#C4C2F5" },
  ];
  const c = COLORS[(session.id || 0) % COLORS.length];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: isLast ? "none" : "1px solid #F1F5F9" }}>
      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "#EBF4FE", color: "#185FA5", border: "1px solid #B5D4F4", whiteSpace: "nowrap", minWidth: 52, textAlign: "center" }}>
        {fmtTime(session.startTime)}
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>
        {session.moduleName ?? `وحدة #${session.moduleId}`}
      </span>
      <span style={{ flex: 1, fontSize: 12, color: "#64748B" }}>
        {session.teacherName ?? "—"}
      </span>
      <span style={{ fontSize: 10, color: "#64748B", background: "#F8FAFC", border: "1px solid #CBD5E1", padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>
        {new Date(session.date).toLocaleDateString("ar-MA", { day: "numeric", month: "short" })}
      </span>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────
export default function Dashboard() {
  const { user, school } = useAuth();
  const p = school?.primaryColor || "#185FA5";

  const [revenue,       setRevenue]       = useState(null);
  const [monthlyList,   setMonthlyList]   = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  const schoolId = school?.id;

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const period = todayYearMonth();
      const todayDate = new Date().toISOString().slice(0, 10);

      const [revenueRes, sessionsRes] = await Promise.all([
        // GET /api/invoices/school/revenue?period=yyyy-MM  → SchoolRevenueDto
        api.get("/invoices/school/revenue", { params: { period } }),
        // GET /api/sessions/school/{schoolId}  → List<SessionResponseDto>
        api.get(`/sessions/school/${schoolId}`),
      ]);

      setRevenue(revenueRes.data);

      // Build a simple monthly list from current revenue for the chart
      // (single month for now; you can expand to a range later)
      setMonthlyList([revenueRes.data]);

      // Today's sessions: filter by date
      const all = revenueRes.data?.content ?? sessionsRes.data?.content ?? sessionsRes.data ?? [];
      const sessions = Array.isArray(sessionsRes.data)
        ? sessionsRes.data
        : sessionsRes.data?.content ?? [];
      const todayList = sessions
        .filter((s) => !s.isArchived && !s.archived)
        .filter((s) => s.date && String(s.date).slice(0, 10) === todayDate)
        .sort((a, b) => (a.startTime > b.startTime ? 1 : -1));
      setTodaySessions(todayList);
    } catch (err) {
      setError(err?.response?.data?.message || "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [schoolId]);

  if (loading) {
    return (
      <div dir="rtl" style={{ padding: "2rem", fontFamily: "'Cairo', sans-serif", color: "#64748B", fontSize: 15, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #185FA5", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        جارٍ تحميل البيانات...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" style={{ padding: "2rem", fontFamily: "'Cairo', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <AlertCircle size={32} color="#E2A84B" />
        <p style={{ color: "#64748B", fontSize: 13 }}>{error}</p>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, border: "1.5px solid #185FA5", background: "#EBF4FE", color: "#185FA5", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          <RefreshCw size={13} /> إعادة المحاولة
        </button>
      </div>
    );
  }

  const schoolName  = school?.schoolName ?? "المدرسة";
  const wilaya      = school?.wilaya ?? "";
  const commune     = school?.commune ?? "";

  return (
    <div dir="rtl" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", fontFamily: "'Cairo', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
            لوحة التحكم — {schoolName}
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>
            {wilaya}{commune ? ` · ${commune}` : ""}
          </div>
        </div>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          <RefreshCw size={13} /> تحديث
        </button>
      </div>

      {/* Stat cards — from SchoolRevenueDto + school */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <StatCard
          emoji="💰" label="إجمالي المحصّل هذا الشهر"
          value={(revenue?.totalCollected ?? 0).toLocaleString("ar-DZ") + " دج"}
          sub="هذا الشهر" accent={p} iconBg="#EBF4FE"
        />
        <StatCard
          emoji="⏳" label="المبلغ المعلق"
          value={(revenue?.totalPending ?? 0).toLocaleString("ar-DZ") + " دج"}
          sub="فواتير معلقة" accent="#BA7517" iconBg="#FAEEDA"
          subNeutral={!revenue?.totalPending}
        />
        <StatCard
          emoji="🔴" label="المبلغ المتأخر"
          value={(revenue?.totalOverdue ?? 0).toLocaleString("ar-DZ") + " دج"}
          sub="فواتير متأخرة" accent="#DC2626" iconBg="#FEE2E2"
          subNeutral={!revenue?.totalOverdue}
        />
        <StatCard
          emoji="📄" label="عدد الفواتير"
          value={revenue?.invoiceCount ?? "—"}
          sub="هذا الشهر" accent="#534AB7" iconBg="#EEEDFE"
          subNeutral
        />
      </div>

      {/* Chart + school info */}
      <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: 12 }}>
        <Card title="ملخص الدخل الشهري" sub="الدينار الجزائري">
          {monthlyList.length > 0 && (revenue?.totalCollected ?? 0) > 0
            ? <IncomeChart data={monthlyList} color={p} />
            : <div style={{ height: 190, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 13 }}>لا توجد بيانات دخل بعد</div>
          }
        </Card>

        <Card title="معلومات المدرسة">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            <InfoItem label="اسم المدرسة"     value={school?.schoolName} />
            <InfoItem label="المالك"          value={school?.ownerName ?? user?.fullName} />
            <InfoItem label="الولاية"         value={school?.wilaya} />
            <InfoItem label="البريد"          value={school?.email ?? user?.email} />
            <InfoItem label="الهاتف"          value={school?.phone} />
            <InfoItem label="حالة الاشتراك"   value={school?.subscriptionStatus} highlight />
            <InfoItem label="انتهاء الاشتراك" value={school?.subscriptionExpiresAt ?? "—"} />
          </div>
        </Card>
      </div>

      {/* Revenue detail from invoices */}
      {revenue?.invoices?.length > 0 && (
        <Card title="فواتير هذا الشهر" sub={`${revenue.invoices.length} فاتورة`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {revenue.invoices.slice(0, 8).map((inv, i) => {
              const st = inv.status === "PAID"
                ? { bg: "#E1F5EE", color: "#085041", label: "مدفوعة" }
                : inv.status === "OVERDUE"
                ? { bg: "#FEE2E2", color: "#DC2626", label: "متأخرة" }
                : { bg: "#FAEEDA", color: "#BA7517", label: "معلقة" };
              return (
                <div key={inv.id ?? i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: "1px solid #F1F5F9", background: "#FAFCFF" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{inv.studentName ?? "—"}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{inv.moduleName ?? "—"}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                    {(inv.amount ?? 0).toLocaleString("ar-DZ")} دج
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Today's sessions */}
      <Card title="حصص اليوم" sub={DAY_NAMES[new Date().getDay()]}>
        {todaySessions.length === 0
          ? <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 13, padding: "1.5rem 0" }}>لا توجد حصص اليوم</div>
          : todaySessions.map((s, i) => (
            <SessionRow key={s.id ?? i} session={s} isLast={i === todaySessions.length - 1} />
          ))
        }
      </Card>
    </div>
  );
}