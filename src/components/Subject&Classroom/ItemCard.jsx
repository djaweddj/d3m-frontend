import { motion } from "framer-motion";

// Small status chip. tone: "gold" | "green" | "muted" (same palette as StatusBadge)
const CHIP = {
  gold: "bg-gold/15 text-gold-deep",
  green: "bg-green-deep/10 text-green-deep",
  muted: "bg-sand text-green-deep/60",
};

export function Chip({ tone = "gold", icon: Icon, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${CHIP[tone]}`}>
      {Icon && <Icon className="size-3.5" />}
      {children}
    </span>
  );
}

// Compact card action. tone: "ghost" (gold outline) | "danger" (red outline)
const ACTION = {
  ghost: "border-gold/60 text-green-deep hover:bg-gold",
  danger: "border-algeria-red/40 text-algeria-red hover:bg-algeria-red/10",
};

export function CardAction({ tone = "ghost", className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center justify-center rounded-sm border px-4 text-xs font-bold transition-colors ${ACTION[tone]} ${className}`}
      {...props}
    />
  );
}

// Card for a manageable item (subject, classroom...). Use inside <AnimatePresence>.
export default function ItemCard({ icon: Icon, title, description, actions, footer }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="group flex h-full flex-col border border-gold/25 bg-white p-6 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-gold"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="grid size-14 shrink-0 place-items-center rounded-sm bg-green-deep text-gold transition-colors group-hover:bg-gold group-hover:text-green-deep">
          <Icon className="size-6" strokeWidth={1.5} />
        </span>
        {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
      </div>

      <h3 className="font-display text-xl text-green-deep">{title}</h3>
      {description && <p className="mt-2 line-clamp-3 text-sm leading-7 text-green-deep/60">{description}</p>}

      {footer && <div className="mt-auto border-t border-gold/25 pt-5">{footer}</div>}
    </motion.article>
  );
}