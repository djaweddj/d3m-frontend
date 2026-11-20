export default function IconButton({ icon: Icon, label, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid size-9 place-items-center rounded-sm bg-ivory/10 text-ivory transition-colors hover:bg-gold hover:text-green-deep ${className}`}
    >
      <Icon className="size-4" />
    </button>
  );
}
