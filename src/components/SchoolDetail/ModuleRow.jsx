import { User } from "lucide-react";
import ProgressBar from "./ProgressBar";
import EnrollAction from "./EnrollAction";
import { useLanguage } from "../../context/LanguageContext";
import { hhmm } from "../SchoolDetail/CourseSessions";

export default function ModuleRow({ mod, onEnroll, isEnrolled, isPending }) {
  const { t } = useLanguage();
  const isFull = !!mod.full;
  const pct = mod.maxStudents ? Math.min(100, Math.round((mod.enrolledCount / mod.maxStudents) * 100)) : 0;

  return (
    <div className="flex flex-col gap-5 border border-gold/25 bg-white p-4 transition duration-500 hover:border-gold sm:flex-row sm:items-center">
      <div className="flex shrink-0 items-center justify-center gap-3 bg-green-deep px-5 py-3 text-ivory sm:flex-col sm:gap-0">
        <p dir="ltr" className="font-display text-lg tabular-nums">{hhmm(mod.startTime)}</p>
        <span className="block h-px w-6 bg-gold/60 sm:my-1.5" />
        <p dir="ltr" className="text-xs tabular-nums text-ivory/60">{hhmm(mod.endTime)}</p>
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="font-display text-lg text-green-deep">{mod.moduleName}</h4>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-green-deep/60">
          <User className="size-3.5 text-gold-deep" />
          {mod.teacherName}
          {mod.level && <span className="text-gold">•</span>}
          {mod.level}
        </p>
        <div className="mt-3">
          <ProgressBar value={pct} full={isFull} />
          <p className="mt-1.5 text-xs text-green-deep/60">
            {t("schoolDetails.module.enrolledCount", { count: mod.enrolledCount, max: mod.maxStudents })}
            {isFull && <span className="font-bold text-algeria-red"> · {t("schoolDetails.module.full")}</span>}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gold/25 pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
        <div className="sm:text-end">
          <p className="font-display text-xl tabular-nums text-green-deep">{mod.monthlyPrice?.toLocaleString()}</p>
          <p className="text-xs text-green-deep/60">{t("schoolDetails.module.pricePerMonth")}</p>
        </div>
        <EnrollAction
          isEnrolled={isEnrolled}
          isPending={isPending}
          isFull={isFull}
          onClick={() => onEnroll(mod)}
          label={t("schoolDetails.module.enrollCta")}
        />
      </div>
    </div>
  );
}