import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../api";
import { RefreshCw, AlertCircle, Wallet, School, Clock, GraduationCap, FileText } from "lucide-react";
import NButton from "../components/home/NButton";
import DashCard from "../components/dash/DashCard";
import DashStat from "../components/dash/DashStat";
import PageHeader from "../components/dash/PageHeader";
import Badge from "../components/dash/Badge";
import MonthRangePicker from "../components/dash/MonthRangePicker";
import ComparisonChart from "../components/dash/ComparisonChart";
import { todayYM, shiftYM, parseYM, ymToStr, fmtMoney } from "../components/dash/DashUtils";

// invoice status -> [Badge tone, translation key under dashboard.invoices.status]
const STATUS = {
  PAID: ["ok", "paid"],
  PENDING: ["warn", "pending"],
  OVERDUE: ["bad", "overdue"],
  CANCELLED: ["neutral", "pending"],
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t, dir, locale } = useLanguage();

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

  if (loading) return (
    <div dir={dir} className="flex items-center gap-3 p-8 text-sm text-ink/60">
      <span className="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      {t("dashboard.loading")}
    </div>
  );

  if (error) return (
    <div dir={dir} className="flex flex-col items-center gap-3 p-8 text-center text-sm text-ink/60">
      <AlertCircle className="size-8 text-algeria-red" />
      <p>{error}</p>
      <NButton variant="dash" size="sm" onClick={() => load(range)}>
        <RefreshCw className="size-3.5" />{t("dashboard.retry")}
      </NButton>
    </div>
  );

  const schoolName = schoolInfo?.schoolName ?? user?.schoolName ?? t("dashboard.schoolInfo.name");
  const wilaya = schoolInfo?.wilaya ?? user?.wilaya ?? "";
  const period = current ? ymLabel(parseYM(current.period)) : "";
  const vs = t("dashboard.trend.vsLastMonth");
  const money = { suffix: currencySuffix };

  const stats = [
    { icon: Wallet, label: t("dashboard.stat.collected.labelFor", { period }), value: current?.totalCollected ?? 0, trend: trendPct, trendLabel: vs, ...money },
    { icon: School, label: t("dashboard.schoolInfo.monthIncome"), value: current?.schoolPart ?? 0, trend: schoolPartTrendPct, trendLabel: vs, ...money },
    { icon: Clock, label: t("dashboard.stat.pending.label"), value: current?.totalPending ?? 0, sub: t("dashboard.stat.pending.sub"), ...money },
    { icon: AlertCircle, label: t("dashboard.stat.overdue.label"), value: current?.totalOverdue ?? 0, sub: t("dashboard.stat.overdue.sub"), ...money },
    { icon: GraduationCap, label: t("dashboard.stat.students.label"), value: schoolInfo?.totalStudents, sub: t("dashboard.stat.students.sub") },
    { icon: FileText, label: t("dashboard.stat.invoiceCount.label"), value: current?.invoiceCount, sub: period },
  ];

  const expiry = schoolInfo?.subscriptionExpiresAt
    ? new Date(schoolInfo.subscriptionExpiresAt).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  // [label, value, showAsBadge]
  const info = [
    [t("dashboard.schoolInfo.name"), schoolInfo?.schoolName],
    [t("dashboard.schoolInfo.owner"), schoolInfo?.ownerName],
    [t("dashboard.schoolInfo.wilaya"), schoolInfo?.wilaya],
    [t("dashboard.schoolInfo.email"), schoolInfo?.email],
    [t("dashboard.schoolInfo.subscriptionStatus"), schoolInfo?.subscriptionStatus, true],
    [t("dashboard.schoolInfo.subscriptionExpiry"), expiry],
  ];

  return (
    <div dir={dir} className="min-h-screen space-y-4 overflow-x-hidden bg-canvas p-4 sm:p-6">
      <PageHeader title={t("dashboard.headerTitle", { school: schoolName })} subtitle={wilaya}>
        <MonthRangePicker from={range.from} to={range.to} onChange={setRange} t={t} months={months} />
        <NButton variant="ghost" size="sm" onClick={() => load(range)}>
          <RefreshCw className="size-3.5" />{t("dashboard.refresh")}
        </NButton>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((s, i) => <DashStat key={i} delay={i * 0.05} locale={locale} {...s} />)}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <DashCard
          title={t("dashboard.chart.title")}
          action={<span className="text-xs text-ink/40">{ymLabel(range.from)} – {ymLabel(range.to)}</span>}
        >
          {rangeData.some((d) => (d.totalCollected ?? 0) > 0)
            ? <ComparisonChart data={rangeData} highlightIndex={rangeData.length - 1} t={t} months={months} locale={locale} dir={dir} />
            : <p className="grid h-52 place-items-center text-sm text-ink/40">{t("dashboard.chart.noData")}</p>}
        </DashCard>

        <DashCard title={t("dashboard.schoolInfo.title")}>
          <dl className="space-y-3 text-sm">
            {info.map(([label, value, pill]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <dt className="text-ink/60">{label}</dt>
                <dd className="break-words text-end font-bold text-ink">
                  {pill ? <Badge tone="ok">{value ?? "—"}</Badge> : value ?? "—"}
                </dd>
              </div>
            ))}
          </dl>
        </DashCard>
      </div>

      {current?.invoices?.length > 0 && (
        <DashCard
          title={t("dashboard.invoices.title")}
          action={<span className="text-xs text-ink/40">{current.invoices.length} {t("dashboard.invoices.countSuffix")}</span>}
        >
          <ul className="-mx-2">
            {current.invoices.slice(0, 8).map((inv, i) => {
              const [tone, key] = STATUS[inv.status] ?? STATUS.PENDING;
              return (
                <li key={inv.id ?? i} className="flex flex-wrap items-center gap-3 rounded-sm px-2 py-2.5 hover:bg-canvas">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{inv.studentName ?? t("dashboard.invoices.fallbackName")}</p>
                    <p className="truncate text-xs text-ink/60">{inv.moduleName ?? t("dashboard.invoices.fallbackModule")}</p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-bold tabular-nums text-ink">
                    {fmtMoney(inv.amount, locale, currencySuffix)}
                  </span>
                  <Badge tone={tone}>{t(`dashboard.invoices.status.${key}`)}</Badge>
                </li>
              );
            })}
          </ul>
        </DashCard>
      )}
    </div>
  );
}