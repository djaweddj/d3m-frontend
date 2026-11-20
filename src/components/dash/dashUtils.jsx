export const todayYM = () => {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
};

// "2025-03" -> {y:2025, m:3}
export const parseYM = (str) => {
  const [y, m] = str.split("-").map(Number);
  return { y, m };
};

export const ymToStr = ({ y, m }) => `${y}-${String(m).padStart(2, "0")}`;

export const shiftYM = ({ y, m }, delta) => {
  const total = y * 12 + (m - 1) + delta;
  return { y: Math.floor(total / 12), m: (total % 12) + 1 };
};

// Formats numbers using the active locale instead of a hardcoded "en-US"
export const fmtMoney = (n, locale, currencySuffix) =>
  (n ?? 0).toLocaleString(locale) + currencySuffix;

export const fmtMoneyShort = (n, locale) => {
  const v = n ?? 0;
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(0) + "K";
  return v.toLocaleString(locale);
};