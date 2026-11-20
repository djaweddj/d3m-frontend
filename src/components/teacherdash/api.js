// All teacher endpoints in one place. Pages never call fetch directly.
// Works whether VITE_API_URL is "http://host:8081" or "http://host:8081/api".
const BASE = (import.meta.env?.VITE_API_URL || "http://localhost:8081").replace(/\/+$/, "");
const API = BASE.endsWith("/api") ? BASE : `${BASE}/api`;

async function request(path, { method = "GET", body, errorMsg, allow404 = false } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (allow404 && res.status === 404) return null;
  if (!res.ok) throw new Error(errorMsg);
  return res.json();
}

export const teacherApi = {
  profile: () => request("/teachers/profile", { errorMsg: "فشل تحميل الملف الشخصي" }),
  updateProfile: (data) =>
    request("/teachers/profile", { method: "PUT", body: data, errorMsg: "فشل حفظ التعديلات" }),

  modules: () => request("/modules/mine", { errorMsg: "فشل تحميل الأقسام" }),
  studentsByModule: (id) =>
    request(`/students/by-module/${id}`, { errorMsg: "فشل تحميل قائمة التلاميذ" }),

  sessionsByDate: (date) =>
    request(`/sessions/my-sessions?date=${date}`, { errorMsg: "فشل تحميل حصص اليوم" }),
  attendanceSheet: (id) =>
    request(`/sessions/${id}/my-attendance-sheet`, { errorMsg: "فشل تحميل ورقة الحضور" }),
  markAttendance: (id, entries) =>
    request(`/sessions/${id}/teacher-attendance`, { method: "POST", body: entries, errorMsg: "فشل تسجيل الحضور" }),

  payouts: () => request("/payouts/mine", { errorMsg: "فشل تحميل المستحقات" }),
  // 404 = nothing computed for that month yet → null, not an error
  payoutForMonth: (period) =>
    request(`/payouts/mine/month?period=${period}`, { errorMsg: "فشل تحميل مستحقات هذا الشهر", allow404: true }),
  coursePayouts: () => request("/courses/payouts/mine", { errorMsg: "فشل تحميل مستحقات الدورات" }),
};