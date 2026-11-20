export const WEEK_DAYS = {
  MONDAY: "monday", TUESDAY: "tuesday", WEDNESDAY: "wednesday",
  THURSDAY: "thursday", FRIDAY: "friday", SATURDAY: "saturday", SUNDAY: "sunday",
};
// Week starts on Saturday
export const WEEK_ORDER = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

// Left/right accent stripe of a row (border-s = start side, so it flips in RTL by itself)
export const ACCENT = {
  gold: "border-s-gold",
  green: "border-s-green-deep",
  accent: "border-s-accent",
  red: "border-s-algeria-red",
};
const CYCLE = ["gold", "green", "accent", "red"];
export const cycle = (i) => CYCLE[i % CYCLE.length];
export const STATUS_ACCENT = { PAID: "green", PENDING: "gold", OVERDUE: "red" };

export const fmtTime = (t) => (t ? String(t).slice(0, 5) : "—");

// {placeholder} interpolation
export const fill = (str, vars) =>
  typeof str !== "string" || !vars
    ? str
    : Object.keys(vars).reduce((acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]), str);

export const moduleIdOf = (enr) => enr.moduleId ?? enr.module?.id;
export const schoolIdOf = (enr) => enr.schoolId ?? enr.school?.id;

export const moduleTitle = (mod, t, id) =>
  mod?.subjectName || mod?.name || fill(t("studentDashboard.sessions.moduleFallback"), { id });

export const weeklyCount = (enrollments, moduleMap) =>
  enrollments.reduce((n, e) => n + (moduleMap[moduleIdOf(e)]?.schedules?.length || 0), 0);

export const sumUnpaid = (items) =>
  items.filter((i) => i.status !== "PAID").reduce((s, i) => s + (Number(i.amount) || 0), 0);
