import { Field, inputCls } from "../SchoolRegister/FormField";

// Label + value. Shows plain text, or an input when `editing` is true.
// ltr: phone / email values stay left-to-right inside RTL pages.
export default function ProfileField({ id, label, value, editing = false, onChange, type = "text", ltr = false }) {
  const dir = ltr ? "ltr" : undefined;
  return (
    <Field id={id} label={label}>
      {editing ? (
        <input
          id={id}
          type={type}
          dir={dir}
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p dir={dir} className="flex min-h-12 items-center rounded-sm bg-canvas px-4 text-sm text-ink rtl:text-end">
          {value || "—"}
        </p>
      )}
    </Field>
  );
}
