import { Ticket, CalendarDays, User } from "lucide-react";
import ProgressBar from "./ProgressBar";
import EnrollAction from "./EnrollAction";
import { useLanguage } from "../../context/LanguageContext";
import { getDateLocale, hhmm, nextUpcomingSession } from "../SchoolDetail/CourseSessions";

export default function CourseEventCard({ course, onEnroll, isEnrolled, isPending }) {
  const { t, locale } = useLanguage();
  const dateLocale = getDateLocale(locale);
  const isFull = course.maxStudents != null && course.enrolledCount >= course.maxStudents;
  const pct = course.maxStudents ? Math.min(100, Math.round((course.enrolledCount / course.maxStudents) * 100)) : 0;
  const session = nextUpcomingSession(course.sessions);
  const sessionCount = course.sessions?.length || 0;
  const date = session?.date ? new Date(session.date) : null;

  return (
    <div className="w-72 shrink-0 snap-start sm:w-80">
      <div className="group flex h-full flex-col border border-gold/25 bg-white transition duration-500 hover:-translate-y-1 hover:border-gold">
        {/* Banner */}
        <div className="relative flex items-center gap-4 overflow-hidden bg-green-deep p-5">
          <div className="nm-pattern pointer-events-none absolute inset-0 opacity-[0.10]" />
          <span className="relative grid size-14 shrink-0 place-items-center bg-ivory text-center ring-1 ring-gold/30">
            {date ? (
              <span>
                <span className="block font-display text-xl leading-none tabular-nums text-green-deep">{date.getDate()}</span>
                <span className="mt-1 block text-[11px] font-bold text-gold-deep">
                  {date.toLocaleDateString(dateLocale, { month: "short" })}
                </span>
              </span>
            ) : (
              <Ticket className="size-6 text-gold-deep" strokeWidth={1.5} />
            )}
          </span>
          <div className="relative min-w-0">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-0.5 text-xs font-bold text-gold">
              <Ticket className="size-3" />{t("schoolDetails.courses.badge")}
            </span>
            <h4 className="truncate font-display text-lg text-ivory">{course.name}</h4>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-2">
            {course.subjectName && (
              <span className="border border-gold/30 bg-ivory px-3 py-1 text-xs font-bold text-green-deep">{course.subjectName}</span>
            )}
            {course.level && (
              <span className="bg-green-deep/10 px-3 py-1 text-xs font-bold text-green-deep">{course.level}</span>
            )}
          </div>

          <p className="flex items-center gap-2 text-sm text-green-deep/70">
            <User className="size-4 shrink-0 text-gold-deep" />
            {course.teacherName || "—"}
            {course.externalTeacher && (
              <span className="text-xs font-bold text-gold-deep">· {t("schoolDetails.courses.externalTeacher")}</span>
            )}
          </p>

          {course.description && (
            <p className="line-clamp-2 text-sm leading-7 text-green-deep/60">{course.description}</p>
          )}

          <div className="space-y-1 border border-dashed border-gold/40 bg-ivory p-3">
            <p className="flex items-center gap-2 text-xs font-bold text-green-deep/50">
              <CalendarDays className="size-3.5" />
              {sessionCount > 1
                ? t("schoolDetails.courses.sessionsScheduled", { count: sessionCount })
                : t("schoolDetails.courses.sessionDate")}
            </p>
            {session && (
              <p className="text-sm font-semibold text-green-deep">
                {date ? date.toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" }) : "—"}
                {" · "}
                <span dir="ltr">{hhmm(session.startTime)}–{hhmm(session.endTime)}</span>
              </p>
            )}
          </div>

          <div>
            <ProgressBar value={pct} full={isFull} />
            <p className="mt-1.5 text-xs text-green-deep/60">
              {t("schoolDetails.courses.enrolledCount", { count: course.enrolledCount, max: course.maxStudents ?? "∞" })}
              {isFull && <span className="font-bold text-algeria-red"> · {t("schoolDetails.module.full")}</span>}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-gold/25 pt-4">
            <div>
              <p className="font-display text-xl tabular-nums text-green-deep">{course.totalPrice?.toLocaleString()}</p>
              <p className="text-xs text-green-deep/60">{t("schoolDetails.courses.pricePerCourse")}</p>
            </div>
            <EnrollAction
              variant="gold"
              isEnrolled={isEnrolled}
              isPending={isPending}
              isFull={isFull}
              onClick={() => onEnroll(course)}
              label={t("schoolDetails.courses.enrollCta")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}