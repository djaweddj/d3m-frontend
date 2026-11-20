import { Diamond } from "../home/Marks";

// Dashboard page header: title + subtitle on one side, controls (children) on the other
export default function PageToolbar({ title, subtitle, children }) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-gold/25 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl text-green-deep">
          <Diamond className="size-3 shrink-0 text-gold" />
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-green-deep/60">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </header>
  );
}