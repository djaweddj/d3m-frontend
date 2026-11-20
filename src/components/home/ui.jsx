import { useEffect } from "react";
import { motion } from "framer-motion";
import { X, AlertCircle, Inbox } from "lucide-react";
import { Diamond, ColumnMark } from "./Marks";

// ───────────────────────────────────────────────────────────────
//  Numeria admin UI kit — no borders / rules.
//  Separation is done with tone (ivory / white / sand) and soft shadow.
// ───────────────────────────────────────────────────────────────
export const CARD_SHADOW = "shadow-[0_18px_40px_-28px_rgba(10,40,25,.45)]";

export const fieldCls =
  "h-11 w-full rounded-sm bg-sand/60 px-4 text-sm text-green-deep outline-none transition placeholder:text-green-deep/40 focus:bg-white focus:ring-2 focus:ring-gold/50";

export function Spinner({ className = "size-4" }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />;
}

export function TextInput({ value, onChange, ...rest }) {
  return <input className={fieldCls} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

export function TextArea({ value, onChange, rows = 3, ...rest }) {
  return <textarea rows={rows} className={`${fieldCls} h-auto resize-none py-3 leading-7`} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

export function SelectInput({ value, onChange, options, placeholder, className = "" }) {
  return (
    <select className={`${fieldCls} cursor-pointer ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function ErrorNote({ msg }) {
  if (!msg) return null;
  return (
    <p role="alert" className="flex items-center gap-2 rounded-sm bg-algeria-red/10 px-4 py-3 text-xs text-algeria-red">
      <AlertCircle className="size-4 shrink-0" /> {msg}
    </p>
  );
}

const PILL = {
  sand:  "bg-sand text-green-deep/70",
  green: "bg-green-deep/10 text-green-deep",
  gold:  "bg-gold/20 text-gold-deep",
  red:   "bg-algeria-red/10 text-algeria-red",
  dark:  "bg-green-deep text-gold",
};
export function Pill({ tone = "sand", children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold ${PILL[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Avatar({ name, className = "size-10" }) {
  const initials = name?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  return (
    <span className={`grid shrink-0 place-items-center rounded-sm bg-green-deep font-display text-sm text-gold ${className}`}>
      {initials}
    </span>
  );
}

export function IconTile({ icon: Icon, tone = "dark", className = "size-11" }) {
  const tones = {
    dark: "bg-green-deep text-gold",
    gold: "bg-gold/20 text-gold-deep",
    sand: "bg-sand text-green-deep",
    red:  "bg-algeria-red/10 text-algeria-red",
  };
  return (
    <span className={`grid shrink-0 place-items-center rounded-sm ${tones[tone]} ${className}`}>
      <Icon className="size-5" strokeWidth={1.5} />
    </span>
  );
}

export function ProgressBar({ pct }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-sand">
      <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-algeria-red" : "bg-gold"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white px-6 py-16 text-center">
      <span className="mb-5 grid size-16 place-items-center rounded-full bg-sand text-gold-deep">
        <Icon className="size-7" strokeWidth={1.5} />
      </span>
      <h4 className="font-display text-lg text-green-deep">{title}</h4>
      {subtitle && <p className="mt-2 max-w-xs text-sm leading-7 text-green-deep/60">{subtitle}</p>}
      <Diamond className="mt-5 size-2 text-gold" />
    </div>
  );
}

export function PillTabs({ active, onChange, tabs }) {
  return (
    <div className={`flex gap-1.5 overflow-x-auto rounded-sm bg-white p-1.5 ${CARD_SHADOW}`}>
      {tabs.map((tb) => {
        const on = active === tb.key;
        return (
          <button
            key={tb.key}
            onClick={() => onChange(tb.key)}
            className={`flex h-11 shrink-0 items-center gap-2 rounded-sm px-5 text-sm font-bold transition-colors ${
              on ? "bg-green-deep text-gold" : "text-green-deep/60 hover:bg-sand"
            }`}
          >
            <tb.icon className="size-4" strokeWidth={1.75} />
            {tb.label}
            {tb.badge > 0 && (
              <span className={`grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-extrabold leading-5 text-white ${on ? "bg-gold/30" : "bg-algeria-red"}`}>
                {tb.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SoftStat({ icon, label, value, tone = "dark" }) {
  return (
    <div className={`flex min-w-40 flex-1 items-center gap-4 bg-white p-5 ${CARD_SHADOW}`}>
      <IconTile icon={icon} tone={tone} />
      <div className="min-w-0">
        <p className="text-xs text-green-deep/55">{label}</p>
        <p className="mt-1 truncate font-display text-xl tabular-nums text-green-deep">{value}</p>
      </div>
    </div>
  );
}

// ── Modal ───────────────────────────────────────────────────────
export function Modal({ onClose, dir, maxWidth = "max-w-md", children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[300] grid place-items-center bg-green-deep/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        dir={dir}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-sm bg-ivory shadow-[0_50px_100px_-40px_rgba(0,0,0,.8)]`}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function ModalHeader({ title, subtitle, onClose, children }) {
  return (
    <div className="relative shrink-0 overflow-hidden bg-green-deep px-6 py-5 text-ivory">
      <div className="nm-pattern pointer-events-none absolute inset-0 opacity-[0.08]" />
      <ColumnMark className="pointer-events-none absolute -bottom-3 end-14 h-24 text-gold/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-xl">{title}</h3>
          {subtitle && <p className="mt-1 truncate text-xs text-ivory/60">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="close"
          className="grid size-9 shrink-0 place-items-center rounded-sm bg-ivory/10 text-ivory transition-colors hover:bg-gold hover:text-green-deep"
        >
          <X className="size-4" />
        </button>
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </div>
  );
}

export function ModalBody({ flush = false, className = "", children }) {
  return <div className={`flex-1 overflow-y-auto ${flush ? "" : "space-y-5 px-6 py-6"} ${className}`}>{children}</div>;
}

export function ModalFooter({ children }) {
  return <div className="flex shrink-0 items-center gap-3 bg-sand/60 px-6 py-4">{children}</div>;
}