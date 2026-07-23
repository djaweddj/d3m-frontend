import { useState } from "react";
import { Bell, Settings, Globe, Check } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useLocation } from "react-router";
import { useLanguage } from "../context/LanguageContext";

// route -> topbar.titles.<key> in translations.js
const ROUTE_TITLE_KEY = {
  "/dashboard": "dashboard",
  "/students": "students",
  "/teachers": "teachers",
  "/schedule": "schedule",
  "/settings": "settings",
};

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();
  const { t, dir, language, setLanguage, languageLabels, availableLanguages } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  const titleKey = ROUTE_TITLE_KEY[location.pathname] || "default";
  const title = t(`topbar.titles.${titleKey}`);

  const school = user?.school;
  const primaryColor = school?.primaryColor ?? "#2563EB";

  return (
    <header
      className="flex items-center justify-between px-5 border-b border-gray-100 bg-white flex-shrink-0"
      style={{ height: 56 }}
      dir={dir}
    >
      <h1
        className="text-base font-bold text-slate-800"
        style={{ fontFamily: "'Tajawal', sans-serif" }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-2" style={{ position: "relative" }}>
        {school && (
          <span
            className="text-[11px] font-semibold px-3 py-1 rounded-full border"
            style={{
              backgroundColor: primaryColor + "1A", // 10% opacity
              color: primaryColor,
              borderColor: primaryColor + "40",     // 25% opacity
            }}
          >
            {t("topbar.academicYear", { year: school.academicYear })}
          </span>
        )}

        {/* ── Language switcher ── */}
        <button
          onClick={() => setLangOpen((o) => !o)}
          aria-label={t("topbar.language")}
          className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
        >
          <Globe className="w-4 h-4" />
        </button>

        {langOpen && (
          <>
            {/* click-away layer */}
            <div
              onClick={() => setLangOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 40 }}
            />
            <div
              dir={dir}
              style={{
                position: "absolute",
                top: 40,
                [dir === "rtl" ? "right" : "left"]: 0,
                zIndex: 50,
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                minWidth: 140,
                overflow: "hidden",
              }}
            >
              {availableLanguages.map((lng) => (
                <button
                  key={lng}
                  onClick={() => { setLanguage(lng); setLangOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "8px 12px", fontSize: 13,
                    background: lng === language ? "#F1F5F9" : "#fff",
                    color: "#1E293B", border: "none", cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <span>{languageLabels[lng]}</span>
                  {lng === language && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </>
        )}

        <button className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
          <Bell className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}