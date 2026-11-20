import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { inputCls, InputIcon } from "../SchoolRegister/FormField"; // ← adjust to where Field / inputCls / InputIcon live

// ─── Feedback ─────────────────────────────────────────────────────────────────
export function Spinner({ className = "size-4" }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />;
}

export function CenterState({ tone = "text-green-deep/60", children }) {
  return <div className={`grid min-h-[60vh] place-items-center text-center text-sm ${tone}`}><div>{children}</div></div>;
}

export function EmptyBlock({ children }) {
  return <p className="py-10 text-center text-sm text-green-deep/60">{children}</p>;
}

const NOTICE = {
  error: "border-algeria-red/40 bg-algeria-red/10 text-algeria-red",
  gold:  "border-gold/60 bg-gold/15 text-green-deep",
  green: "border-green-deep/30 bg-green-deep/10 text-green-deep",
};

export function Notice({ variant = "error", icon: Icon, children }) {
  return (
    <div role={variant === "error" ? "alert" : undefined}
      className={`flex items-start gap-2 rounded-sm border px-4 py-3 text-sm ${NOTICE[variant]}`}>
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" />}
      <div>{children}</div>
    </div>
  );
}

export function InlineError({ children }) {
  return (
    <p role="alert" className="flex items-center gap-1.5 px-1 text-xs text-algeria-red">
      <AlertCircle className="size-3.5 shrink-0" />
      {children}
    </p>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="flex flex-col gap-4 rounded-sm border border-t-2 border-gold/40 border-t-gold bg-white p-4 sm:p-6">
      <header className="flex items-center gap-3">
        {Icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-green-deep text-gold">
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-green-deep">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-green-deep/60">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

export function FormGrid({ children }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div role="tablist" className="inline-flex gap-1 rounded-sm bg-gold/15 p-1">
      {tabs.map(tab => {
        const isActive = tab.value === active;
        return (
          <button key={tab.value} type="button" role="tab" aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`h-10 rounded-sm px-5 text-sm font-bold transition-colors ${
              isActive ? "bg-green-deep text-ivory" : "text-green-deep/70 hover:text-green-deep"
            }`}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Inputs (built on the shared inputCls) ────────────────────────────────────
export function TextInput({ id, onChange, ...p }) {
  return <input id={id} className={inputCls} onChange={e => onChange(e.target.value)} {...p} />;
}

export function SelectInput({ id, value, onChange, options, placeholder }) {
  const { t } = useLanguage();
  return (
    <InputIcon icon={ChevronDown}>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className={`${inputCls} appearance-none pe-10`}>
        <option value="">{placeholder}</option>
        {options.length === 0 && <option value="" disabled>{t("createModule.noData")}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </InputIcon>
  );
}

export function PricingOption({ selected, onClick, icon: Icon, title, desc, example }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      className={`relative flex min-w-0 flex-col gap-2 rounded-sm border-2 p-4 text-start transition-colors ${
        selected ? "border-gold bg-gold/15" : "border-gold/30 bg-white hover:border-gold"
      }`}>
      {selected && (
        <span className="absolute end-3 top-3 grid size-5 place-items-center rounded-full bg-green-deep text-gold">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
      <span className="flex items-center gap-2 text-sm font-bold text-green-deep">
        <Icon className={`size-4 ${selected ? "text-gold-deep" : "text-green-deep/60"}`} />
        {title}
      </span>
      <span className="text-xs leading-relaxed text-green-deep/70">{desc}</span>
      <span className="rounded-sm border border-dashed border-gold/60 px-2.5 py-1.5 text-[11px] text-green-deep/70">
        {example}
      </span>
    </button>
  );
}