import { Link } from "react-router-dom";

const V = {
  green: "bg-green-deep text-ivory hover:bg-green-soft",
  gold: "bg-gold text-green-deep hover:bg-gold-deep hover:text-ivory",
  outline: "border border-gold/60 text-green-deep hover:bg-gold",
  outlineLight: "border border-ivory/30 text-ivory hover:border-gold hover:text-gold",
};

export default function NButton({ to, variant = "green", className = "", children, ...p }) {
  const cls = `inline-flex h-12 items-center justify-center gap-2 rounded-sm px-8 text-sm font-bold transition-colors ${V[variant]} ${className}`;
  return to
    ? <Link to={to} className={cls} {...p}>{children}</Link>
    : <button className={cls} {...p}>{children}</button>;
}