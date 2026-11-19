import { useLanguage } from "../../context/LanguageContext";

const STYLES = {
  ACTIVE: { box: "bg-green-deep/10 text-green-deep", dot: "bg-green-deep" },
  TRIAL: { box: "bg-gold/15 text-gold-deep", dot: "bg-gold" },
  EXPIRED: { box: "bg-algeria-red/10 text-algeria-red", dot: "bg-algeria-red" },
  SUSPENDED: { box: "bg-sand text-green-deep/60", dot: "bg-green-deep/40" },
};

export default function StatusBadge({ status }) {
  const { t } = useLanguage();
  const s = STYLES[status] ?? STYLES.ACTIVE;
  const label = STYLES[status] ? t(`browseSchools.status.${status}`) : status;
  if (!label) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${s.box}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}