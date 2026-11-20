import { GraduationCap, School, Wallet } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import DashCard from "../components/dash/DashCard";
import DashStat from "../components/dash/DashStat";
import { EmptyState, IconTile } from "../components/home/ui";
import AmountStatus from "../components/studentdash/AmountStatus";
import InvoiceList from "../components/studentdash/InvoiceList";
import ListRow from "../components/studentdash/ListRow";
import StatGrid from "../components/studentdash/StatGrid";
import { cycle, fill, sumUnpaid } from "../components/studentdash/studentUtils";

export default function CoursesPage({ courseEnrollments, courseInvoices }) {
  const { t, locale } = useLanguage();
  const due = sumUnpaid(courseInvoices);
  const fmtDate = (d) => new Date(d).toLocaleDateString(locale);

  return (
    <div className="space-y-5">
      <StatGrid cols={2}>
        <DashStat icon={GraduationCap} label={t("studentDashboard.courses.enrolledCourses")} value={courseEnrollments.length} locale={locale} />
        <DashStat
          icon={Wallet}
          label={t("studentDashboard.schools.amountDue")}
          value={due || null}
          suffix={` ${t("studentDashboard.currency")}`}
          locale={locale}
          delay={0.07}
        />
      </StatGrid>

      <DashCard title={t("studentDashboard.courses.enrolledCoursesTitle")}>
        {courseEnrollments.length === 0 ? (
          <EmptyState icon={GraduationCap} title={t("studentDashboard.courses.noCourses")} />
        ) : (
          <ul className="space-y-2">
            {courseEnrollments.map((enr, i) => (
              <li key={enr.id}>
                <ListRow
                  accent={cycle(i)}
                  leading={<IconTile icon={GraduationCap} tone="gold" />}
                  title={enr.courseName || fill(t("studentDashboard.courses.courseFallback"), { id: enr.courseId })}
                  meta={[
                    { text: enr.subjectName || "—" },
                    { icon: School, text: enr.schoolName || "—" },
                  ]}
                  trailing={<AmountStatus amount={enr.totalPrice ?? undefined} kind="enrollment" status={enr.status} />}
                />
              </li>
            ))}
          </ul>
        )}
      </DashCard>

      <InvoiceList
        invoices={courseInvoices}
        title={t("studentDashboard.courses.invoicesTitle")}
        emptyText={t("studentDashboard.courses.noInvoices")}
        name={(inv) => inv.courseName || "—"}
        info={(inv) => [
          { text: inv.dueDate && `${t("studentDashboard.sessions.dueDateLabel")} ${fmtDate(inv.dueDate)}` },
          { text: inv.paidAt && `${t("studentDashboard.courses.paidAt")} ${fmtDate(inv.paidAt)}` },
        ]}
      />
    </div>
  );
}
