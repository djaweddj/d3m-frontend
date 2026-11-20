import { useState } from "react";
import { X, Moon } from "lucide-react";
import PageHeader from "../components/dash/PageHeader";
import DashCard from "../components/dash/DashCard";
import NButton from "../components/home/NButton";
import { EmptyState, ErrorNote, fieldCls } from "../components/home/ui";
import { Page, Loading, PayoutRow } from "../components/teacherdash/teacherBits";
import { teacherApi } from "../components/teacherdash/api";
import useFetch from "../components/teacherdash/useFetch";
import { formatPeriod, formatMoney } from "../components/teacherdash/format";

export default function TeacherPayouts() {
  const [period, setPeriod] = useState(""); // "" = full history

  const { data, loading, error } = useFetch(
    () =>
      Promise.all([
        period ? teacherApi.payoutForMonth(period).then((p) => (p ? [p] : [])) : teacherApi.payouts(),
        teacherApi.coursePayouts(),
      ]),
    [period]
  );
  const [modulePayouts = [], coursePayouts = []] = data || [];

  return (
    <Page>
      <PageHeader title="سجل المستحقات" subtitle="مستحقاتك الشهرية حسب نسبتك من إيرادات أقسامك ودوراتك.">
        <label className="flex flex-col gap-1 text-xs text-ink/60">
          تصفية حسب الشهر
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className={`${fieldCls} !h-12 !w-auto bg-white`} />
        </label>
        {period && (
          <NButton variant="outline" onClick={() => setPeriod("")} className="self-end"><X className="size-4" />إلغاء التصفية</NButton>
        )}
      </PageHeader>

      <ErrorNote msg={error} />

      {loading ? <Loading /> : (
        <>
          <DashCard title="مستحقات الأقسام">
            {modulePayouts.length === 0 ? (
              <EmptyState
                icon={Moon}
                title={period ? "لا توجد مستحقات لهذا الشهر" : "لا توجد مستحقات محسوبة بعد"}
                subtitle="تُحسب المستحقات تلقائياً في بداية كل شهر."
              />
            ) : (
              <div className="space-y-3">
                {modulePayouts.map((p) => (
                  <PayoutRow
                    key={p.id}
                    title={formatPeriod(p.period)}
                    meta={`إيرادات أقسامك: ${formatMoney(p.totalModuleRevenue)} · نسبتك: ${p.percentage}%`}
                    paidAt={p.paidAt}
                    amount={p.payoutAmount}
                    status={p.status}
                  />
                ))}
              </div>
            )}
          </DashCard>

          <DashCard title="مستحقات الدورات">
            {coursePayouts.length === 0 ? (
              <EmptyState icon={Moon} title="لا توجد مستحقات دورات محسوبة بعد" />
            ) : (
              <div className="space-y-3">
                {coursePayouts.map((p) => (
                  <PayoutRow
                    key={p.id}
                    title={p.courseName}
                    meta={`إيرادات الدورة: ${formatMoney(p.totalCourseRevenue)} · نسبتك: ${p.percentage}%`}
                    paidAt={p.paidAt}
                    amount={p.payoutAmount}
                    status={p.status}
                  />
                ))}
              </div>
            )}
          </DashCard>
        </>
      )}
    </Page>
  );
}
