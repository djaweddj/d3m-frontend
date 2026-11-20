import { useLanguage } from "../../context/LanguageContext";
import StatusBadge from "./StatusBadge";

// Price on top, status badge below. Pass amount={undefined} to hide the price line.
export default function AmountStatus({ amount, kind, status }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-end gap-1.5">
      {amount !== undefined && (
        <span className="font-display text-sm tabular-nums text-ink">
          {amount ? `${amount} ${t("studentDashboard.currency")}` : "—"}
        </span>
      )}
      <StatusBadge kind={kind} status={status} />
    </div>
  );
}
