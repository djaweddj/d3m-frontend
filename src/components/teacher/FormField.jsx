import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Diamond } from "../home/Marks";

export const inputClass =
  "h-11 w-full rounded-sm border border-gold/40 bg-ivory px-3 text-sm text-green-deep outline-none transition placeholder:text-green-deep/40 focus:border-gold focus:ring-2 focus:ring-gold/40";

export function FormField({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-green-deep/60">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-green-deep/50">{hint}</span>}
    </label>
  );
}

export function FormSection({ children }) {
  return (
    <h3 className="flex items-center gap-2 border-b border-gold/25 pb-2 pt-2 text-xs font-bold text-gold-deep">
      <Diamond className="size-2" />{children}
    </h3>
  );
}

export function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <div dir="ltr" className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${inputClass} pe-10`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute end-3 top-1/2 -translate-y-1/2 text-green-deep/50 transition-colors hover:text-green-deep"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
