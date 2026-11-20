import { CheckCircle2, Clock } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function PayoutStatusPill({ isPaid }) {
  const { t } = useLanguage();
  const Icon = isPaid ? CheckCircle2 : Clock;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        isPaid ? "bg-green-deep/10 text-green-deep" : "bg-gold/15 text-gold-deep"
      }`}
    >
      <Icon className="size-3.5" />
      {isPaid ? t("teacherDashboard.payoutStatus.PAID") : t("teacherDashboard.payoutStatus.PENDING")}
    </span>
  );
}
