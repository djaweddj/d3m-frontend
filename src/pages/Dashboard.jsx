import { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../api";
import { RefreshCw, AlertCircle, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";

// ══════════════════════════════════════════════════════════════════
//  HELPERS (language-agnostic — take `months` / `t` / `locale` as args)
// ══════════════════════════════════════════════════════════════════
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

const shiftYM = ({ y, m }, delta) => {
  const total = y * 12 + (m - 1) + delta;
  return { y: Math.floor(total / 12), m: (total % 12) + 1 };
};

// Formats numbers using the active locale instead of a hardcoded "en-US"
const fmtMoney = (n, locale, currencySuffix) =>
  (n ?? 0).toLocaleString(locale) + currencySuffix;

const fmtMoneyShort = (n, locale) => {
  const v = n ?? 0;
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(0) + "K";
  return v.toLocaleString(locale);
};

// ══════════════════════════════════════════════════════════════════
//  PRIMITIVES
// ══════════════════════════════════════════════════════════════════

function StatCard({ emoji, label, value, sub, subNeutral, accent, iconBg, trend, trendLabel }) {
  return (
    <div className="stat-card" style={{ "--accent": accent, "--iconBg": iconBg }}>
      <div className="stat-card__bar" />
      <div className="stat-card__icon">{emoji}</div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value ?? "—"}</div>
      {trend !== undefined && trend !== null ? (
        <div className={`stat-card__trend ${trend >= 0 ? "up" : "down"}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend).toFixed(0)}% {trendLabel}
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
function MonthRangePicker({ from, to, onChange, t, months }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const ymLabel = ({ y, m }) => `${months[m - 1]} ${y}`;

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const presets = [
    { label: t("dashboard.range.presets.threeMonths"), n: 3 },
    { label: t("dashboard.range.presets.sixMonths"), n: 6 },
    { label: t("dashboard.range.presets.twelveMonths"), n: 12 },
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
              {t("dashboard.range.from")}
              <input
                type="month"
                value={ymToStr(from)}
                max={ymToStr(to)}
                onChange={(e) => onChange({ from: parseYM(e.target.value), to })}
              />
            </label>
            <label>
              {t("dashboard.range.to")}
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
function ComparisonChart({ data, highlightIndex, t, months, locale, dir }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  const ymShortLabel = ({ m }) => months[m - 1].slice(0, 4);

  useEffect(() => {
    if (!ref.current || !window.Chart || !data.length) return;
    chartRef.current?.destroy();

    const labels = data.map((d) => ymShortLabel(parseYM(d.period)));
    const collected = data.map((d) => d.totalCollected ?? 0);
    const schoolPart = data.map((d) => d.schoolPart ?? 0);
    const isRTL = dir === "rtl";
    const isMobile = window.innerWidth < 640;

    chartRef.current = new window.Chart(ref.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: t("dashboard.chart.incomeLabel"),
            data: collected,
            backgroundColor: collected.map((_, i) => (i === highlightIndex ? "#185FA5" : "#BBD8F3")),
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: isMobile ? 18 : 26,
          },
          {
            label: t("dashboard.schoolInfo.monthIncome"),
            data: schoolPart,
            backgroundColor: schoolPart.map((_, i) => (i === highlightIndex ? "#0F6E56" : "#A9DDC9")),
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: isMobile ? 18 : 26,
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
            labels: { font: { family: "Cairo", size: isMobile ? 10 : 11 }, boxWidth: 10, boxHeight: 10, padding: isMobile ? 10 : 14, usePointStyle: true, pointStyle: "circle" },
          },
          tooltip: {
            rtl: isRTL,
            titleFont: { family: "Cairo" },
            bodyFont: { family: "Cairo" },
            callbacks: {
              label: (v) => `${v.dataset.label}: ${v.raw.toLocaleString(locale)}${t("dashboard.currencySuffix")}`,
            },
          },
        },
        scales: {
          x: { ticks: { font: { family: "Cairo", size: isMobile ? 9 : 11 } }, grid: { display: false }, border: { display: false } },
          y: {
            ticks: { font: { family: "Cairo", size: 10 }, callback: (v) => fmtMoneyShort(v, locale) },
            grid: { color: "#F1F5F9" },
            border: { display: false },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data, highlightIndex, locale, dir]); // eslint-disable-line

  return <div className="chart-wrap"><canvas ref={ref} /></div>;
}

// ══════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { user } = useAuth();
  const { t, dir, locale } = useLanguage();
  const BLUE = "#185FA5";

  // Month names now come from translations instead of a hardcoded Arabic array
  const months = t("dashboard.months");
  const ymLabel = ({ y, m }) => `${months[m - 1]} ${y}`;
  const currencySuffix = t("dashboard.currencySuffix");

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
      setError(err?.response?.data?.message || t("dashboard.error"));
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

  // Status labels driven by translations (was a hardcoded Arabic-only map)
  const STATUS_META = {
    PAID:      { bg: "#E1F5EE", color: "#0B6B52", label: t("dashboard.invoices.status.paid") },
    PENDING:   { bg: "#FCF0DA", color: "#9A6208", label: t("dashboard.invoices.status.pending") },
    OVERDUE:   { bg: "#FCE4E4", color: "#C0362C", label: t("dashboard.invoices.status.overdue") },
    CANCELLED: { bg: "#F1F5F9", color: "#64748B", label: t("dashboard.invoices.status.pending") },
  };

  if (loading) {
    return (
      <div dir={dir} className="dash-loading">
        <DashStyles />
        <div className="spinner" />
        {t("dashboard.loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div dir={dir} className="dash-error">
        <DashStyles />
        <AlertCircle size={32} color="#E2A84B" />
        <p>{error}</p>
        <button className="btn btn--primary" onClick={() => load(range)}>
          <RefreshCw size={13} /> {t("dashboard.retry")}
        </button>
      </div>
    );
  }

  const schoolName = schoolInfo?.schoolName ?? user?.schoolName ?? t("dashboard.schoolInfo.name");
  const wilaya = schoolInfo?.wilaya ?? user?.wilaya ?? "";

  return (
    <div dir={dir} className="dash">
      <DashStyles />

      {/* ── Header ── */}
      <div className="dash-header">
        <div>
          <div className="dash-header__title">
            {t("dashboard.headerTitle", { school: schoolName })}
          </div>
          <div className="dash-header__sub">{wilaya}</div>
        </div>
        <div className="dash-header__actions">
          <MonthRangePicker from={range.from} to={range.to} onChange={setRange} t={t} months={months} />
          <button className="btn btn--ghost" onClick={() => load(range)}>
            <RefreshCw size={13} /> {t("dashboard.refresh")}
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stat-grid">
        <StatCard
          emoji="💰"
          label={t("dashboard.stat.collected.labelFor", { period: current ? ymLabel(parseYM(current.period)) : "" })}
          value={fmtMoney(current?.totalCollected, locale, currencySuffix)}
          trend={trendPct}
          trendLabel={t("dashboard.trend.vsLastMonth")}
          accent={BLUE} iconBg="#EBF4FE"
        />
        <StatCard
          emoji="🏫" label={t("dashboard.schoolInfo.monthIncome")}
          value={fmtMoney(current?.schoolPart, locale, currencySuffix)}
          trend={schoolPartTrendPct}
          trendLabel={t("dashboard.trend.vsLastMonth")}
          accent="#0F6E56" iconBg="#E1F5EE"
        />
        <StatCard
          emoji="⏳" label={t("dashboard.stat.pending.label")}
          value={fmtMoney(current?.totalPending, locale, currencySuffix)}
          sub={t("dashboard.stat.pending.sub")} accent="#BA7517" iconBg="#FCF0DA"
          subNeutral={!current?.totalPending}
        />
        <StatCard
          emoji="🔴" label={t("dashboard.stat.overdue.label")}
          value={fmtMoney(current?.totalOverdue, locale, currencySuffix)}
          sub={t("dashboard.stat.overdue.sub")} accent="#DC2626" iconBg="#FCE4E4"
          subNeutral={!current?.totalOverdue}
        />
        <StatCard
          emoji="🎓" label={t("dashboard.stat.students.label")}
          value={schoolInfo?.totalStudents ?? "—"}
          sub={t("dashboard.stat.students.sub")} accent="#534AB7" iconBg="#EEEDFE"
          subNeutral={!schoolInfo?.totalStudents}
        />
        <StatCard
          emoji="📄" label={t("dashboard.stat.invoiceCount.label")}
          value={current?.invoiceCount ?? "—"}
          sub={current ? ymLabel(parseYM(current.period)) : ""} accent="#64748B" iconBg="#F1F5F9" subNeutral
        />
      </div>

      {/* ── Chart + School info ── */}
      <div className="two-col">
        <Card
          title={t("dashboard.chart.title")}
          sub={`${ymLabel(range.from)} – ${ymLabel(range.to)}`}
          className="chart-card"
        >
          {rangeData.length > 0 && rangeData.some((d) => (d.totalCollected ?? 0) > 0)
            ? <ComparisonChart data={rangeData} highlightIndex={rangeData.length - 1} t={t} months={months} locale={locale} dir={dir} />
            : <div className="empty-state">{t("dashboard.chart.noData")}</div>
          }
        </Card>

        <Card title={t("dashboard.schoolInfo.title")}>
          <div className="info-list">
            <InfoItem label={t("dashboard.schoolInfo.name")} value={schoolInfo?.schoolName} />
            <InfoItem label={t("dashboard.schoolInfo.owner")} value={schoolInfo?.ownerName} />
            <InfoItem label={t("dashboard.schoolInfo.wilaya")} value={schoolInfo?.wilaya} />
            <InfoItem label={t("dashboard.schoolInfo.email")} value={schoolInfo?.email} />
            <InfoItem label={t("dashboard.schoolInfo.subscriptionStatus")} value={schoolInfo?.subscriptionStatus} highlight />
            <InfoItem
              label={t("dashboard.schoolInfo.subscriptionExpiry")}
              value={
                schoolInfo?.subscriptionExpiresAt
                  ? new Date(schoolInfo.subscriptionExpiresAt).toLocaleDateString(locale, {
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
        <Card
          title={t("dashboard.invoices.title")}
          sub={`${current.invoices.length} ${t("dashboard.invoices.countSuffix")}`}
        >
          <div className="invoice-list">
            {current.invoices.slice(0, 8).map((inv, i) => {
              const st = STATUS_META[inv.status] ?? STATUS_META.PENDING;
              return (
                <div key={inv.id ?? i} className="invoice-row">
                  <div className="invoice-row__main">
                    <div className="invoice-row__name">{inv.studentName ?? t("dashboard.invoices.fallbackName")}</div>
                    <div className="invoice-row__module">{inv.moduleName ?? t("dashboard.invoices.fallbackModule")}</div>
                  </div>
                  <div className="invoice-row__meta">
                    <div className="invoice-row__amount">{fmtMoney(inv.amount, locale, currencySuffix)}</div>
                    <span className="invoice-row__badge" style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
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
        overflow-x: hidden;
      }
      @media (min-width: 768px) { .dash { padding: 1.75rem; } }
      @media (max-width: 420px) { .dash { padding: 0.9rem; gap: 0.9rem; } }

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
        text-align: center;
      }
      .dash-error p { color: #64748B; font-size: 13px; margin: 0; }

      /* ── Header ── */
      .dash-header {
        display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
        flex-wrap: wrap;
      }
      .dash-header__title { font-size: 19px; font-weight: 700; color: #0F172A; line-height: 1.3; }
      .dash-header__sub { font-size: 12px; color: #94A3B8; margin-top: 3px; }
      .dash-header__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

      @media (max-width: 480px) {
        .dash-header { flex-direction: column; align-items: stretch; }
        .dash-header__title { font-size: 16.5px; }
        .dash-header__actions { width: 100%; }
        .dash-header__actions .range-picker { flex: 1; min-width: 0; }
        .dash-header__actions .range-picker__trigger { width: 100%; }
        .dash-header__actions .btn--ghost { flex-shrink: 0; }
      }

      .btn {
        display: flex; align-items: center; justify-content: center; gap: 6px;
        padding: 8px 14px; border-radius: 9px;
        font-size: 12.5px; cursor: pointer; font-family: inherit;
        white-space: nowrap; border: 1.5px solid transparent;
        min-height: 40px;
      }
      .btn--ghost { border-color: #E2E8F0; background: #fff; color: #64748B; }
      .btn--ghost:hover { border-color: #CBD5E1; }
      .btn--primary { border-color: #185FA5; background: #EBF4FE; color: #185FA5; }

      /* ── Month range picker ── */
      .range-picker { position: relative; }
      .range-picker__trigger {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        padding: 8px 14px; border-radius: 9px;
        border: 1.5px solid #E2E8F0; background: #fff;
        color: #0F172A; font-size: 12.5px; font-weight: 600;
        cursor: pointer; font-family: inherit; white-space: nowrap;
        min-height: 40px;
      }
      .range-picker__trigger span { overflow: hidden; text-overflow: ellipsis; }
      .range-picker__trigger:hover { border-color: #CBD5E1; }
      .range-picker__panel {
        position: absolute; top: calc(100% + 8px); inset-inline-start: 0; z-index: 20;
        background: #fff; border: 1.5px solid #E8EEF6; border-radius: 12px;
        padding: 12px; box-shadow: 0 10px 30px rgba(15,23,42,.12);
        width: 260px;
        max-width: calc(100vw - 2.5rem);
      }
      .range-picker__presets { display: flex; gap: 6px; margin-bottom: 10px; }
      .range-picker__preset {
        flex: 1; padding: 8px 6px; border-radius: 7px;
        border: 1.5px solid #E2E8F0; background: #F8FAFC;
        font-size: 11.5px; font-family: inherit; cursor: pointer; color: #334155;
        min-height: 36px;
      }
      .range-picker__preset:hover { background: #EBF4FE; border-color: #B5D4F4; color: #185FA5; }
      .range-picker__custom { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid #F1F5F9; padding-top: 10px; }
      .range-picker__custom label { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748B; gap: 8px; }
      .range-picker__custom input {
        font-family: inherit; font-size: 12px; border: 1.5px solid #E2E8F0;
        border-radius: 7px; padding: 6px 8px; color: #0F172A; flex: 1;
        min-height: 34px;
      }

      /* ── Stat grid ── */
      .stat-grid {
        display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
      }
      @media (min-width: 640px) { .stat-grid { grid-template-columns: repeat(3, 1fr); } }
      @media (min-width: 1100px) { .stat-grid { grid-template-columns: repeat(3, 1fr); } }
      @media (max-width: 420px) { .stat-grid { gap: 8px; } }

      .stat-card {
        background: #fff; border-radius: 14px; padding: 1rem 1.05rem;
        border: 1.5px solid #E8EEF6; position: relative; overflow: hidden;
        transition: border-color .2s, box-shadow .2s, transform .2s;
        min-width: 0;
      }
      .stat-card:hover { border-color: #CBD5E1; box-shadow: 0 6px 20px rgba(15,23,42,.06); transform: translateY(-1px); }
      .stat-card__bar {
        position: absolute; top: 0; inset-inline-end: 0; width: 4px; height: 100%;
        background: var(--accent); border-radius: 14px 0 0 14px;
      }
      .stat-card__icon {
        width: 32px; height: 32px; border-radius: 9px; background: var(--iconBg);
        display: flex; align-items: center; justify-content: center; font-size: 15px; margin-bottom: 9px;
      }
      .stat-card__label {
        font-size: 10.5px; color: #64748B; font-weight: 600; margin-bottom: 4px;
        min-height: 26px; line-height: 1.35;
      }
      .stat-card__value {
        font-size: 19px; font-weight: 700; color: #0F172A; line-height: 1.1; margin-bottom: 6px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .stat-card__sub { font-size: 10.5px; color: #0F6E56; display: flex; align-items: center; gap: 4px; }
      .stat-card__trend { font-size: 10.5px; display: flex; align-items: center; gap: 4px; font-weight: 600; }
      .stat-card__trend.up { color: #0F6E56; }
      .stat-card__trend.down { color: #C0362C; }

      @media (max-width: 420px) {
        .stat-card { padding: 0.8rem 0.75rem; border-radius: 12px; }
        .stat-card__icon { width: 28px; height: 28px; font-size: 13px; margin-bottom: 7px; }
        .stat-card__label { font-size: 9.5px; min-height: 22px; }
        .stat-card__value { font-size: 15.5px; margin-bottom: 4px; }
        .stat-card__sub, .stat-card__trend { font-size: 9.5px; }
      }

      /* ── Panel / card ── */
      .panel {
        background: #fff; border-radius: 14px; padding: 1.15rem;
        border: 1.5px solid #E8EEF6; transition: border-color .2s;
        min-width: 0;
      }
      .panel:hover { border-color: #D8E2EC; }
      .panel__head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; gap: 8px; }
      .panel__title { font-size: 13.5px; font-weight: 700; color: #0F172A; }
      .panel__sub { font-size: 10.5px; color: #94A3B8; margin-top: 2px; }

      @media (max-width: 420px) { .panel { padding: 0.9rem; } }

      .two-col { display: grid; grid-template-columns: 1fr; gap: 12px; }
      @media (min-width: 900px) { .two-col { grid-template-columns: 1.7fr 1fr; } }

      .chart-wrap { position: relative; height: 220px; width: 100%; }
      @media (min-width: 640px) { .chart-wrap { height: 250px; } }
      @media (max-width: 420px) { .chart-wrap { height: 190px; } }
      .empty-state {
        height: 220px; display: flex; align-items: center; justify-content: center;
        color: #94A3B8; font-size: 13px; text-align: center; padding: 0 1rem;
      }

      /* ── Info list ── */
      .info-list { display: flex; flex-direction: column; gap: 13px; margin-top: 6px; }
      .info-item { display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; gap: 8px; }
      .info-item__label { color: #64748B; flex-shrink: 0; }
      .info-item__value { font-weight: 600; color: #0F172A; text-align: end; word-break: break-word; }
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
        flex-wrap: wrap;
      }
      .invoice-row__main { flex: 1; min-width: 0; }
      .invoice-row__name { font-size: 12.5px; font-weight: 600; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .invoice-row__module { font-size: 10.5px; color: #64748B; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .invoice-row__meta { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
      .invoice-row__amount { font-size: 12.5px; font-weight: 700; color: #0F172A; flex-shrink: 0; white-space: nowrap; }
      .invoice-row__badge { font-size: 9.5px; font-weight: 600; padding: 2px 9px; border-radius: 20px; flex-shrink: 0; white-space: nowrap; }

      @media (max-width: 380px) {
        .invoice-row { align-items: flex-start; }
        .invoice-row__main { flex-basis: 100%; }
        .invoice-row__meta { flex-basis: 100%; justify-content: space-between; margin-top: 2px; }
      }
    `}</style>
  );
}