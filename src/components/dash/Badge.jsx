const T = {
  neutral: "bg-ink/5 text-ink/70",
  accent: "bg-accent/10 text-accent",
  ok: "bg-green-100 text-green-700",
  warn: "bg-amber-100 text-amber-700",
  bad: "bg-algeria-red/10 text-algeria-red",
};

export default function Badge({ tone = "neutral", children }) {
  return <span className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-bold ${T[tone]}`}>{children}</span>;
}