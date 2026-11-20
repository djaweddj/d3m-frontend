const base =
  "h-11 w-full rounded-sm border border-gold/40 bg-white px-3 text-base text-green-deep outline-none transition-colors placeholder:text-green-deep/40 focus:border-gold";

export function Field({ label, group = false, className = "", children }) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-bold text-green-deep/70">{label}</span>
      {children}
    </Tag>
  );
}

// `dir` sets the text direction of the input and flips `endSlot` (e.g. the password eye) with it.
export function Input({ dir, endSlot, className = "", ...p }) {
  return (
    <div className="relative" dir={dir}>
      <input className={`${base} ${endSlot ? "pe-11" : ""} ${className}`} {...p} />
      {endSlot && <span className="absolute inset-y-0 end-0 grid w-11 place-items-center">{endSlot}</span>}
    </div>
  );
}

export function Select({ className = "", children, ...p }) {
  return (
    <select className={`${base} cursor-pointer ${className}`} {...p}>
      {children}
    </select>
  );
}

export function ErrorNote({ children }) {
  return (
    <div className="flex items-center gap-2 rounded-sm border border-algeria-red/30 bg-algeria-red/10 px-3 py-2.5 text-sm text-algeria-red">
      {children}
    </div>
  );
}