import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const SchoolContext = createContext(null);

const DEFAULT_SCHOOL = {
  id: null,
  schoolName: "مدرسة الدعم",
  primaryColor: "#185FA5",
  academicYear: "2025–2026",
  wilaya: "",
  commune: "",
  phone: "",
  email: "",
  ownerName: "",
  yearlyPrice: 0,
  subscriptionStatus: "ACTIVE",
  subscriptionExpiresAt: null,
};

export function SchoolProvider({ children }) {
  const [school, setSchool] = useState(DEFAULT_SCHOOL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get schoolId from the logged-in user stored in localStorage
    const userData = localStorage.getItem("user");
    if (!userData) { setLoading(false); return; }

    const user = JSON.parse(userData);

    // Fetch the school admin's profile to get their schoolId
    api.get("/api/school-admin/profile")
      .then((res) => {
        const schoolId = res.data.schoolId;
        return api.get(`/api/schools/${schoolId}`);
      })
      .then((res) => {
        const s = res.data;
        setSchool((prev) => ({
          ...prev,
          id:                   s.id,
          schoolName:           s.schoolName,
          wilaya:               s.wilaya,
          commune:              s.commune,
          phone:                s.phone,
          email:                s.email,
          ownerName:            s.ownerName,
          yearlyPrice:          s.yearlyPrice,
          subscriptionStatus:   s.subscriptionStatus,
          subscriptionExpiresAt: s.subscriptionExpiresAt,
        }));
      })
      .catch((err) => console.error("SchoolContext fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--school-primary", school.primaryColor);
    document.documentElement.style.setProperty("--school-primary-dark", darken(school.primaryColor, 15));
    document.documentElement.style.setProperty("--school-primary-light", lighten(school.primaryColor, 92));
  }, [school.primaryColor]);

  const updateSchool = (patch) => setSchool((s) => ({ ...s, ...patch }));

  return (
    <SchoolContext.Provider value={{ school, updateSchool, loading }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used inside SchoolProvider");
  return ctx;
}

// ── tiny color helpers ─────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}
function toHex(r, g, b) {
  return "#" + [r, g, b].map((v) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")
  ).join("");
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