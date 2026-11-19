import { Link } from "react-router-dom";

export default function Footer({ logo, name, rights, contacts = [], links = [] }) {
  return (
    <footer className="bg-green-deep text-ivory">
      <div className="nm-rule" />
      <div className="container mx-auto flex flex-col items-center justify-between gap-8 px-4 py-14 sm:px-6 md:flex-row lg:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-14 place-items-center rounded-sm bg-ivory">
            <img src={logo} alt={name} className="size-11 object-contain" />
          </span>
          <div>
            <p className="font-display">{name}</p>
            <p className="text-xs text-ivory/50">{rights}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm text-ivory/70">
          {contacts.map(({ href, icon: Icon, label }) => (
            <a key={href} href={href} className="flex items-center gap-2 hover:text-gold">
              <Icon className="size-4 text-gold" />{label}
            </a>
          ))}
        </div>
        <nav className="flex gap-6 text-sm text-ivory/70">
          {links.map(({ to, label }) => <Link key={to} to={to} className="hover:text-gold">{label}</Link>)}
        </nav>
      </div>
    </footer>
  );
}