import { Diamond, ColumnMark } from "./Marks";
import AnimatedText from "./AnimatedText";

export default function CtaBand({ tag, title, subtitle, children }) {
  return (
    <section className="relative overflow-hidden bg-green-deep px-6 py-20 text-center sm:py-28">
      <div className="nm-pattern pointer-events-none absolute inset-0 opacity-[0.08]" />
      <ColumnMark className="pointer-events-none absolute -bottom-6 start-6 h-56 text-gold/10" />
      <div className="relative">
        <span className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gold">
          <Diamond className="size-2" />{tag}
        </span>
        <h2 className="mb-5 font-display text-3xl text-ivory sm:text-5xl"><AnimatedText text={title} /></h2>
        <p className="mx-auto mb-10 max-w-xl text-ivory/70">{subtitle}</p>
        {children}
      </div>
    </section>
  );
}