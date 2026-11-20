import { useState } from "react";
import { Bell, Settings, Globe, Check } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useLocation } from "react-router";
import { Diamond } from "../components/home/Marks";
import { useLanguage } from "../context/LanguageContext";

const ROUTE_TITLE_KEY = {
  "/dashboard": "dashboard",
  "/students": "students",
  "/teachers": "teachers",
  "/schedule": "schedule",
  "/settings": "settings",
};

const icon = "grid size-9 place-items-center rounded-sm text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink";

export default function Topbar() {
  const { user, school: ctxSchool } = useAuth();
  const school = ctxSchool ?? user?.school;
  const { pathname } = useLocation();
  const { t, dir, language, setLanguage, languageLabels, availableLanguages } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header dir={dir} className="flex h-14 shrink-0 items-center justify-between bg-white px-5 max-md:pe-16">
      <h1 className="flex items-center gap-2 font-display text-base text-ink">
  <Diamond className="size-2 text-gold" />
  {t(`topbar.titles.${ROUTE_TITLE_KEY[pathname] || "default"}`)}
</h1>

      <div className="relative flex items-center gap-1">
        {school && (
          <span className="me-2 rounded-sm bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
            {t("topbar.academicYear", { year: school.academicYear })}
          </span>
        )}

        <button onClick={() => setLangOpen((o) => !o)} aria-label={t("topbar.language")} className={icon}>
          <Globe className="size-4" />
        </button>
        {langOpen && (
          <>
            <div onClick={() => setLangOpen(false)} className="fixed inset-0 z-40" />
            <ul className="absolute end-0 top-11 z-50 min-w-36 overflow-hidden rounded-sm bg-white py-1 shadow-xl">
              {availableLanguages.map((lng) => (
                <li key={lng}>
                  <button
                    onClick={() => { setLanguage(lng); setLangOpen(false); }}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-ink hover:bg-canvas"
                  >
                    {languageLabels[lng]}
                    {lng === language && <Check className="size-3.5 text-accent" />}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <button className={icon}><Bell className="size-4" /></button>
        <button className={icon}><Settings className="size-4" /></button>
      </div>
    </header>
  );
}