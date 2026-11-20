import { useLanguage } from "../context/LanguageContext";
import { useStudent } from "../components/studentdash/StudentContext";
import PageHeader from "../components/dash/PageHeader";
import Reveal from "../components/home/Reveal";
import { ErrorState, PageSkeleton } from "../components/studentdash/PageState";
import { STUDENT_PAGES } from "../components/studentdash/studentPages";

// Route element for one student page: header + loading / error / page body.
// Usage: <Route path="sessions" element={<StudentPage id="sessions" />} />
export default function StudentPage({ id }) {
  const { t } = useLanguage();
  const { resources } = useStudent();
  const page = STUDENT_PAGES[id];

  const waiting = page.needs.map((key) => resources[key]);
  const failed = waiting.find((r) => r.error);

  let body;
  if (waiting.some((r) => r.loading)) body = <PageSkeleton />;
  else if (failed) body = <ErrorState message={failed.error} onRetry={failed.reload} />;
  else body = page.render(resources);

  return (
    <>
      <PageHeader
        title={t(`studentDashboard.pages.${id}.title`)}
        subtitle={t(`studentDashboard.pages.${id}.subtitle`)}
      />
      <Reveal key={id} y={12}>{body}</Reveal>
    </>
  );
}
