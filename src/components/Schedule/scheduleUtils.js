import { useMemo } from "react";
import api from "../../api";

export const scheduleApi = {
  getModules:          ()                         => api.get("api/modules"),
  createSession:       (data)                     => api.post("api/sessions", data),
  updateSchedule:      (moduleId, day, data)      => api.put(`api/modules/${moduleId}/schedules/${day}`, data),
  archiveModule:       (moduleId)                 => api.patch(`api/modules/${moduleId}/archive`),
  getSessionsByDate:   (schoolId, date)           => api.get("api/sessions/by-date", { params: { schoolId, date } }),
  getWeek:             (schoolId, date)           => api.get("api/sessions/week", { params: { schoolId, date } }),
  getAttendanceSheet:  (sessionId)                => api.get(`api/sessions/${sessionId}/attendance-sheet`),
  submitAttendance:    (sessionId, entries, user) => api.post(`api/sessions/${sessionId}/attendance`, entries, user),
  getSiblingModules:   (moduleId)                 => api.get(`api/sessions/module/${moduleId}/siblings`),
  getStudentsByModule: (moduleId)                 => api.get(`api/students/by-module/${moduleId}`),
  payInvoice:          (invoiceId)                => api.post(`api/invoices/${invoiceId}/pay`),
};

export const IDX_TO_DAY = ["FRIDAY", "SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"];
export const DAY_TO_IDX = Object.fromEntries(IDX_TO_DAY.map((d, i) => [d, i]));

export const fmtTime = (t) => (t ? String(t).slice(0, 5) : "—");
export const toLocalDate = (d) => d.toLocaleDateString("fr-CA");
export const fmtDA = (n) =>
  n == null ? null : new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(n) + " DA";
export const errMsg = (err, fallback) => err?.response?.data?.message || fallback;

// Static class strings so Tailwind can see them. Green/gold family, one tone per module.
const TONES = [
  { soft: "bg-emerald-50 text-emerald-900", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  { soft: "bg-amber-50 text-amber-900",     dot: "bg-amber-500",   bar: "bg-amber-500" },
  { soft: "bg-teal-50 text-teal-900",       dot: "bg-teal-500",    bar: "bg-teal-500" },
  { soft: "bg-yellow-50 text-yellow-900",   dot: "bg-yellow-500",  bar: "bg-yellow-500" },
  { soft: "bg-green-50 text-green-900",     dot: "bg-green-600",   bar: "bg-green-600" },
  { soft: "bg-orange-50 text-orange-900",   dot: "bg-orange-400",  bar: "bg-orange-400" },
  { soft: "bg-lime-50 text-lime-900",       dot: "bg-lime-600",    bar: "bg-lime-600" },
  { soft: "bg-stone-100 text-stone-800",    dot: "bg-stone-500",   bar: "bg-stone-500" },
];
export const toneFor = (id) => TONES[(Number(id) || 0) % TONES.length];

export const INVOICE_TONE = {
  PAID:      "bg-brand/10 text-brand",
  PENDING:   "bg-gold/20 text-amber-900",
  OVERDUE:   "bg-danger/10 text-danger",
  CANCELLED: "bg-stone-100 text-stone-500",
};

export const pricingBadge = (t, model) =>
  ({
    MONTHLY_FLAT: { label: t("schedule.pricing.monthly"),    cls: "bg-brand/10 text-brand" },
    PER_SESSION:  { label: t("schedule.pricing.perSession"), cls: "bg-gold/20 text-amber-900" },
  })[model];

// Flattens modules -> one slot per weekly schedule entry (shared by desktop + mobile grid)
export const flattenSlots = (modules) =>
  modules.flatMap((m) =>
    (m.schedules ?? []).map((s) => ({
      slotKey: `${m.id}_${s.day}_${s.startTime}`,
      moduleId: m.id,
      moduleName: m.name,
      subjectName: m.subjectName,
      teacherName: m.teacherName,
      startTime: s.startTime,
      endTime: s.endTime,
      day: s.day,
      pricingModel: m.pricingModel,
    }))
  );

export const useSlotsFromModules = (modules) => useMemo(() => flattenSlots(modules), [modules]);