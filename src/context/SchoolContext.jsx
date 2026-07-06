import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api";

// ── API ───────────────────────────────────────────────────
const schoolInfoApi = {
  getMine: () => api.get("api/schools/one"),
};

const SchoolContext = createContext(undefined);

/**
 * Wrap the SCHOOL_ADMIN dashboard tree (DashboardLayout) with this provider.
 * Fetches SchoolResponseDto ONCE and exposes it + a refetch() to every child page
 * (Students, Teachers, Schedule, CreateModule, Settings, Requests, Dashboard, ...).
 *
 * Usage in any child page:
 *   const { school, loading, error, refetchSchool } = useSchool();
 *   school?.schoolName, school?.id, school?.logoUrl, school?.subscriptionStatus, etc.
 */
export function SchoolProvider({ children }) {
  const [school, setSchool]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await schoolInfoApi.getMine();
      setSchool(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "تعذر تحميل بيانات المؤسسة");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SchoolContext.Provider value={{ school, loading, error, refetchSchool: load }}>
      {children}
    </SchoolContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (ctx === undefined) {
    throw new Error("useSchool must be used within a <SchoolProvider>");
  }
  return ctx;
}