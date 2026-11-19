import { Check, Hourglass } from "lucide-react";
import NButton from "../home/NButton";
import { useLanguage } from "../../context/LanguageContext";

const TAG = "inline-flex h-12 items-center justify-center gap-2 rounded-sm px-6 text-sm font-bold";

// One enroll control for modules and courses: enrolled / pending / full / open
export default function EnrollAction({ isEnrolled, isPending, isFull, onClick, label, variant = "green" }) {
  const { t } = useLanguage();

  if (isEnrolled)
    return (
      <span className={`${TAG} bg-green-deep/10 text-green-deep`}>
        <Check className="size-4" />{t("schoolDetails.module.enrolled")}
      </span>
    );
  if (isPending)
    return (
      <span className={`${TAG} bg-gold/15 text-gold-deep`}>
        <Hourglass className="size-4 animate-pulse" />{t("schoolDetails.module.pending")}
      </span>
    );
  if (isFull)
    return (
      <span className={`${TAG} cursor-not-allowed bg-sand text-green-deep/40`}>
        {t("schoolDetails.module.full")}
      </span>
    );
  return <NButton type="button" variant={variant} onClick={onClick}>{label}</NButton>;
}