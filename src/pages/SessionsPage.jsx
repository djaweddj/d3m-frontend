import { BookOpen, CalendarDays, GraduationCap, MapPin, Wallet } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import DashCard from "../components/dash/DashCard";
import DashStat from "../components/dash/DashStat";
import { EmptyState, Pill } from "../components/home/ui";
import DateChip from "../components/studentdash/DateChip";
import InvoiceList from "../components/studentdash/InvoiceList";
import ListRow from "../components/studentdash/ListRow";
import StatGrid from "../components/studentdash/StatGrid";
import { cycle, fmtTime, moduleIdOf, moduleTitle, weeklyCount } from "../components/studentdash/studentUtils";

export default function SessionsPage({ sessions, enrollments, invoices, moduleMap }) {
  const { t, locale } = useLanguage();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const enrolledIds = new Set(enrollments.map(moduleIdOf));

  const upcoming = sessions
    .filter((s) => !(s.isArchived || s.archived) && enrolledIds.has(s.moduleId) && new Date(s.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 20);

  const weekly = weeklyCount(enrollments, moduleMap);
  const unpaid = invoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE").length;

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-5">
      <StatGrid>
        <DashStat icon={CalendarDays} label={t("studentDashboard.sessions.statWeekly")} value={weekly || null} locale={locale} />
        <DashStat icon={BookOpen} label={t("studentDashboard.sessions.statUpcoming")} value={upcoming.length} locale={locale} delay={0.07} />
        <DashStat icon={Wallet} label={t("studentDashboard.sessions.statUnpaid")} value={unpaid} locale={locale} delay={0.14} />
      </StatGrid>

      <DashCard title={t("studentDashboard.sessions.upcomingTitle")}>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarDays} title={t("studentDashboard.sessions.noUpcoming")} />
        ) : (
          <ul className="space-y-2">
            {upcoming.map((s, i) => {
              const mod = moduleMap[s.moduleId];
              return (
                <li key={s.id}>
                  <ListRow
                    accent={cycle(i)}
                    leading={<DateChip date={fmtDate(s.date)} time={`${fmtTime(s.startTime)} – ${fmtTime(s.endTime)}`} />}
                    title={moduleTitle(mod, t, s.moduleId)}
                    meta={[
                      { icon: GraduationCap, text: mod?.teacherName || "—" },
                      { icon: MapPin, text: mod?.classroomName || "—" },
                    ]}
                    trailing={<Pill tone="gold">{mod?.level || "—"}</Pill>}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </DashCard>

      <InvoiceList
        invoices={invoices}
        title={t("studentDashboard.sessions.invoicesTitle")}
        emptyText={t("studentDashboard.sessions.noInvoices")}
        name={(inv) => inv.moduleName || "—"}
        info={(inv) => [
          { icon: CalendarDays, text: inv.period ? String(inv.period).replace("-", "/") : "—" },
          { text: inv.dueDate && `${t("studentDashboard.sessions.dueDateLabel")} ${new Date(inv.dueDate).toLocaleDateString(locale)}` },
        ]}
      />
    </div>
  );
}
