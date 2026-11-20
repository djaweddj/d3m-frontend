import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import NButton from "../home/NButton";

// Dialog with the same props as the old NModal:
// open, title, onClose, onConfirm, confirmLabel, cancelLabel, confirmVariant ("primary" | "danger"), disabled
export default function Modal({
  open, title, onClose, onConfirm, confirmLabel, cancelLabel,
  confirmVariant = "primary", disabled = false, children,
}) {
  const titleId = useId();
  const panelRef = useRef(null);
  const danger = confirmVariant === "danger";

  // Esc to close + lock page scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape" && !disabled) onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, disabled, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && !disabled) onClose(); }}
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-green-deep/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg border border-gold/25 bg-white shadow-[0_50px_100px_-40px_rgba(0,0,0,.8)] outline-none"
          >
            <div className="flex items-center justify-between gap-4 border-b border-gold/25 px-6 py-5">
              <h2 id={titleId} className="font-display text-xl text-green-deep">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                disabled={disabled}
                aria-label={cancelLabel}
                className="grid size-9 place-items-center rounded-sm text-green-deep/60 transition-colors hover:bg-gold/15 hover:text-green-deep disabled:opacity-40"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onConfirm(); }}>
              <div className="space-y-5 px-6 py-6">{children}</div>

              <div className="flex flex-col-reverse gap-3 border-t border-gold/25 bg-ivory px-6 py-4 sm:flex-row sm:justify-end">
                <NButton type="button" variant="outline" onClick={onClose} disabled={disabled} className="w-full sm:w-auto">
                  {cancelLabel}
                </NButton>
                <NButton
                  type="submit"
                  variant={danger ? "green" : "gold"}
                  disabled={disabled}
                  className={`w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
                    danger ? "!bg-algeria-red !text-ivory hover:!bg-algeria-red/90" : ""
                  }`}
                >
                  {disabled && <Loader2 className="size-4 animate-spin" />}
                  {confirmLabel}
                </NButton>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}