import { useState } from "react";
import { AlertCircle, Clock, Landmark, PiggyBank, RefreshCw, Users, Wallet } from "lucide-react";
import NButton from "../home/NButton";
import Reveal from "../home/Reveal";
import EmptyState from "../BrowseSchools/EmptyState";
import IconButton from "../Requests/IconButton";
import MonthStepper from "./MonthStepper";
import SummaryStat from "./SummaryStat";
import PayoutRow, { PAYOUT_GRID } from "./PayoutRow";
import { useLanguage } from "../../context/LanguageContext";
import useLocale from "./useLocale";
import usePayoutSummary from "./usePayoutSummary";
import { currentPeriod, formatDA, formatPeriod } from "./payouts";

// Read-only for calculation: shows the month's payouts and lets the admin mark them paid
export default function PayoutsTab({ teachers, notify }) {
  const { t } = useLanguage();
  const locale = useLocale();
  const currency = t("teacherDashboard.currency");
  const [period, setPeriod] = useState(currentPeriod());
  const { summary, loading, error, markingId, reload, markPaid } = usePayoutSummary(period, t);

  const teacherMap = Object.fromEntries(teachers.map((x) => [x.id, x]));
  const payouts = summary?.payouts ?? [];
  const due = Number(summary?.totalPayoutsDue) || 0;
  const paid = Number(summary?.totalPayoutsPaid) || 0;

  const handleMarkPaid = async (payout) => {
    const r = await markPaid(payout);
    if (!r.ok) notify(r.message, "error");
  };

  const headers = [
    t("teachers.payoutCard.teacherColumn"),
    t("teachers.payoutCard.revenue"),
    t("teachers.payoutCard.appliedPercentage"),
    t("teachers.payoutCard.payout"),
    t("teachers.payoutCard.statusColumn"),
    t("teachers.payoutCard.actionColumn"),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 border border-gold/25 bg-white px-4 py-2">
          <span className="text-xs font-bold text-green-deep/60">{t("courses.payoutPanel.title")}</span>
          <MonthStepper period={period} onChange={setPeriod} large />
        </div>
        <IconButton large icon={RefreshCw} label={t("teachers.retry")} loading={loading} onClick={reload} />
      </div>

      {!loading && summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat icon={Users} label={t("teachers.payoutCard.teacherCount")} value={summary.teacherCount ?? payouts.length} />
          <SummaryStat icon={Clock} label={t("courses.payoutsTab.duePayouts")} value={formatDA(due, currency)} delay={0.06} />
          <SummaryStat icon={PiggyBank} label={t("teachers.payoutCard.paidThisMonth")} value={formatDA(paid, currency)} delay={0.12} />
          <SummaryStat icon={Landmark} label={t("teachers.payoutCard.totalPayouts")} value={formatDA(due + paid, currency)} sub={formatPeriod(period, locale)} delay={0.18} />
        </div>
      )}

      {loading ? (
        <div className="space-y-px border border-gold/25 bg-white" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="m-4 h-12 animate-pulse bg-sand" />)}
        </div>
      ) : error ? (
        <div className="text-center">
          <EmptyState icon={AlertCircle} tone="error" title={error} />
          <NButton type="button" variant="outline" onClick={reload} className="mt-6">
            <RefreshCw className="size-4" />{t("teachers.retry")}
          </NButton>
        </div>
      ) : payouts.length === 0 ? (
        <EmptyState icon={Wallet} title={t("teachers.payoutCard.noneForMonth", { period: formatPeriod(period, locale) })} />
      ) : (
        <Reveal>
          <div className="border border-gold/25 bg-white">
            <div className={`hidden border-b border-gold/25 bg-ivory px-4 py-3 text-xs font-bold text-green-deep/50 ${PAYOUT_GRID}`}>
              {headers.map((h, i) => <span key={i} className={i === 0 ? "text-start" : "text-center"}>{h}</span>)}
            </div>
            {payouts.map((payout) => (
              <PayoutRow
                key={payout.id}
                payout={payout}
                teacher={teacherMap[payout.teacherId]}
                marking={markingId === payout.id}
                onMarkPaid={handleMarkPaid}
              />
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
