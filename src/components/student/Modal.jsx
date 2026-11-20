import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Diamond } from "../home/Marks";

export default function Modal({
  onClose, icon: Icon, title, subtitle, footer, dir,
  width = "max-w-lg", closeOnBackdrop = false, closeLabel = "Close", children,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div dir={dir} className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={closeOnBackdrop ? onClose : undefined}
        className="absolute inset-0 bg-green-deep/60 backdrop-blur-sm"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`relative flex max-h-[92vh] w-full ${width} flex-col overflow-hidden bg-ivory shadow-2xl ring-1 ring-gold/30 sm:rounded-sm`}
      >
        <header className="relative bg-green-deep px-5 py-4 text-ivory">
          <div className="nm-pattern pointer-events-none absolute inset-0 opacity-[0.08]" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {Icon && (
                <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-gold text-green-deep">
                  <Icon className="size-5" strokeWidth={1.5} />
                </span>
              )}
              <div className="min-w-0">
                <h3 className="truncate font-display text-lg">{title}</h3>
                {subtitle && (
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-gold">
                    <Diamond className="size-2" />{subtitle}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="grid size-9 shrink-0 place-items-center rounded-sm border border-ivory/30 text-ivory transition-colors hover:border-gold hover:text-gold"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>
        <div className="nm-rule" />
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <footer className="flex items-center justify-between gap-3 border-t border-gold/20 bg-white px-5 py-3">
            {footer}
          </footer>
        )}
      </motion.div>
    </div>
  );
}