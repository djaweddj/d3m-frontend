import { NavLink } from "react-router-dom";

const V = {
  side: {
    base: "flex w-full items-center gap-3 border-s-4 px-5 py-3 text-sm transition-colors",
    on: "border-gold bg-ivory/10 font-bold text-gold",
    off: "border-transparent text-ivory/60 hover:bg-ivory/5 hover:text-ivory",
    icon: "size-4 shrink-0",
  },
  tab: {
    base: "flex min-w-16 flex-1 shrink-0 flex-col items-center gap-1 rounded-sm px-3 py-2 text-[10px] transition-colors",
    on: "bg-ink font-bold text-gold",
    off: "text-ink/60 hover:bg-sand",
    icon: "size-5",
  },
};

// With `to` it is a router NavLink (active state comes from the URL); otherwise a plain button.
// variant: "side" | "tab"
export default function NavItem({ icon: Icon, label, to, onClick, variant = "side" }) {
  const v = V[variant];
  const body = (
    <>
      <Icon className={v.icon} strokeWidth={1.5} />
      <span className="whitespace-nowrap">{label}</span>
    </>
  );

  if (!to) {
    return <button onClick={onClick} className={`${v.base} ${v.off}`}>{body}</button>;
  }
  return (
    <NavLink to={to} end className={({ isActive }) => `${v.base} ${isActive ? v.on : v.off}`}>
      {body}
    </NavLink>
  );
}
