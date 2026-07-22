import { createContext, useContext, useEffect, useState } from "react";
import { translations, LOCALE_MAP, DIR_MAP, LANGUAGE_LABELS } from "../i18n/translations";

const LanguageContext = createContext(null);

function getNested(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function LanguageProvider({ children, defaultLanguage = "ar" }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === "undefined") return defaultLanguage;
    return localStorage.getItem("appLanguage") || defaultLanguage;
  });

  useEffect(() => {
    localStorage.setItem("appLanguage", language);
    // keep <html> in sync so native form controls / scrollbars flip correctly too
    document.documentElement.dir = DIR_MAP[language];
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang) => {
    if (translations[lang]) setLanguageState(lang);
  };

  // t("dashboard.week.noSessionsDay", { day: "Monday" }) -> "No sessions on Monday"
  const t = (path, vars) => {
    let str = getNested(translations[language], path);
    if (str === undefined) str = getNested(translations.ar, path); // safe fallback
    if (str === undefined) return path;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  };

  const value = {
    language,
    setLanguage,
    t,
    dir: DIR_MAP[language],
    locale: LOCALE_MAP[language],
    languageLabels: LANGUAGE_LABELS,
    availableLanguages: Object.keys(translations),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a <LanguageProvider>");
  return ctx;
}