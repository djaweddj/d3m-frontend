import { X, AlertCircle } from "lucide-react";

// Inline error banner (replaces the floating red toast). Same red tone as EmptyState "error".
export default function AlertBanner({ children, onClose, closeLabel = "Close" }) {
  return (
    <div role="alert" className="flex items-start gap-3 border border-algeria-red/40 bg-algeria-red/10 p-4">
      <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-algeria-red text-ivory">
        <AlertCircle className="size-4" />
      </span>
      <p className="flex-1 pt-1 text-sm leading-6 text-green-deep/80">{children}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="grid size-8 shrink-0 place-items-center rounded-sm text-algeria-red transition-colors hover:bg-algeria-red/15"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}