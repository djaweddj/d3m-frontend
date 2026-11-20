export const LOCALE = "ar-DZ";
const NUM_LOCALE = "en-US"; // Latin digits for numbers, as before

const MONTHS = ["جانفي","فيفري","مارس","أفريل","ماي","جوان","جويلية","أوت","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export const DAY_ORDER = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
export const DAY_LABELS = {
  SUNDAY: "الأحد", MONDAY: "الإثنين", TUESDAY: "الثلاثاء", WEDNESDAY: "الأربعاء",
  THURSDAY: "الخميس", FRIDAY: "الجمعة", SATURDAY: "السبت",
};

// payout status → Badge tone
export const PAYOUT_STATUS = {
  PENDING: { label: "قيد الانتظار", tone: "warn" },
  PAID: { label: "مدفوع", tone: "ok" },
};

export const NUM = NUM_LOCALE;
export const CURRENCY = " دج";

export function formatPeriod(period) {
  if (!period) return "—";
  const [y, m] = period.split("-");
  return `${MONTHS[parseInt(m, 10) - 1] ?? m} ${y}`;
}

export const formatTime = (t) => (t ? t.slice(0, 5) : "—");

export const formatMoney = (v) =>
  v == null ? "—" : `${Number(v).toLocaleString(NUM_LOCALE)}${CURRENCY}`;

export const formatDate = (dt) =>
  dt ? new Date(dt).toLocaleDateString(LOCALE, { year: "numeric", month: "long", day: "numeric" }) : null;

// Local date (YYYY-MM-DD). toISOString() is UTC and shows "yesterday" just after midnight.
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
