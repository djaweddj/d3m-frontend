import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, CalendarDays, Settings, LogOut,
  School, UserPlus, BookOpen, Home, ChevronsRight, Menu, X, Book,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import useAccent from "./dash/useAccent";
import { Diamond } from "./home/Marks";

const NAV = [
  { to: "/home",                icon: Home,            key: "home",               section: null },
  { to: "/dashboard",           icon: LayoutDashboard, key: "dashboard",          section: null },
  { to: "/students",            icon: Users,           key: "students",           section: "management" },
  { to: "/requests",            icon: UserPlus,        key: "requests",           section: null },
  { to: "/teachers",            icon: GraduationCap,   key: "teachers",           section: null },
  { to: "/schedule",            icon: CalendarDays,    key: "schedule",           section: null },
  { to: "/subjectandclassroom", icon: BookOpen,        key: "subjectsClassrooms", section: null },
  { to: "/createmodule",        icon: BookOpen,        key: "sessions",           section: null },
  { to: "/course",              icon: Book,            key: "courses",            section: null },
  { to: "/settings",            icon: Settings,        key: "settings",           section: "settingsSection" },
];

const row = "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors";
const on = "bg-gold font-bold text-green-deep";
const off = "text-ivory/70 hover:bg-gold/10 hover:text-gold";

export default function Sidebar() {
  const { user, school, logout } = useAuth();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1280);
  const [open, setOpen] = useState(false);
  useAccent(school?.primaryColor);

  const name = school?.schoolName || user?.fullName || t("sidebar.schoolFallback");
  const initials = name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hide = collapsed ? "md:hidden" : "";
  const center = collapsed ? "md:justify-center" : "";
  const close = () => setOpen(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("sidebar.openMenuAria")}
        className="fixed end-4 top-3 z-60 grid size-10 place-items-center rounded-sm bg-green-deep text-gold ring-1 ring-gold/40 md:hidden"
      >
        <Menu className="size-5" />
      </button>
      {open && <div onClick={close} className="fixed inset-0 z-70 bg-green-deep/60 backdrop-blur-sm md:hidden" />}

      <aside
        dir={dir}
        className={`sticky top-0 z-80 flex h-screen w-56 shrink-0 flex-col overflow-hidden bg-green-deep text-ivory transition-[transform,width] duration-300 max-md:fixed max-md:inset-y-0 max-md:start-0 max-md:h-auto ${collapsed ? "md:w-19" : ""} ${open ? "" : "max-md:-translate-x-full max-md:rtl:translate-x-full"}`}
      >
        <div className="nm-pattern pointer-events-none absolute inset-0 opacity-[0.08]" />

        {/* Brand */}
        <div className="relative flex items-center gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-sm bg-ivory ring-1 ring-gold/40">
            {school?.logoUrl
              ? <img src={school.logoUrl} alt={t("sidebar.logoAlt")} className="size-9 object-contain" />
              : <School className="size-5 text-green-deep" />}
          </span>
          <div className={`min-w-0 flex-1 ${hide}`}>
            <p className="truncate font-display text-sm text-ivory">{name}</p>
            <p className="flex items-center gap-1.5 truncate text-xs text-gold">
              <Diamond className="size-1.5 shrink-0" />{t("sidebar.controlPanelSubtitle")}
            </p>
          </div>
          <button onClick={close} aria-label={t("sidebar.closeMenuAria")} className="text-ivory/60 hover:text-gold md:hidden">
            <X className="size-5" />
          </button>
        </div>
        <div className="nm-rule relative" />

        {/* Navigation */}
        <nav className="relative flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 pt-3">
          {NAV.map(({ to, icon: Icon, key, section }) => {
            const label = t(`sidebar.nav.${key}`);
            return (
              <div key={to} className={section ? "pt-4" : ""}>
                {section && (
                  <p className={`flex items-center gap-2 px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gold/70 ${hide}`}>
                    <Diamond className="size-1.5" />{t(`sidebar.sections.${section}`)}
                  </p>
                )}
                <NavLink
                  to={to}
                  onClick={close}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) => `${row} ${isActive ? on : off} ${center}`}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  <span className={`truncate ${hide}`}>{label}</span>
                </NavLink>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="relative space-y-1 p-3">
          <div className="nm-rule mb-2" />
          <button onClick={() => setCollapsed((c) => !c)} className={`${row} ${off} ${center} max-md:hidden`}>
            <ChevronsRight className={`size-4 shrink-0 ${collapsed === (dir === "rtl") ? "rotate-180" : ""}`} />
            <span className={hide}>{t("sidebar.collapseMenu")}</span>
          </button>
          <button onClick={() => { logout?.(); navigate("/login"); }} className={`${row} ${off} ${center}`}>
            <LogOut className="size-4 shrink-0" />
            <span className={hide}>{t("sidebar.logout")}</span>
          </button>
          <div className={`flex items-center gap-3 px-2 pt-2 ${center}`}>
            <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-gold/15 text-xs font-bold text-gold ring-1 ring-gold/30">{initials}</span>
            <div className={`min-w-0 flex-1 ${hide}`}>
              <p className="truncate text-xs font-bold text-ivory">{user?.fullName || name}</p>
              <p className="truncate text-[10px] text-ivory/50">{t("sidebar.schoolAdminBadge")}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}