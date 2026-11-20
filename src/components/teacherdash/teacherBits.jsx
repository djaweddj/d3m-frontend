// Small shared pieces used by more than one teacher page.
import { Spinner } from "../../components/home/ui";
import Badge from "../../components/dash/Badge";
import { PAYOUT_STATUS, formatDate, formatMoney } from "./format";

export function Page({ wide = false, children }) {
  return <div className={`mx-auto space-y-6 ${wide ? "max-w-6xl" : "max-w-5xl"}`}>{children}</div>;
}

export function Loading({ label = "جاري التحميل..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-sm text-green-deep/60">
      <Spinner className="size-5 text-gold-deep" />
      {label}
    </div>
  );
}

export function InfoTile({ label, value, className = "" }) {
  return (
    <div className={`rounded-sm bg-canvas p-4 ${className}`}>
      <p className="mb-1 text-xs text-ink/55">{label}</p>
      <p className="break-words text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

// One payout line — used for both module payouts and course payouts.
export function PayoutRow({ title, meta, paidAt, amount, status }) {
  const st = PAYOUT_STATUS[status] || { label: status, tone: "neutral" };
  const paid = formatDate(paidAt);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm bg-canvas p-4">
      <div className="min-w-0">
        <h4 className="font-display text-base text-ink">{title}</h4>
        <p className="mt-1 text-xs text-ink/60">{meta}</p>
        {paid && <p className="mt-1 text-xs text-ink/40">تاريخ الدفع: {paid}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-display text-xl tabular-nums text-green-deep">{formatMoney(amount)}</span>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>
    </div>
  );
}
