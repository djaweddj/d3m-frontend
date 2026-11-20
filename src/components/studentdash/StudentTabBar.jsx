import { Home } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import NavItem from "./NavItem";
import { STUDENT_NAV } from "./studentPages";

export default function StudentTabBar() {
  const { t } = useLanguage();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex gap-1 overflow-x-auto bg-white p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(10,40,25,.35)] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
      <NavItem variant="tab" to="/home" icon={Home} label={t("studentDashboard.sidebar.homePage")} />
      {STUDENT_NAV.map(({ id, icon, path }) => (
        <NavItem
          key={id}
          variant="tab"
          to={path}
          icon={icon}
          label={t(`studentDashboard.nav.${id}`)}
        />
      ))}
    </nav>
  );
}
