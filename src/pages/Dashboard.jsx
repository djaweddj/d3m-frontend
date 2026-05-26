import { useEffect, useRef } from "react";
import { MONTHLY_INCOME, SUBJECT_BREAKDOWN, SCHEDULE } from "../data/Mockdata2";
import { useSchool } from "../context/SchoolContext";

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ emoji, label, value, sub, subNeutral = false, accent, iconBg }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "1.1rem 1.25rem",
      border: "1.5px solid #E8EEF6", position: "relative", overflow: "hidden",
      transition: "border-color .2s, box-shadow .2s",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor="#CBD5E1"; e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.07)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor="#E8EEF6"; e.currentTarget.style.boxShadow="none"; }}
    >
      {/* Left accent bar */}
      <div style={{ position:"absolute", top:0, right:0, width:4, height:"100%", background:accent, borderRadius:"0 14px 14px 0" }} />

      <div style={{ width:36, height:36, borderRadius:10, background:iconBg,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:17, marginBottom:10 }}>
        {emoji}
      </div>
      <div style={{ fontSize:11, color:"#64748B", fontWeight:500, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:"#0F172A", lineHeight:1, marginBottom:6 }}>{value}</div>
      <div style={{ fontSize:11, color: subNeutral ? "#94A3B8" : "#0F6E56", display:"flex", alignItems:"center", gap:4 }}>
        {subNeutral ? "—" : "▲"} {sub}
      </div>
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────
function IncomeChart({ color }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();

    const amounts = MONTHLY_INCOME.map(m => m.amount);
    const maxIdx  = amounts.indexOf(Math.max(...amounts));

    chartRef.current = new window.Chart(ref.current, {
      type: "bar",
      data: {
        labels: MONTHLY_INCOME.map(m => m.month),
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
  }, [color]);

  return <div style={{ position: "relative", height: 190, width: "100%" }}><canvas ref={ref} /></div>;
}

// ── Donut Chart ───────────────────────────────────────────
function DonutChart() {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(ref.current, {
      type: "doughnut",
      data: {
        labels: SUBJECT_BREAKDOWN.map(s => s.label),
        datasets: [{
          data: SUBJECT_BREAKDOWN.map(s => s.value),
          backgroundColor: SUBJECT_BREAKDOWN.map(s => s.color),
          borderWidth: 3,
          borderColor: "#fff",
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: "68%",
      },
    });
    return () => chartRef.current?.destroy();
  }, []);

  return <div style={{ position: "relative", height: 130, width: "100%" }}><canvas ref={ref} /></div>;
}

// ── Card shell ────────────────────────────────────────────
function Card({ title, sub, children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "1.25rem",
      border: "1.5px solid #E8EEF6", transition: "border-color .2s",
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = "#CBD5E1"}
    onMouseLeave={e => e.currentTarget.style.borderColor = "#E8EEF6"}
    >
      {title && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
          <span style={{ fontSize:14, fontWeight:700, color:"#0F172A" }}>{title}</span>
          {sub && <span style={{ fontSize:11, color:"#94A3B8" }}>{sub}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Session row ───────────────────────────────────────────
function SessionRow({ session, isLast }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12, padding:"10px 0",
      borderBottom: isLast ? "none" : "1px solid #F1F5F9",
    }}>
      <span style={{
        fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:8,
        background:"#EBF4FE", color:"#185FA5", border:"1px solid #B5D4F4",
        whiteSpace:"nowrap", minWidth:52, textAlign:"center",
      }}>
        {session.startTime}
      </span>
      <span style={{
        fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:8,
        background: session.color, color: session.textColor,
        border: `1px solid ${session.borderColor || session.color}`,
        whiteSpace:"nowrap",
      }}>
        {session.subject}
      </span>
      <span style={{ flex:1, fontSize:12, color:"#64748B" }}>{session.teacher}</span>
      <span style={{
        fontSize:10, color:"#64748B", background:"#F8FAFC",
        border:"1px solid #CBD5E1", padding:"3px 9px", borderRadius:20, whiteSpace:"nowrap",
      }}>
        قاعة {session.room}
      </span>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────
export default function Dashboard() {
  const { school } = useSchool();
  const p = school.primaryColor;

  const totalYear  = MONTHLY_INCOME.reduce((s, m) => s + m.amount, 0);
  const thisMonth  = MONTHLY_INCOME[MONTHLY_INCOME.length - 1].amount;
  const todaySessions = SCHEDULE
    .filter(s => s.day === 0)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div dir="rtl" style={{ padding:"1.5rem", display:"flex", flexDirection:"column", gap:"1.25rem", fontFamily:"'Cairo', sans-serif", background:"#F8FAFC", minHeight:"100vh" }}>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <StatCard emoji="💰" label="الدخل السنوي"     value={totalYear.toLocaleString("ar-DZ") + " دج"} sub="+12% مقارنة بالعام الماضي"  accent={p}         iconBg="#EBF4FE" />
        <StatCard emoji="📅" label="دخل هذا الشهر"    value={thisMonth.toLocaleString("ar-DZ") + " دج"} sub="+5% مقارنة بالشهر الماضي"   accent="#0F6E56"   iconBg="#E1F5EE" />
        <StatCard emoji="👥" label="إجمالي التلاميذ"  value="142"                                         sub="+8 هذا الشهر"               accent="#BA7517"   iconBg="#FAEEDA" />
        <StatCard emoji="🎓" label="الأساتذة"          value="18"                                          sub="ثابت" subNeutral             accent="#534AB7"   iconBg="#EEEDFE" />
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1.65fr 1fr", gap:12 }}>
        <Card title="الدخل الشهري" sub="الدينار الجزائري">
          <IncomeChart color={p} />
        </Card>

        <Card title="توزيع الإيرادات">
          <DonutChart />
          <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:7 }}>
            {SUBJECT_BREAKDOWN.map(s => (
              <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#64748B" }}>
                <div style={{ width:9, height:9, borderRadius:"50%", background:s.color, flexShrink:0 }} />
                <span style={{ minWidth:70 }}>{s.label}</span>
                <div style={{ flex:1, height:4, background:"#E8EEF6", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ width:`${s.value}%`, height:"100%", background:s.color, borderRadius:4 }} />
                </div>
                <span style={{ color:"#0F172A", fontWeight:600 }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Today's sessions */}
      <Card title="حصص اليوم" sub="الأحد">
        <div>
          {todaySessions.map((s, i) => (
            <SessionRow key={s.id} session={s} isLast={i === todaySessions.length - 1} />
          ))}
        </div>
      </Card>
    </div>
  );
}