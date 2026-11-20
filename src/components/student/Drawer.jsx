import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Diamond } from "../home/Marks";

export default function Drawer({
  open, onClose, title, subtitle, dir = "ltr", closeLabel = "Close",
  closeOnEsc = true, width = "max-w-xl", children,
}) {
  const offscreen = dir === "rtl" ? "-100%" : "100%";

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => closeOnEsc && e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, closeOnEsc]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-green-deep/60 backdrop-blur-sm"
          />
          <motion.aside
            key="panel"
            dir={dir}
            role="dialog"
            aria-modal="true"
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed inset-y-0 end-0 z-50 flex w-full ${width} flex-col bg-ivory shadow-2xl`}
          >
            <header className="relative bg-green-deep px-6 py-6 text-ivory">
              <div className="nm-pattern pointer-events-none absolute inset-0 opacity-[0.08]" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-gold">
                    <Diamond className="size-2" />{subtitle}
                  </span>
                  <h3 className="mt-2 truncate font-display text-2xl">{title}</h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel}
                  className="grid size-10 shrink-0 place-items-center rounded-sm border border-ivory/30 text-ivory transition-colors hover:border-gold hover:text-gold"
                >
                  <X className="size-5" />
                </button>
              </div>
            </header>
            <div className="nm-rule" />
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}