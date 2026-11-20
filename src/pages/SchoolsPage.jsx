import { GraduationCap, School, Wallet } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import DashCard from "../components/dash/DashCard";
import DashStat from "../components/dash/DashStat";
import { EmptyState, Pill } from "../components/home/ui";
import ListRow from "../components/studentdash/ListRow";
import StatGrid from "../components/studentdash/StatGrid";
import StatusBadge from "../components/BrowseSchools/StatusBadge";
import { cycle, fill, moduleIdOf, moduleTitle, schoolIdOf, sumUnpaid } from "../components/studentdash/studentUtils";

export default function SchoolsPage({ enrollments, moduleMap, invoices }) {
  const { t, locale } = useLanguage();

  const grouped = new Map();
  enrollments.forEach((enr) => {
    const id = schoolIdOf(enr) ?? "unknown";
    if (!grouped.has(id)) {
      grouped.set(id, {
        id,
        name: enr.schoolName || enr.school?.name || fill(t("studentDashboard.schools.schoolFallback"), { id }),
        items: [],
      });
    }
    grouped.get(id).items.push(enr);
  });
  const schools = [...grouped.values()];
  const due = sumUnpaid(invoices);

  return (
    <div className="space-y-5">
      <StatGrid cols={2}>
        <DashStat icon={School} label={t("studentDashboard.schools.registeredSchools")} value={schools.length} locale={locale} />
        <DashStat
          icon={Wallet}
          label={t("studentDashboard.schools.amountDue")}
          value={due || null}
          suffix={` ${t("studentDashboard.currency")}`}
          locale={locale}
          delay={0.07}
        />
      </StatGrid>

      {schools.length === 0 ? (
        <DashCard><EmptyState icon={School} title={t("studentDashboard.schools.noSchools")} /></DashCard>
      ) : (
        schools.map((school, si) => (
          <DashCard
            key={school.id}
            title={school.name}
            action={<Pill tone="sand">{fill(t("studentDashboard.schools.moduleCount"), { count: school.items.length })}</Pill>}
          >
            <ul className="space-y-2">
              {school.items.map((enr, ei) => {
                const mod = moduleMap[moduleIdOf(enr)];
                return (
                  <li key={enr.id || ei}>
                    <ListRow
                      accent={cycle(si)}
                      title={moduleTitle(mod, t, enr.moduleId)}
                      meta={mod ? [
                        { icon: GraduationCap, text: mod.teacherName || "—" },
                        { text: fill(t("studentDashboard.schedule.sessionsPerWeek"), { count: mod.schedules?.length || 0 }) },
                      ] : []}
                      trailing={
                        <>
                          {mod && <Pill tone="gold">{mod.level}</Pill>}
                          {enr.status && <StatusBadge kind="enrollment" status={enr.status} />}
                        </>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </DashCard>
        ))
      )}
    </div>
  );
}
