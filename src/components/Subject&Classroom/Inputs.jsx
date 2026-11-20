import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { Field, InputIcon, inputCls } from "../SchoolRegister/FormField";

// Value-based inputs (onChange receives the new value, not the event).
// Same look as the other forms: ivory background, gold border, sharp corners.

export function FormInput({ label, value, onChange, placeholder, type = "text", req, error, ...rest }) {
  const id = useId();
  return (
    <Field id={id} label={label} req={req} error={error}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputCls}
        {...rest}
      />
    </Field>
  );
}

export function FormTextarea({ label, value, onChange, placeholder, req, error, rows = 4 }) {
  const id = useId();
  return (
    <Field id={id} label={label} req={req} error={error}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        // inputCls minus its fixed height, so the textarea can grow
        className={`${inputCls.replace("h-12", "min-h-28 py-3 leading-7")} resize-y`}
      />
    </Field>
  );
}

export function FormSelect({ label, value, onChange, options = [], placeholder, req, error }) {
  const id = useId();
  return (
    <Field id={id} label={label} req={req} error={error}>
      <InputIcon icon={ChevronDown}>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputCls} cursor-pointer appearance-none pe-11`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </InputIcon>
    </Field>
  );
}