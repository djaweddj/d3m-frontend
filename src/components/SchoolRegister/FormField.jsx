import { AlertCircle } from "lucide-react";

// Shared input style (same tokens as SearchBar / WilayaFilter)
export const inputCls =
  "h-12 w-full rounded-sm border border-gold/40 bg-ivory px-4 text-sm text-green-deep outline-none transition placeholder:text-green-deep/40 focus:border-gold focus:ring-2 focus:ring-gold/40 aria-[invalid=true]:border-algeria-red aria-[invalid=true]:focus:ring-algeria-red/30";

export function Field({ id, label, req, error, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold text-green-deep">
        {label}
        {req && <span className="mx-1 text-algeria-red" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-algeria-red">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// Icon pinned to the end of the input. `ltr` is for phone / email fields:
// the wrapper becomes LTR so the icon and the input padding stay on the same side in RTL pages.
export function InputIcon({ icon: Icon, ltr = false, children }) {
  return (
    <div className="relative" dir={ltr ? "ltr" : undefined}>
      {children}
      <Icon
        className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-gold-deep"
        strokeWidth={1.5}
      />
    </div>
  );
}