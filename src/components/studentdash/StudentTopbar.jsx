import { LogOut, RefreshCw } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useStudent } from "./StudentContext";
import { Spinner } from "../home/ui";
import IconButton from "./IconButton";
import useLogout from "./useLogout";

export default function StudentTopbar() {
  const { t } = useLanguage();
  const { resources, isLoading, reloadAll } = useStudent();
  const logout = useLogout();
  const { data: profile, loading } = resources.profile;

  return (
    <header className="relative flex h-16 shrink-0 items-center justify-between gap-4 overflow-hidden bg-ink px-4 text-ivory sm:px-8">
      <div className="nm-pattern pointer-events-none absolute inset-0 opacity-[0.08]" />
      <div className="relative min-w-0">
        <p className="text-[11px] text-gold">{t("studentDashboard.welcome.greeting")}</p>
        <h2 className="truncate font-display text-base">
          {loading ? t("studentDashboard.common.loading") : profile?.fullName || "—"}
        </h2>
      </div>
      <div className="relative flex items-center gap-2">
        {isLoading && <Spinner className="size-4 text-gold" />}
        <IconButton icon={RefreshCw} label={t("studentDashboard.refresh")} onClick={reloadAll} />
        <IconButton icon={LogOut} label={t("studentDashboard.sidebar.logout")} onClick={logout} className="md:hidden" />
      </div>
    </header>
  );
}
