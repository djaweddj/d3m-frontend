import { useState } from "react";
import { Calculator, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import IconButton from "../Requests/IconButton";
import InlineConfirm from "./InlineConfirm";
import MonthStepper from "./MonthStepper";
import PayoutStatusPill from "./PayoutStatusPill";
import { Diamond } from "../home/Marks";
import { useLanguage } from "../../context/LanguageContext";
import useLocale from "./useLocale";
import { formatDA, formatRange } from "./payouts";

const Label = ({ children }) => <p className="mb-1 text-xs text-green-deep/50">{children}</p>;

// payout = the object returned by useTeacherPayout
export default function PayoutInfoCard({ payout, previousPercentage, currentPercentage }) {
  const { t } = useLanguage();
  const locale = useLocale();
  const currency = t("teacherDashboard.currency");
  const { period, setPeriod, lastPayout, loading, error, markingPaid, calculating, markPaid, calculate } = payout;
  const [confirmingCalc, setConfirmingCalc] = useState(false);

  const prevPct = previousPercentage != null ? Number(previousPercentage) : null;
  const currPct = parseFloat(currentPercentage);
  const changed = prevPct != null && !isNaN(currPct) && currPct !== prevPct;
  const increased = changed && currPct > prevPct;
  const isPaid = lastPayout?.status === "PAID";

  const runCalculate = async () => {
    await calculate();
    setConfirmingCalc(false);
  };

  const calcAction = (label) => (
    <InlineConfirm
      open={confirmingCalc}
      busy={calculating}
      warning={t("teachers.payoutCard.recalcWarning")}
      confirmLabel={t("courses.payoutPanel.confirmPayment")}
      cancelLabel={t("teachers.footer.cancel")}
      confirmVariant="danger"
      onConfirm={runCalculate}
      onCancel={() => setConfirmingCalc(false)}
    >
      <IconButton icon={Calculator} onClick={() => setConfirmingCalc(true)} className="flex-1">{label}</IconButton>
    </InlineConfirm>
  );

  return (
    <div className="border border-gold/25 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/25 bg-ivory px-3 py-2">
        <span className="flex items-center gap-2 text-xs font-bold text-gold-deep">
          <Diamond className="size-2" />{t("teachers.payoutCard.title")}
        </span>
        <MonthStepper period={period} onChange={setPeriod} />
      </div>

      <div className="space-y-4 p-4">
        {loading ? (
          <div className="flex justify-center py-2">
            <span className="size-5 animate-spin rounded-full border-2 border-gold/40 border-t-gold" />
          </div>
        ) : error ? (
          <p className="py-1 text-center text-xs font-bold text-algeria-red">{error}</p>
        ) : !lastPayout ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-center text-sm text-green-deep/50">{t("teachers.payoutCard.none")}</p>
            {calcAction(t("teachers.payoutCard.calculateThisMonth"))}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PayoutStatusPill isPaid={isPaid} />
              {isPaid && lastPayout.paidAt && (
                <span className="text-xs text-green-deep/50">
                  {t("teachers.payoutCard.paidOn", { date: new Date(lastPayout.paidAt).toLocaleDateString(locale) })}
                </span>
              )}
            </div>

            <p className="text-center text-xs text-green-deep/50">
              {formatRange(lastPayout.periodStart, lastPayout.periodEnd, locale)}
            </p>

            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center">
              <div>
                <Label>{t("teachers.payoutCard.revenue")}</Label>
                <p className="text-sm font-bold tabular-nums text-green-deep">{formatDA(lastPayout.totalModuleRevenue, currency)}</p>
              </div>
              <span className="text-gold">×</span>
              <div>
                <Label>{t("teachers.payoutCard.appliedPercentage")}</Label>
                <p className="text-sm font-bold tabular-nums text-green-deep">
                  {lastPayout.percentage != null ? `${lastPayout.percentage}%` : "—"}
                </p>
              </div>
              <span className="text-gold">=</span>
              <div>
                <Label>{t("teachers.payoutCard.payout")}</Label>
                <p className="font-display text-base tabular-nums text-green-deep">{formatDA(lastPayout.payoutAmount, currency)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gold/25 pt-4">
              <div>
                <Label>{t("teachers.payoutCard.previousPercentage")}</Label>
                <p className="text-sm font-bold tabular-nums text-green-deep">{prevPct != null ? `${prevPct}%` : "—"}</p>
              </div>
              {changed && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tabular-nums ${
                    increased ? "bg-green-deep/10 text-green-deep" : "bg-algeria-red/10 text-algeria-red"
                  }`}
                >
                  {increased ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {prevPct}% → {currPct}%
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 border-t border-gold/25 pt-4">
              {!isPaid && !confirmingCalc && (
                <IconButton icon={CheckCircle2} variant="solid" loading={markingPaid} onClick={markPaid} className="flex-1">
                  {markingPaid ? t("teachers.payoutCard.markingPaid") : t("teachers.payoutCard.markAsPaid")}
                </IconButton>
              )}
              {calcAction(t("courses.payoutPanel.recalculate"))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
