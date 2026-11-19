import { useLanguage } from "../../context/LanguageContext";

const STYLES = {
  ACTIVE: { box: "bg-green-deep/10 text-green-deep", dot: "bg-green-deep" },
  TRIAL: { box: "bg-gold/15 text-gold-deep", dot: "bg-gold" },
  EXPIRED: { box: "bg-algeria-red/10 text-algeria-red", dot: "bg-algeria-red" },
  SUSPENDED: { box: "bg-sand text-green-deep/60", dot: "bg-green-deep/40" },
};

export default function StatusPill({ status, onDark = false }) {
  const { t } = useLanguage();
  const known = STYLES[status];
  const label = known ? t(`schoolDetails.status.${status.toLowerCase()}`) : status;
  if (!label) return null;
  const box = onDark ? "border border-ivory/25 bg-ivory/10 text-ivory" : (known ?? STYLES.ACTIVE).box;
  const dot = onDark ? "bg-gold" : (known ?? STYLES.ACTIVE).dot;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold ${box}`}>
      <span className={`size-1.5 rounded-full ${dot} ${status === "ACTIVE" ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}