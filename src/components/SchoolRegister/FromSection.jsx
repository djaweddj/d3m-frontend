// One block of a long form: green icon tile + title + hint, then the fields.
export default function FormSection({ icon: Icon, label, sub, divider = false, children }) {
  return (
    <section className={divider ? "border-t border-gold/25" : ""}>
      <div className="flex items-center gap-4 px-5 pt-8 sm:px-8">
        <span className="grid size-11 shrink-0 place-items-center rounded-sm bg-green-deep text-gold">
          <Icon className="size-5" strokeWidth={1.5} />
        </span>
        <div>
          <h2 className="font-display text-lg text-green-deep">{label}</h2>
          <p className="mt-0.5 text-xs text-green-deep/60">{sub}</p>
        </div>
      </div>
      <div className="space-y-5 px-5 pb-8 pt-6 sm:px-8">{children}</div>
    </section>
  );
}