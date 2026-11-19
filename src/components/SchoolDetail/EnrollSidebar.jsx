import { Check, Hourglass, Lock } from "lucide-react";
import Reveal from "../home/Reveal";
import NButton from "../home/NButton";
import { Diamond } from "../home/Marks";
import { useLanguage } from "../../context/LanguageContext";

export default function EnrollSidebar({
  isStudent, daysCount, modulesCount, coursesCount, studentsCount, pendingCount, enrolledCount,
}) {
  const { t } = useLanguage();
  const k = isStudent ? "Student" : "Guest";

  return (
    <Reveal>
      <div className="border-t-2 border-gold bg-white p-6 sm:p-8">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-gold-deep">
          <Diamond className="size-2" />{t(`schoolDetails.sidebar.eyebrow${k}`)}
        </span>
        <h2 className="mt-3 font-display text-xl text-green-deep">{t(`schoolDetails.sidebar.title${k}`)}</h2>
        <p className="mb-6 mt-2 text-sm leading-7 text-green-deep/60">{t(`schoolDetails.sidebar.subtitle${k}`)}</p>

        {isStudent ? (
          <>
            <dl className="mb-5 border border-gold/25 bg-ivory px-4 py-1">
              {[
                [t("schoolDetails.sidebar.availableDays"), t("schoolDetails.sidebar.availableDaysValue", { count: daysCount })],
                [t("schoolDetails.sidebar.modulesLabel"), t("schoolDetails.sidebar.modulesValue", { count: modulesCount })],
                [t("schoolDetails.sidebar.coursesLabel"), t("schoolDetails.sidebar.coursesValue", { count: coursesCount })],
                [t("schoolDetails.sidebar.studentsLabel"), t("schoolDetails.sidebar.studentsValue", { count: studentsCount })],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 border-b border-gold/15 py-3 text-sm last:border-0">
                  <dt className="text-green-deep/60">{label}</dt>
                  <dd className="font-bold text-green-deep">{value}</dd>
                </div>
              ))}
            </dl>

            {pendingCount > 0 && (
              <p className="mb-3 flex items-center gap-3 border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-bold text-gold-deep">
                <Hourglass className="size-4 shrink-0 animate-pulse" />
                {t("schoolDetails.sidebar.pendingNotice", { count: pendingCount })}
              </p>
            )}
            {enrolledCount > 0 && (
              <p className="mb-3 flex items-center gap-3 border border-green-deep/20 bg-green-deep/10 px-4 py-3 text-sm font-bold text-green-deep">
                <Check className="size-4 shrink-0" />
                {t("schoolDetails.sidebar.enrolledNotice", { count: enrolledCount })}
              </p>
            )}
          </>
        ) : (
          <div className="border border-dashed border-gold/40 bg-ivory p-6 text-center">
            <span className="mx-auto mb-4 grid size-14 place-items-center rounded-sm bg-green-deep text-gold">
              <Lock className="size-6" strokeWidth={1.5} />
            </span>
            <p className="font-display text-lg text-green-deep">{t("schoolDetails.sidebar.loginRequiredTitle")}</p>
            <p className="mb-5 mt-2 text-sm leading-7 text-green-deep/60">{t("schoolDetails.sidebar.loginRequiredSubtitle")}</p>
            <div className="flex flex-col gap-3">
              <NButton to="/login" className="w-full">{t("schoolDetails.sidebar.loginCta")}</NButton>
              <NButton to="/signup" variant="outline" className="w-full">{t("schoolDetails.sidebar.signupCta")}</NButton>
            </div>
          </div>
        )}

        <div className="my-6 h-px bg-gold/25" />

        <p className="mb-4 text-xs font-bold text-green-deep/50">{t("schoolDetails.sidebar.whyUsTitle")}</p>
        <ul className="space-y-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex items-center gap-3 text-sm text-green-deep">
              <Diamond className="size-2 shrink-0 text-gold" />
              {t(`schoolDetails.sidebar.whyUs${n}`)}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}