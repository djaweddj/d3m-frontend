export const getDateLocale = (locale) =>
  locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US";

export const hhmm = (time) => time?.slice(0, 5) ?? "";

// Next upcoming session, or the last one if all are in the past
export function nextUpcomingSession(sessions) {
  if (!sessions?.length) return null;
  const now = new Date();
  const dated = sessions
    .map((s) => ({ ...s, _dt: s.date ? new Date(`${s.date}T${s.startTime || "00:00:00"}`) : null }))
    .filter((s) => s._dt)
    .sort((a, b) => a._dt - b._dt);
  return dated.find((s) => s._dt >= now) || dated[dated.length - 1] || sessions[0];
}