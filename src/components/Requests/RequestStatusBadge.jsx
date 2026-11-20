import { useLanguage } from "../../context/LanguageContext";

const STYLES = {
  PENDING: "bg-gold/15 text-gold-deep",
  ACTIVE: "bg-green-deep/10 text-green-deep",
  CANCELLED: "bg-sand text-green-deep/60",
  REJECTED: "bg-algeria-red/10 text-algeria-red",
};

export default function RequestStatusBadge({ status }) {
  const { t } = useLanguage();
  const known = STYLES[status];
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${known ?? "bg-sand text-green-deep/60"}`}>
      {known ? t(`requests.status.${status}`) : status ?? "—"}
    </span>
  );
}