export function formatDA(amount, currency) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 2 }).format(amount) + " " + currency;
}

export function formatPeriod(period, locale) {
  if (!period) return "—";
  try {
    const [year, month] = String(period).split("-");
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
  } catch {
    return String(period);
  }
}

// A payout covers a date range, not a calendar month
export function formatRange(start, end, locale) {
  if (!start || !end) return "—";
  try {
    const s = new Date(start).toLocaleDateString(locale, { day: "numeric", month: "short" });
    const e = new Date(end).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
    return `${s} – ${e}`;
  } catch {
    return `${start} – ${end}`;
  }
}

export function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftPeriod(period, delta) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}
