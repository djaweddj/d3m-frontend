import { AnimatePresence, motion } from "framer-motion";

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICON_PATHS = {
  book:     "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  users:    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  teacher:  "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  file:     "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
};

export function Icon({ name, size = "" }) {
  return (
    <svg className={`n-icon ${size ? `n-icon--${size}` : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON_PATHS[name]} />
    </svg>
  );
}

// ─── States ───────────────────────────────────────────────────────────────────
export function Spinner() {
  return <div className="n-spinner" />;
}

export function EmptyState({ message }) {
  return (
    <div className="n-state">
      <span className="n-state__icon"><Icon name="file" size="xl" /></span>
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message }) {
  return <div className="n-state n-state--error">{message}</div>;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function ItemCard({ icon, title, description, actions, footer }) {
  return (
    <motion.div className="n-card"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.2 }}>
      <div className="n-card__top">
        <span className="n-card__icon"><Icon name={icon} /></span>
        <div className="n-card__actions">{actions}</div>
      </div>
      <h3 className="n-card__title">{title}</h3>
      {description && <p className="n-card__desc">{description}</p>}
      {footer && <div className="n-card__footer">{footer}</div>}
    </motion.div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function NModal({
  open, title, onClose, onConfirm,
  confirmLabel, cancelLabel,
  confirmVariant = "primary", disabled = false,
  children,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="n-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="n-modal"
            initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={e => e.stopPropagation()}>
            <h2 className="n-modal__title">{title}</h2>
            <div className="n-modal__body">{children}</div>
            <div className="n-modal__footer">
              <button className="n-btn n-btn--ghost" onClick={onClose}>{cancelLabel}</button>
              <button className={`n-btn n-btn--${confirmVariant}`} onClick={onConfirm} disabled={disabled}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Fields ───────────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="n-field">
      {label && <label className="n-field__label">{label}</label>}
      {children}
    </div>
  );
}

export function NInput({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <Field label={label}>
      <input className="n-field__control" type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} />
    </Field>
  );
}

export function NTextarea({ label, value, onChange, placeholder = "" }) {
  return (
    <Field label={label}>
      <textarea className="n-field__control n-field__control--area" rows={3} value={value}
        placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </Field>
  );
}

export function NSelect({ label, value, onChange, options, placeholder }) {
  return (
    <Field label={label}>
      <select className="n-field__control" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}