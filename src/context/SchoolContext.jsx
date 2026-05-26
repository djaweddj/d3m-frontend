import { createContext, useContext, useState, useEffect } from "react";

const SchoolContext = createContext(null);

const DEFAULT_SCHOOL = {
  name: "مدرسة الأمل",
  primaryColor: "#2563EB",
  logoUrl: null,
  academicYear: "2025–2026",
};

export function SchoolProvider({ children }) {
  const [school, setSchool] = useState(() => {
    try {
      const saved = localStorage.getItem("schoolSettings");
      return saved ? { ...DEFAULT_SCHOOL, ...JSON.parse(saved) } : DEFAULT_SCHOOL;
    } catch {
      return DEFAULT_SCHOOL;
    }
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--school-primary", school.primaryColor);
    document.documentElement.style.setProperty(
      "--school-primary-dark",
      darken(school.primaryColor, 15)
    );
    document.documentElement.style.setProperty(
      "--school-primary-light",
      lighten(school.primaryColor, 92)
    );
    localStorage.setItem("schoolSettings", JSON.stringify(school));
  }, [school]);

  const updateSchool = (patch) => setSchool((s) => ({ ...s, ...patch }));

  return (
    <SchoolContext.Provider value={{ school, updateSchool }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used inside SchoolProvider");
  return ctx;
}

// ── tiny color helpers ──────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}
function toHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
function darken(hex, pct) {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - pct / 100;
  return toHex(r * f, g * f, b * f);
}
function lighten(hex, pct) {
  const [r, g, b] = hexToRgb(hex);
  const f = pct / 100;
  return toHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
}