import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputCls } from "../SchoolRegister/FormField";

// Password field with a show / hide toggle at the end of the input.
export default function PasswordInput({ toggleLabel = "Show / hide password", ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${inputCls} pe-11`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-pressed={show}
        aria-label={toggleLabel}
        className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-sm text-gold-deep transition-colors hover:bg-gold/15"
      >
        {show ? <EyeOff className="size-4" strokeWidth={1.5} /> : <Eye className="size-4" strokeWidth={1.5} />}
      </button>
    </div>
  );
}