import { useOutletContext } from "react-router-dom";
import { BookOpen, Users, Wallet } from "lucide-react";
import PageHeader from "../components/dash/PageHeader";
import DashCard from "../components/dash/DashCard";
import DashStat from "../components/dash/DashStat";
import { ErrorNote } from "../components/home/ui";
import { Page, InfoTile } from "../components/teacherdash/teacherBits";
import { teacherApi } from "../components/teacherdash/api";
import useFetch from "../components/teacherdash/useFetch";
import { NUM, CURRENCY, formatPeriod } from "../components/teacherdash/format";

export default function TeacherHome() {
  const { profile } = useOutletContext();
  const { data, error } = useFetch(() => Promise.all([teacherApi.modules(), teacherApi.payouts()]), []);

  const [modules, payouts] = data || [];
  const latest = payouts?.[0];

  return (
    <Page>
      <PageHeader
        title={`مرحباً، ${profile?.fullName || "أستاذ"}`}
        subtitle="تابع أقسامك وتلاميذك، وجدولك الأسبوعي، ومستحقاتك الشهرية."
      />

      <ErrorNote msg={error} />

      <div className="grid gap-4 sm:grid-cols-3">
        <DashStat
          icon={BookOpen}
          label="قسم نشط"
          value={modules ? modules.length : null}
          locale={NUM}
        />
        <DashStat
          icon={Users}
          label="تلميذ مسجل"
          value={modules ? modules.reduce((n, m) => n + (m.enrolledCount || 0), 0) : null}
          locale={NUM}
          delay={0.05}
        />
        <DashStat
          icon={Wallet}
          label="آخر مستحقات"
          value={latest ? Number(latest.payoutAmount) : null}
          suffix={CURRENCY}
          sub={latest ? formatPeriod(latest.period) : "لا توجد مستحقات بعد"}
          locale={NUM}
          delay={0.1}
        />
      </div>

      <DashCard title="معلوماتك">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile label="التخصص" value={profile?.specialization || "—"} />
          <InfoTile label="البريد الإلكتروني" value={profile?.email || "—"} />
        </div>
      </DashCard>
    </Page>
  );
}
