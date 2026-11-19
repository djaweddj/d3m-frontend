import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import NButton from "../home/NButton";
import { useLanguage } from "../../context/LanguageContext";

export default function ConfirmModal({
  icon: Icon, title, description, rows = [], priceLabel, priceValue,
  confirmLabel, confirmVariant = "green", loading, onConfirm, onCancel,
}) {
  const { t } = useLanguage();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !loading && onCancel();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel, loading]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => !loading && onCancel()}
      role="dialog" aria-modal="true"
      className="fixed inset-0 z-[300] grid place-items-center bg-green-deep/70 p-4 backdrop-blur-md"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto border border-gold/40 bg-white p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={() => !loading && onCancel()}
          aria-label={t("schoolDetails.modal.close")}
          className="absolute end-4 top-4 grid size-8 place-items-center border border-gold/25 text-green-deep/60 transition-colors hover:border-gold hover:text-green-deep"
        >
          <X className="size-4" />
        </button>

        <span className="mx-auto mb-5 grid size-16 place-items-center rounded-sm bg-green-deep text-gold">
          <Icon className="size-8" strokeWidth={1.5} />
        </span>
        <h2 className="text-center font-display text-xl text-green-deep">{title}</h2>
        <p className="mb-6 mt-2 text-center text-sm leading-7 text-green-deep/60">{description}</p>

        <dl className="mb-6 border border-gold/25 bg-ivory px-4 py-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-gold/15 py-2.5 text-sm">
              <dt className="text-green-deep/60">{k}</dt>
              <dd className="font-semibold text-green-deep">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 py-2.5 text-sm">
            <dt className="text-green-deep/60">{priceLabel}</dt>
            <dd className="font-display text-base tabular-nums text-green-deep">{priceValue}</dd>
          </div>
        </dl>

        <div className="flex gap-3">
          <NButton type="button" variant="outline" onClick={onCancel} className="flex-1 px-4">
            {t("schoolDetails.modal.cancel")}
          </NButton>
          <NButton
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <span className="size-4 animate-spin rounded-full border-2 border-current/40 border-t-current" />}
            {loading ? t("schoolDetails.modal.sending") : confirmLabel}
          </NButton>
        </div>
      </motion.div>
    </motion.div>
  );
}