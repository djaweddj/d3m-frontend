import Reveal from "../home/Reveal";

// tone: "default" (gold) | "error" (algeria red)
export default function EmptyState({ icon: Icon, title, subtitle, tone = "default" }) {
  const error = tone === "error";
  return (
    <Reveal>
      <div
        role={error ? "alert" : undefined}
        className={`border border-dashed bg-white px-6 py-20 text-center ${error ? "border-algeria-red/40" : "border-gold/40"}`}
      >
        <span
          className={`mx-auto mb-6 grid size-16 place-items-center rounded-sm ${error ? "bg-algeria-red text-ivory" : "bg-green-deep text-gold"}`}
        >
          <Icon className="size-8" strokeWidth={1.5} />
        </span>
        <p className="font-display text-xl text-green-deep">{title}</p>
        {subtitle && <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-green-deep/60">{subtitle}</p>}
      </div>
    </Reveal>
  );
}