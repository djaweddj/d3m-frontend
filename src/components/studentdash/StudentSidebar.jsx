import { GraduationCap, Home, LogOut } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useStudent } from "./StudentContext";
import { ColumnMark } from "../home/Marks";
import { Avatar, IconTile } from "../home/ui";
import NavItem from "./NavItem";
import { STUDENT_NAV } from "./studentPages";
import useLogout from "./useLogout";

export default function StudentSidebar() {
  const { t } = useLanguage();
  const { resources, schoolCount } = useStudent();
  const logout = useLogout();
  const profile = resources.profile.data;

  return (
    <aside className="relative hidden h-full w-60 shrink-0 flex-col overflow-hidden bg-ink text-ivory md:flex">
      <ColumnMark className="pointer-events-none absolute -bottom-6 end-2 h-56 text-gold/10" />

      <div className="relative flex items-center gap-3 px-5 py-6">
        <IconTile icon={GraduationCap} tone="gold" />
        <div className="min-w-0">
          <p className="font-display text-sm">{t("studentDashboard.sidebar.platformName")}</p>
          <p className="text-[11px] text-ivory/50">{t("studentDashboard.sidebar.subtitle")}</p>
        </div>
      </div>

      <div className="relative mx-5 mb-4 flex items-center gap-3 rounded-sm bg-ivory/5 p-3">
        <Avatar name={profile?.fullName} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{profile?.fullName || "…"}</p>
          <p className="truncate text-xs text-gold">
            {profile?.level || t("studentDashboard.sidebar.enrolledStudentFallback")}
          </p>
        </div>
      </div>

      <nav className="relative flex-1 overflow-y-auto">
        <NavItem to="/home" icon={Home} label={t("studentDashboard.sidebar.homePage")} />
        {STUDENT_NAV.map(({ id, icon, path }) => (
          <NavItem key={id} to={path} icon={icon} label={t(`studentDashboard.nav.${id}`)} />
        ))}
      </nav>

      {schoolCount > 0 && (
        <div className="relative mx-5 mb-3 flex items-center justify-between rounded-sm bg-ivory/10 px-3 py-2 text-xs text-ivory/70">
          <span>{t("studentDashboard.sidebar.registeredSchools")}</span>
          <span className="font-display text-sm text-gold">{schoolCount}</span>
        </div>
      )}

      <div className="relative pb-3">
        <NavItem icon={LogOut} label={t("studentDashboard.sidebar.logout")} onClick={logout} />
      </div>
    </aside>
  );
}
