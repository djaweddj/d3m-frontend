import { Check } from "lucide-react";
import { ColumnMark } from "../home/Marks";

// Dark promo panel next to the login / signup form (hidden below lg, like the old right side).
export default function AuthSidePanel({ title, description, features = [] }) {
  return (
    <aside className="relative hidden overflow-hidden bg-green-deep p-10 text-ivory lg:flex lg:flex-col lg:justify-center">
      <div className="nm-pattern pointer-events-none absolute inset-0 opacity-[0.10]" />
      <div className="pointer-events-none absolute -top-24 start-1/4 size-80 rounded-full bg-gold/10 blur-[110px]" />
      <ColumnMark className="pointer-events-none absolute -bottom-4 end-4 h-44 text-gold/10" />

      <div className="relative">
        <h2 className="font-display text-3xl leading-[1.3]">{title}</h2>
        <p className="mt-4 text-sm leading-8 text-ivory/70">{description}</p>

        <ul className="mt-8 space-y-6 border-t border-ivory/10 pt-8">
          {features.map(({ title: ft, desc }) => (
            <li key={ft} className="flex items-start gap-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-gold text-green-deep">
                <Check className="size-4" strokeWidth={2.5} />
              </span>
              <div>
                <h3 className="font-display text-ivory">{ft}</h3>
                <p className="mt-1 text-xs leading-6 text-ivory/60">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}