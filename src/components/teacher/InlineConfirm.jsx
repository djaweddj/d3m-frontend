import { Check } from "lucide-react";
import IconButton from "../Requests/IconButton";

// Renders its children (the trigger) until `open`, then a warning + confirm / cancel pair
export default function InlineConfirm({
  open, busy, warning, confirmLabel, cancelLabel, confirmVariant = "solid", onConfirm, onCancel, children,
}) {
  if (!open) return children;
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-xs font-bold leading-6 text-green-deep/60">{warning}</p>
      <div className="flex gap-3">
        <IconButton icon={Check} variant={confirmVariant} loading={busy} onClick={onConfirm} className="flex-1">
          {confirmLabel}
        </IconButton>
        <IconButton variant="ghost" disabled={busy} onClick={onCancel} className="flex-1">
          {cancelLabel}
        </IconButton>
      </div>
    </div>
  );
}
