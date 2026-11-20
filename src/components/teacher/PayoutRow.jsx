import { CheckCircle2 } from "lucide-react";
import IconButton from "../Requests/IconButton";
import PayoutStatusPill from "./PayoutStatusPill";
import { useLanguage } from "../../context/LanguageContext";
import useLocale from "./useLocale";
import { formatDA, formatRange, initials } from "./payouts";

// One markup, two layouts: stacked & labelled on mobile, a table row from md up
export const PAYOUT_GRID = "md:grid md:grid-cols-[minmax(160px,1.6fr)_1fr_0.8fr_1fr_1fr_1fr] md:items-center md:gap-3";

const Cell = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 text-sm text-green-deep md:justify-center md:text-center">
    <span className="text-xs text-green-deep/50 md:hidden">{label}</span>
    {children}
  </div>
);

export default function PayoutRow({ payout, teacher, onMarkPaid, marking }) {
  const { t } = useLanguage();
  const locale = useLocale();
  const currency = t("teacherDashboard.currency");
  const isPaid = payout?.status === "PAID";
  const name = payout?.teacherName || teacher?.fullName || "—";

  return (
    <div className={`flex flex-col gap-3 border-b border-gold/15 p-4 last:border-0 ${PAYOUT_GRID}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-green-deep font-display text-gold">
          {initials(teacher?.fullName || payout?.teacherName)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-base text-green-deep">{name}</p>
          <p className="text-xs text-green-deep/50">{formatRange(payout?.periodStart, payout?.periodEnd, locale)}</p>
        </div>
      </div>

      <Cell label={t("teachers.payoutCard.revenue")}>
        <span className="tabular-nums">{formatDA(payout?.totalModuleRevenue, currency)}</span>
      </Cell>
      <Cell label={t("teachers.payoutCard.appliedPercentage")}>
        <span className="font-semibold tabular-nums">{payout?.percentage != null ? `${payout.percentage}%` : "—"}</span>
      </Cell>
      <Cell label={t("teachers.payoutCard.payout")}>
        <span className="font-display text-base tabular-nums">{formatDA(payout?.payoutAmount, currency)}</span>
      </Cell>
      <Cell label={t("teachers.payoutCard.statusColumn")}>
        <PayoutStatusPill isPaid={isPaid} />
      </Cell>
      <Cell label={t("teachers.payoutCard.actionColumn")}>
        {isPaid ? (
          <span className="text-xs text-green-deep/50">{payout.paidAt ? new Date(payout.paidAt).toLocaleDateString(locale) : "—"}</span>
        ) : (
          <IconButton icon={CheckCircle2} variant="solid" loading={marking} onClick={() => onMarkPaid(payout)}>
            {t("teachers.payoutCard.markAsPaid")}
          </IconButton>
        )}
      </Cell>
    </div>
  );
}
