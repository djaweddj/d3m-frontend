import { Diamond } from "../home/Marks";

export function InfoGroup({ title, children }) {
  return (
    <section>
      <h4 className="mb-3 flex items-center gap-2 text-xs font-bold text-gold-deep">
        <Diamond className="size-2" />{title}
      </h4>
      <dl className="space-y-2">{children}</dl>
    </section>
  );
}

export function InfoRow({ icon: Icon, label, value, ltr = false }) {
  if (!value) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border border-gold/25 bg-white px-4 py-2.5 text-sm">
      <dt className="flex items-center gap-2 text-green-deep/60">
        <Icon className="size-4 text-gold-deep" />{label}
      </dt>
      <dd dir={ltr ? "ltr" : undefined} className="font-semibold text-green-deep">{value}</dd>
    </div>
  );
}