import { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "../context/authContext";
import api from "../api";
import { RefreshCw, AlertCircle, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";

// ══════════════════════════════════════════════════════════════════
//  CONSTANTS & HELPERS
// ══════════════════════════════════════════════════════════════════
const ARABIC_MONTHS = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const todayYM = () => {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
};

// "2025-03" -> {y:2025, m:3}
const parseYM = (str) => {
  const [y, m] = str.split("-").map(Number);
  return { y, m };
};
const ymToStr = ({ y, m }) => `${y}-${String(m).padStart(2, "0")}`;
const ymLabel = ({ y, m }) => `${ARABIC_MONTHS[m - 1]} ${y}`;
const ymShortLabel = ({ y, m }) => `${ARABIC_MONTHS[m - 1].slice(0, 4)}`;

const shiftYM = ({ y, m }, delta) => {
  const total = y * 12 + (m - 1) + delta;
  return { y: Math.floor(total / 12), m: (total % 12) + 1 };
};

const ymLTE = (a, b) => a.y < b.y || (a.y === b.y && a.m <= b.m);

const fmtMoney = (n) => (n ?? 0).toLocaleString("en-US") + " دج";
const fmtMoneyShort = (n) => {
  const v = n ?? 0;
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "م";
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(0) + "ك";
  return String(v);
};

const STATUS_META = {
  PAID:    { bg: "#E1F5EE", color: "#0B6B52", label: "مدفوعة" },
  PENDING: { bg: "#FCF0DA", color: "#9A6208", label: "معلقة" },
  OVERDUE: { bg: "#FCE4E4", color: "#C0362C", label: "متأخرة" },
  CANCELLED: { bg: "#F1F5F9", color: "#64748B", label: "ملغاة" },
};

// ══════════════════════════════════════════════════════════════════
//  PRIMITIVES
// ══════════════════════════════════════════════════════════════════

function StatCard({ emoji, label, value, sub, subNeutral, accent, iconBg, trend }) {
  return (
    <div className="stat-card" style={{ "--accent": accent, "--iconBg": iconBg }}>
      <div className="stat-card__bar" />
      <div className="stat-card__icon">{emoji}</div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value ?? "—"}</div>
      {trend !== undefined && trend !== null ? (
        <div className={`stat-card__trend ${trend >= 0 ? "up" : "down"}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend).toFixed(0)}٪ عن الشهر الماضي
        </div>
      ) : (
        <div className="stat-card__sub" style={{ opacity: subNeutral ? 0.6 : 1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function Card({ title, sub, right, children, style, className = "" }) {
  return (
    <div className={`panel ${className}`} style={style}>
      {(title || right) && (
        <div className="panel__head">
          <div>
            <div className="panel__title">{title}</div>
            {sub && <div className="panel__sub">{sub}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <div className="info-item">
      <span className="info-item__label">{label}</span>
      <span className={`info-item__value ${highlight ? "info-item__value--pill" : ""}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ── Month range picker ──────────────────────────────────────────
function MonthRangePicker({ from, to, onChange }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const presets = [
    { label: "٦ أشهر", n: 6 },
    { label: "١٢ شهر", n: 12 },
    { label: "٣ أشهر", n: 3 },
  ];

  const applyPreset = (n) => {
    const end = todayYM();
    onChange({ from: shiftYM(end, -(n - 1)), to: end });
    setOpen(false);
  };

  return (
    <div className="range-picker" ref={boxRef}>
      <button className="range-picker__trigger" onClick={() => setOpen((o) => !o)}>
        <span>{ymLabel(from)} – {ymLabel(to)}</span>
        <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      {open && (
        <div className="range-picker__panel">
          <div className="range-picker__presets">
            {presets.map((p) => (
              <button key={p.n} className="range-picker__preset" onClick={() => applyPreset(p.n)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="range-picker__custom">
            <label>
              من
              <input
                type="month"
                value={ymToStr(from)}
                max={ymToStr(to)}
                onChange={(e) => onChange({ from: parseYM(e.target.value), to })}
              />
            </label>
            <label>
              إلى
              <input
                type="month"
                value={ymToStr(to)}
                min={ymToStr(from)}
                max={ymToStr(todayYM())}
                onChange={(e) => onChange({ from, to: parseYM(e.target.value) })}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Comparison chart: collected vs school part, per month ───────
function ComparisonChart({ data, highlightIndex }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current || !window.Chart || !data.length) return;
    chartRef.current?.destroy();

    const labels = data.map((d) => ymShortLabel(parseYM(d.period)));
    const collected = data.map((d) => d.totalCollected ?? 0);
    const schoolPart = data.map((d) => d.schoolPart ?? 0);

    chartRef.current = new window.Chart(ref.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "المحصّل",
            data: collected,
            backgroundColor: collected.map((_, i) => (i === highlightIndex ? "#185FA5" : "#BBD8F3")),
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 26,
          },
          {
            label: "حصة المدرسة",
            data: schoolPart,
            backgroundColor: schoolPart.map((_, i) => (i === highlightIndex ? "#0F6E56" : "#A9DDC9")),
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 26,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { family: "Cairo", size: 11 }, boxWidth: 10, boxHeight: 10, padding: 14, usePointStyle: true, pointStyle: "circle" },
          },
          tooltip: {
            rtl: true,
            titleFont: { family: "Cairo" },
            bodyFont: { family: "Cairo" },
            callbacks: { label: (v) => `${v.dataset.label}: ${v.raw.toLocaleString("en-US")} دج` },
          },
        },
        scales: {
          x: { ticks: { font: { family: "Cairo", size: 11 } }, grid: { display: false }, border: { display: false } },
          y: {
            ticks: { font: { family: "Cairo", size: 10 }, callback: (v) => fmtMoneyShort(v) },
            grid: { color: "#F1F5F9" },
            border: { display: false },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data, highlightIndex]);

  return <div className="chart-wrap"><canvas ref={ref} /></div>;
}

// ══════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { user } = useAuth();
  const BLUE = "#185FA5";

  const [schoolInfo, setSchoolInfo] = useState(null);
  const [range, setRange] = useState(() => {
    const end = todayYM();
    return { from: shiftYM(end, -5), to: end }; // last 6 months by default
  });
  const [rangeData, setRangeData] = useState([]); // SchoolRevenueDto[]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (r = range) => {
    setLoading(true);
    setError(null);
    try {
      const [schoolRes, revenueRes] = await Promise.all([
        api.get("/api/schools/one"),
        api.get("/api/invoices/school/revenue/range", {
          params: { from: ymToStr(r.from), to: ymToStr(r.to) },
        }),
      ]);
      setSchoolInfo(schoolRes.data);
      setRangeData(revenueRes.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(range); }, [range.from.y, range.from.m, range.to.y, range.to.m]); // eslint-disable-line

  // The selected/current month is always the last one in the range
  const current = rangeData[rangeData.length - 1] ?? null;
  const previous = rangeData[rangeData.length - 2] ?? null;

  const trendPct = useMemo(() => {
    if (!current || !previous || !previous.totalCollected) return null;
    return ((current.totalCollected - previous.totalCollected) / previous.totalCollected) * 100;
  }, [current, previous]);

  const schoolPartTrendPct = useMemo(() => {
    if (!current || !previous || !previous.schoolPart) return null;
    return ((current.schoolPart - previous.schoolPart) / previous.schoolPart) * 100;
  }, [current, previous]);

  if (loading) {
    return (
      <div dir="rtl" className="dash-loading">
        <DashStyles />
        <div className="spinner" />
        جارٍ تحميل البيانات...
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="dash-error">
        <DashStyles />
        <AlertCircle size={32} color="#E2A84B" />
        <p>{error}</p>
        <button className="btn btn--primary" onClick={() => load(range)}>
          <RefreshCw size={13} /> إعادة المحاولة
        </button>
      </div>
    );
  }

  const schoolName = schoolInfo?.schoolName ?? user?.schoolName ?? "المدرسة";
  const wilaya = schoolInfo?.wilaya ?? user?.wilaya ?? "";

  return (
    <div dir="rtl" className="dash">
      <DashStyles />

      {/* ── Header ── */}
      <div className="dash-header">
        <div>
          <div className="dash-header__title">لوحة التحكم — {schoolName}</div>
          <div className="dash-header__sub">{wilaya}</div>
        </div>
        <div className="dash-header__actions">
          <MonthRangePicker from={range.from} to={range.to} onChange={setRange} />
          <button className="btn btn--ghost" onClick={() => load(range)}>
            <RefreshCw size={13} /> تحديث
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stat-grid">
        <StatCard
          emoji="💰" label={`المحصّل — ${current ? ymLabel(parseYM(current.period)) : ""}`}
          value={fmtMoney(current?.totalCollected)}
          trend={trendPct}
          accent={BLUE} iconBg="#EBF4FE"
        />
        <StatCard
          emoji="🏫" label="حصة المدرسة"
          value={fmtMoney(current?.schoolPart)}
          trend={schoolPartTrendPct}
          accent="#0F6E56" iconBg="#E1F5EE"
        />
        <StatCard
          emoji="⏳" label="المبلغ المعلق"
          value={fmtMoney(current?.totalPending)}
          sub="فواتير معلقة" accent="#BA7517" iconBg="#FCF0DA"
          subNeutral={!current?.totalPending}
        />
        <StatCard
          emoji="🔴" label="المبلغ المتأخر"
          value={fmtMoney(current?.totalOverdue)}
          sub="فواتير متأخرة" accent="#DC2626" iconBg="#FCE4E4"
          subNeutral={!current?.totalOverdue}
        />
        <StatCard
          emoji="🎓" label="عدد الطلاب"
          value={schoolInfo?.totalStudents ?? "—"}
          sub="طالب مسجّل" accent="#534AB7" iconBg="#EEEDFE"
          subNeutral={!schoolInfo?.totalStudents}
        />
        <StatCard
          emoji="📄" label="عدد الفواتير"
          value={current?.invoiceCount ?? "—"}
          sub={current ? ymLabel(parseYM(current.period)) : ""} accent="#64748B" iconBg="#F1F5F9" subNeutral
        />
      </div>

      {/* ── Chart + School info ── */}
      <div className="two-col">
        <Card
          title="مقارنة الدخل بين الأشهر"
          sub={`${ymLabel(range.from)} – ${ymLabel(range.to)}`}
          className="chart-card"
        >
          {rangeData.length > 0 && rangeData.some((d) => (d.totalCollected ?? 0) > 0)
            ? <ComparisonChart data={rangeData} highlightIndex={rangeData.length - 1} />
            : <div className="empty-state">لا توجد بيانات دخل لهذه الفترة</div>
          }
        </Card>

        <Card title="معلومات المدرسة">
          <div className="info-list">
            <InfoItem label="اسم المدرسة" value={schoolInfo?.schoolName} />
            <InfoItem label="المالك" value={schoolInfo?.ownerName} />
            <InfoItem label="الولاية" value={schoolInfo?.wilaya} />
            <InfoItem label="البريد" value={schoolInfo?.email} />
            <InfoItem label="حالة الاشتراك" value={schoolInfo?.subscriptionStatus} highlight />
            <InfoItem
              label="انتهاء الاشتراك"
              value={
                schoolInfo?.subscriptionExpiresAt
                  ? new Date(schoolInfo.subscriptionExpiresAt).toLocaleDateString("ar-MA", {
                      year: "numeric", month: "long", day: "numeric",
                    })
                  : "—"
              }
            />
          </div>
        </Card>
      </div>

      {/* ── Invoices list ── */}
      {current?.invoices?.length > 0 && (
        <Card title="فواتير هذا الشهر" sub={`${current.invoices.length} فاتورة`}>
          <div className="invoice-list">
            {current.invoices.slice(0, 8).map((inv, i) => {
              const st = STATUS_META[inv.status] ?? STATUS_META.PENDING;
              return (
                <div key={inv.id ?? i} className="invoice-row">
                  <div className="invoice-row__main">
                    <div className="invoice-row__name">{inv.studentName ?? "—"}</div>
                    <div className="invoice-row__module">{inv.moduleName ?? "—"}</div>
                  </div>
                  <div className="invoice-row__amount">{fmtMoney(inv.amount)}</div>
                  <span className="invoice-row__badge" style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════════════
function DashStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }

      .dash {
        padding: 1.25rem;
        display: flex; flex-direction: column; gap: 1.1rem;
        font-family: 'Cairo', sans-serif;
        background: #F7FAFD;
        min-height: 100vh;
      }
      @media (min-width: 768px) { .dash { padding: 1.75rem; } }

      @keyframes spin { to { transform: rotate(360deg); } }
      .spinner {
        width: 18px; height: 18px; border-radius: 50%;
        border: 2px solid #185FA5; border-top-color: transparent;
        animation: spin 1s linear infinite;
      }
      .dash-loading {
        padding: 2rem; font-family: 'Cairo', sans-serif; color: #64748B; font-size: 15px;
        display: flex; align-items: center; gap: 10px;
      }
      .dash-error {
        padding: 2rem; font-family: 'Cairo', sans-serif;
        display: flex; flex-direction: column; align-items: center; gap: 12px;
      }
      .dash-error p { color: #64748B; font-size: 13px; margin: 0; }

      /* ── Header ── */
      .dash-header {
        display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
        flex-wrap: wrap;
      }
      .dash-header__title { font-size: 19px; font-weight: 700; color: #0F172A; }
      .dash-header__sub { font-size: 12px; color: #94A3B8; margin-top: 3px; }
      .dash-header__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

      .btn {
        display: flex; align-items: center; gap: 6px;
        padding: 8px 14px; border-radius: 9px;
        font-size: 12.5px; cursor: pointer; font-family: inherit;
        white-space: nowrap; border: 1.5px solid transparent;
      }
      .btn--ghost { border-color: #E2E8F0; background: #fff; color: #64748B; }
      .btn--ghost:hover { border-color: #CBD5E1; }
      .btn--primary { border-color: #185FA5; background: #EBF4FE; color: #185FA5; }

      /* ── Month range picker ── */
      .range-picker { position: relative; }
      .range-picker__trigger {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 14px; border-radius: 9px;
        border: 1.5px solid #E2E8F0; background: #fff;
        color: #0F172A; font-size: 12.5px; font-weight: 600;
        cursor: pointer; font-family: inherit; white-space: nowrap;
      }
      .range-picker__trigger:hover { border-color: #CBD5E1; }
      .range-picker__panel {
        position: absolute; top: calc(100% + 8px); left: 0; z-index: 20;
        background: #fff; border: 1.5px solid #E8EEF6; border-radius: 12px;
        padding: 12px; box-shadow: 0 10px 30px rgba(15,23,42,.12);
        min-width: 240px;
      }
      .range-picker__presets { display: flex; gap: 6px; margin-bottom: 10px; }
      .range-picker__preset {
        flex: 1; padding: 6px 8px; border-radius: 7px;
        border: 1.5px solid #E2E8F0; background: #F8FAFC;
        font-size: 11.5px; font-family: inherit; cursor: pointer; color: #334155;
      }
      .range-picker__preset:hover { background: #EBF4FE; border-color: #B5D4F4; color: #185FA5; }
      .range-picker__custom { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid #F1F5F9; padding-top: 10px; }
      .range-picker__custom label { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748B; gap: 8px; }
      .range-picker__custom input {
        font-family: inherit; font-size: 12px; border: 1.5px solid #E2E8F0;
        border-radius: 7px; padding: 4px 8px; color: #0F172A; flex: 1;
      }

      /* ── Stat grid ── */
      .stat-grid {
        display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
      }
      @media (min-width: 640px) { .stat-grid { grid-template-columns: repeat(3, 1fr); } }
      @media (min-width: 1100px) { .stat-grid { grid-template-columns: repeat(3, 1fr); } }

      .stat-card {
        background: #fff; border-radius: 14px; padding: 1rem 1.05rem;
        border: 1.5px solid #E8EEF6; position: relative; overflow: hidden;
        transition: border-color .2s, box-shadow .2s, transform .2s;
      }
      .stat-card:hover { border-color: #CBD5E1; box-shadow: 0 6px 20px rgba(15,23,42,.06); transform: translateY(-1px); }
      .stat-card__bar {
        position: absolute; top: 0; right: 0; width: 4px; height: 100%;
        background: var(--accent); border-radius: 0 14px 14px 0;
      }
      .stat-card__icon {
        width: 32px; height: 32px; border-radius: 9px; background: var(--iconBg);
        display: flex; align-items: center; justify-content: center; font-size: 15px; margin-bottom: 9px;
      }
      .stat-card__label {
        font-size: 10.5px; color: #64748B; font-weight: 600; margin-bottom: 4px;
        min-height: 26px; line-height: 1.35;
      }
      .stat-card__value { font-size: 19px; font-weight: 700; color: #0F172A; line-height: 1; margin-bottom: 6px; }
      .stat-card__sub { font-size: 10.5px; color: #0F6E56; display: flex; align-items: center; gap: 4px; }
      .stat-card__trend { font-size: 10.5px; display: flex; align-items: center; gap: 4px; font-weight: 600; }
      .stat-card__trend.up { color: #0F6E56; }
      .stat-card__trend.down { color: #C0362C; }

      /* ── Panel / card ── */
      .panel {
        background: #fff; border-radius: 14px; padding: 1.15rem;
        border: 1.5px solid #E8EEF6; transition: border-color .2s;
      }
      .panel:hover { border-color: #D8E2EC; }
      .panel__head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; gap: 8px; }
      .panel__title { font-size: 13.5px; font-weight: 700; color: #0F172A; }
      .panel__sub { font-size: 10.5px; color: #94A3B8; margin-top: 2px; }

      .two-col { display: grid; grid-template-columns: 1fr; gap: 12px; }
      @media (min-width: 900px) { .two-col { grid-template-columns: 1.7fr 1fr; } }

      .chart-wrap { position: relative; height: 220px; width: 100%; }
      @media (min-width: 640px) { .chart-wrap { height: 250px; } }
      .empty-state {
        height: 220px; display: flex; align-items: center; justify-content: center;
        color: #94A3B8; font-size: 13px;
      }

      /* ── Info list ── */
      .info-list { display: flex; flex-direction: column; gap: 13px; margin-top: 6px; }
      .info-item { display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; gap: 8px; }
      .info-item__label { color: #64748B; flex-shrink: 0; }
      .info-item__value { font-weight: 600; color: #0F172A; text-align: left; word-break: break-word; }
      .info-item__value--pill {
        color: #0B6B52; background: #E1F5EE; padding: 2px 10px;
        border-radius: 20px; border: 1px solid #5DCAA5; font-size: 10.5px;
      }

      /* ── Invoice list ── */
      .invoice-list { display: flex; flex-direction: column; gap: 6px; }
      .invoice-row {
        display: flex; align-items: center; gap: 10px;
        padding: 9px 12px; border-radius: 10px;
        border: 1px solid #F1F5F9; background: #FAFCFF;
      }
      .invoice-row__main { flex: 1; min-width: 0; }
      .invoice-row__name { font-size: 12.5px; font-weight: 600; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .invoice-row__module { font-size: 10.5px; color: #64748B; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .invoice-row__amount { font-size: 12.5px; font-weight: 700; color: #0F172A; flex-shrink: 0; }
      .invoice-row__badge { font-size: 9.5px; font-weight: 600; padding: 2px 9px; border-radius: 20px; flex-shrink: 0; white-space: nowrap; }
    `}</style>
  );
}