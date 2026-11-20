import { RefreshCw } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import DashCard from "../dash/DashCard";
import NButton from "../home/NButton";
import { ErrorNote } from "../home/ui";
import StatGrid from "./StatGrid";

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-sm bg-sand ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-5">
      <StatGrid>
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
      </StatGrid>
      <Skeleton className="h-64" />
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <DashCard className="flex flex-col items-center gap-4 py-12">
      <div className="w-full max-w-sm"><ErrorNote msg={message} /></div>
      {onRetry && (
        <NButton variant="outline" onClick={onRetry}>
          <RefreshCw className="size-4" />{t("studentDashboard.retry")}
        </NButton>
      )}
    </DashCard>
  );
}
