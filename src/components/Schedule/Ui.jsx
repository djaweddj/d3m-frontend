import { X, ArrowLeft } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export function Spinner({ size = "md", light = false }) {
  const s = { sm: "size-3.5", md: "size-5", lg: "size-8" }[size];
  return (
    <span className={`inline-block shrink-0 animate-spin rounded-full border-2 border-t-transparent ${s} ${light ? "border-white" : "border-brand"}`} />
  );
}

const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand/90 disabled:bg-stone-300",
  gold:    "bg-gold text-ink hover:bg-gold/90 disabled:bg-stone-300",
  soft:    "bg-brand/10 text-brand hover:bg-brand/15",
  ghost:   "bg-stone-100 text-stone-600 hover:bg-stone-200",
  danger:  "bg-danger text-white hover:bg-danger/90 disabled:bg-stone-300",
};

export function Btn({ variant = "primary", icon: Icon, loading, className = "", children, ...rest }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    >
      {loading ? <Spinner size="sm" light={variant !== "soft" && variant !== "ghost"} /> : Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

export function IconBtn({ icon: Icon, tone = "text-stone-500", className = "", ...rest }) {
  return (
    <button
      {...rest}
      className={`grid size-8 shrink-0 place-items-center rounded-lg bg-white/80 shadow-sm transition hover:bg-white ${tone} ${className}`}
    >
      <Icon size={13} />
    </button>
  );
}

export function Badge({ className = "", children }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}>{children}</span>;
}

export function ErrorBox({ msg }) {
  return msg ? <div className="rounded-xl bg-danger/10 px-3.5 py-2 text-xs text-danger">{msg}</div> : null;
}

export function Empty({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center text-stone-400">
      <Icon size={30} className="mb-1 text-gold/60" />
      <p className="text-sm text-stone-500">{title}</p>
      {hint && <p className="text-xs">{hint}</p>}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-stone-500">{label}</span>
      {children}
    </label>
  );
}

export function Input({ className = "", ...rest }) {
  return (
    <input
      {...rest}
      className={`w-full rounded-xl bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-transparent transition focus:ring-brand/40 ${className}`}
    />
  );
}

export function Avatar({ name, className = "bg-brand/10 text-brand" }) {
  const initials = name?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  return <div className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold ${className}`}>{initials}</div>;
}

export function Tabs({ value, onChange, options }) {
  return (
    <div className="flex rounded-xl bg-white p-1 shadow-sm">
      {options.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
            value === key ? "bg-brand text-white" : "text-stone-500 hover:text-brand"
          }`}
        >
          <Icon size={12} /> {label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ onClose, width = "sm:max-w-md", children }) {
  const { dir } = useLanguage();
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div dir={dir} className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${width}`}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, subtitle, onClose, onBack, className = "bg-paper text-ink", children }) {
  return (
    <div className={`shrink-0 px-5 py-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && <IconBtn icon={ArrowLeft} onClick={onBack} />}
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs opacity-75">{subtitle}</p>}
          </div>
        </div>
        <IconBtn icon={X} onClick={onClose} />
      </div>
      {children}
    </div>
  );
}

export const ModalBody = ({ children }) => <div className="flex flex-col gap-4 overflow-y-auto p-5">{children}</div>;
export const ModalFooter = ({ children }) => <div className="flex shrink-0 gap-2 bg-paper px-5 py-4">{children}</div>;