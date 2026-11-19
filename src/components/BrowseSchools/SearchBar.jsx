import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <label className="flex h-14 items-center gap-3 border border-gold/30 bg-ivory px-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,.8)] transition focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/40">
      <Search className="size-5 shrink-0 text-gold-deep" strokeWidth={1.5} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-start text-sm text-green-deep outline-none placeholder:text-green-deep/40 sm:text-base"
      />
    </label>
  );
}