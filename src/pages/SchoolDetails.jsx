import { useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, BookOpen, CalendarDays, GraduationCap, Users } from "lucide-react";
import api from "../api.jsx";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import useSchoolDetails from "../components/SchoolDetail/UseSchoolDetails";
import useSchoolTheme from "../components/SchoolDetail/UseSchoolTheme";

import Reveal from "../components/home/Reveal.jsx";
import NButton from "../components/home/NButton.jsx";
import StatCard from "../components/home/StatCard";
import EmptyState from "../components/BrowseSchools/EmptyState";
import SchoolHero from "../components/SchoolDetail/SchoolHero.jsx";
import SchoolInfo from "../components/SchoolDetail/SchoolInfo.jsx";
import BlockHeading from "../components/SchoolDetail/BlockHeading.jsx";
import CourseEventCard from "../components/SchoolDetail/CourseEventCard.jsx";
import TeacherCard from "../components/SchoolDetail/TeacherCard.jsx";
import DayTabs from "../components/SchoolDetail/DayTabs.jsx";
import ModuleRow from "../components/SchoolDetail/ModuleRow.jsx";
import EnrollSidebar from "../components/SchoolDetail/EnrollSidebar.jsx";
import EnrollDialog from "../components/SchoolDetail/EnrollDialog.jsx";
import Toast from "../components/SchoolDetail/Toast.jsx";
import SchoolDetailsSkeleton from "../components/SchoolDetail/SchoolDetailsSkeleton.jsx";

const DAY_ORDER = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function SchoolDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, dir, locale } = useLanguage();

  const d = useSchoolDetails(id, user);
  const { school } = d;
  const themeVars = useSchoolTheme(school?.logoUrl);

  const [target, setTarget] = useState(null); // { kind: "module" | "course", item }
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const sortedDays = useMemo(
    () => Object.keys(school?.modulesByDay || {}).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)),
    [school]
  );
  const dayLabel = (day) => t(`schoolDetails.days.${day.toLowerCase()}`);

  const isStudent = user?.role === "STUDENT";
  const requestEnroll = (kind, item) => {
    if (!isStudent) { navigate("/login"); return; }
    setTarget({ kind, item });
  };

  const confirmEnroll = async () => {
    if (!target) return;
    const { kind, item } = target;
    setSubmitting(true);
    try {
      if (kind === "module") {
        await api.post("/api/enrollments/request", { moduleId: item.moduleId });
        d.setPendingIds((p) => [...p, item.moduleId]);
        showToast(t("schoolDetails.toast.moduleRequestSuccess", { moduleName: item.moduleName }));
      } else {
        await api.post(`/api/courses/${item.id}/enroll-request`);
        d.setPendingCourseIds((p) => [...p, item.id]);
        showToast(t("schoolDetails.toast.courseRequestSuccess", { courseName: item.name }));
      }
      setTarget(null);
    } catch (err) {
      showToast(err?.response?.data?.message || t("schoolDetails.toast.genericError"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (d.loading) return <SchoolDetailsSkeleton />;

  if (d.notFound || !school)
    return (
      <div dir={dir} className="grid min-h-screen place-items-center bg-ivory px-4 py-24">
        <div className="w-full max-w-md text-center">
          <EmptyState
            icon={Building2}
            title={t("schoolDetails.notFound.title")}
            subtitle={t("schoolDetails.notFound.subtitle")}
          />
          <NButton to="/schools" className="mt-6 w-full">{t("schoolDetails.notFound.back")}</NButton>
        </div>
      </div>
    );

  const modulesForDay = d.activeDay ? school.modulesByDay[d.activeDay] || [] : [];

  return (
    <div dir={dir} style={themeVars} className="min-h-screen bg-ivory">
      <AnimatePresence>{toast && <Toast key={toast.message} {...toast} />}</AnimatePresence>
      <AnimatePresence>
        {target && (
          <EnrollDialog
            kind={target.kind}
            item={target.item}
            schoolName={school.schoolName}
            loading={submitting}
            onConfirm={confirmEnroll}
            onCancel={() => setTarget(null)}
          />
        )}
      </AnimatePresence>

      <SchoolHero school={school} />

      <div className="container mx-auto grid gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:px-8 lg:py-20">
        <div className="flex min-w-0 flex-col gap-14">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Users} value={school.totalTeachers} label={t("schoolDetails.stats.teachers")} locale={locale} />
            <StatCard icon={BookOpen} value={school.totalModules} label={t("schoolDetails.stats.modules")} locale={locale} delay={0.08} />
            <StatCard icon={GraduationCap} value={school.totalStudents} label={t("schoolDetails.stats.students")} locale={locale} delay={0.16} />
          </div>

          <SchoolInfo school={school} />

          {!d.coursesLoading && d.courses.length > 0 && (
            <Reveal>
              <BlockHeading
                title={t("schoolDetails.courses.title")}
                subtitle={t("schoolDetails.courses.subtitle")}
                badge={t("schoolDetails.courses.count", { count: d.courses.length })}
              />
              <div className="-mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-4 pt-2">
                {d.courses.map((course) => (
                  <CourseEventCard
                    key={course.id}
                    course={course}
                    isEnrolled={d.enrolledCourseIds.includes(course.id)}
                    isPending={d.pendingCourseIds.includes(course.id)}
                    onEnroll={(c) => requestEnroll("course", c)}
                  />
                ))}
              </div>
            </Reveal>
          )}

          {school.teachers?.length > 0 && (
            <div>
              <Reveal>
                <BlockHeading
                  title={t("schoolDetails.teachers.title")}
                  badge={t("schoolDetails.teachers.count", { count: school.teachers.length })}
                />
              </Reveal>
              <div className="grid gap-5 sm:grid-cols-2">
                {school.teachers.map((teacher, i) => (
                  <TeacherCard key={teacher.teacherId} teacher={teacher} index={i} />
                ))}
              </div>
            </div>
          )}

          {sortedDays.length > 0 && (
            <Reveal>
              <BlockHeading
                title={t("schoolDetails.schedule.title")}
                badge={t("schoolDetails.schedule.moduleCount", { count: school.totalModules })}
              />
              <DayTabs
                days={sortedDays}
                active={d.activeDay}
                onChange={d.setActiveDay}
                getLabel={dayLabel}
                getCount={(day) => school.modulesByDay[day]?.length || 0}
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={d.activeDay}
                  role="tabpanel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-4"
                >
                  {modulesForDay.map((mod) => (
                    <ModuleRow
                      key={`${mod.moduleId}-${mod.day}`}
                      mod={mod}
                      isEnrolled={d.enrolledIds.includes(mod.moduleId)}
                      isPending={d.pendingIds.includes(mod.moduleId)}
                      onEnroll={(m) => requestEnroll("module", m)}
                    />
                  ))}
                  {modulesForDay.length === 0 && (
                    <EmptyState
                      icon={CalendarDays}
                      title={t("schoolDetails.schedule.emptyDayTitle", { day: dayLabel(d.activeDay) })}
                      subtitle={t("schoolDetails.schedule.emptyDaySubtitle")}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </Reveal>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <EnrollSidebar
            isStudent={isStudent}
            daysCount={sortedDays.length}
            modulesCount={school.totalModules}
            coursesCount={d.courses.length}
            studentsCount={school.totalStudents}
            pendingCount={d.pendingIds.length + d.pendingCourseIds.length}
            enrolledCount={d.enrolledIds.length + d.enrolledCourseIds.length}
          />
        </aside>
      </div>
    </div>
  );
}