import { useLanguage } from "../../context/LanguageContext";
import { studentApi } from "./studentApi";
import useFetch, { useAsync } from "./useFetch";
import { schoolIdOf } from "./studentUtils";

// Every request of the student dashboard in one place.
// `resources` entries all share the shape { data, loading, error, reload }.
export default function useStudentData() {
  const { t } = useLanguage();
  const errEnroll = t("studentDashboard.errors.enrollmentsLoad");
  const errInvoice = t("studentDashboard.errors.invoicesLoad");

  const profile = useFetch(studentApi.getProfile, t("studentDashboard.errors.profileLoad"));
  const enrollments = useFetch(studentApi.getEnrollments, errEnroll);
  const invoices = useFetch(studentApi.getInvoices, errInvoice);
  const courseEnrollments = useFetch(studentApi.getCourseEnrollments, errEnroll);
  const courseInvoices = useFetch(studentApi.getCourseInvoices, errInvoice);

  const enrolled = enrollments.data || [];
  const schoolIds = [...new Set(enrolled.map(schoolIdOf).filter(Boolean))];

  const sessions = useAsync(
    async () => {
      if (schoolIds.length === 0) return [];
      const res = await Promise.all(schoolIds.map((id) => studentApi.getSessionsBySchool(id)));
      return res.flatMap((r) => r.data?.content ?? r.data ?? []);
    },
    schoolIds.join(","),
    []
  );

  const level = profile.data?.level;
  const modules = useAsync(
    async () => {
      const targets = {};
      enrolled.forEach((enr) => {
        const sid = schoolIdOf(enr);
        const lvl = enr.level ?? enr.module?.level ?? level;
        if (sid && lvl) targets[`${sid}_${lvl}`] = { sid, lvl };
      });
      const results = await Promise.all(
        Object.values(targets).map(({ sid, lvl }) =>
          studentApi.browseModules(sid, lvl).catch(() => ({ data: [] }))
        )
      );
      const map = {};
      results.forEach((r) => (r.data?.content ?? r.data ?? []).forEach((m) => { map[m.id] = m; }));
      enrolled.forEach((enr) => {
        if (enr.module) map[enr.module.id] = enr.module;
        else if (enr.moduleId && enr.moduleName && !map[enr.moduleId])
          map[enr.moduleId] = { id: enr.moduleId, name: enr.moduleName, subjectName: enr.moduleName };
      });
      return map;
    },
    `${enrolled.map((e) => e.id).join(",")}|${level}`,
    {}
  );

  const resources = { profile, enrollments, invoices, courseEnrollments, courseInvoices, sessions, modules };
  const all = Object.values(resources);

  return {
    resources,
    schoolCount: schoolIds.length,
    isLoading: all.some((r) => r.loading),
    reloadAll: () => all.forEach((r) => r.reload()),
  };
}
