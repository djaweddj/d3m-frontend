import { Search } from "lucide-react";

export default function SearchField({ value, onChange, placeholder }) {
  return (
    <label className="relative block w-full sm:w-64">
      <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-gold-deep" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 w-full rounded-sm border border-gold/40 bg-white ps-10 pe-4 text-start text-sm text-green-deep outline-none transition placeholder:text-green-deep/40 focus:border-gold focus:ring-2 focus:ring-gold/40"
      />
    </label>
  );
}