const VARIANTS = {
  solid: "bg-green-deep text-ivory hover:bg-green-soft",
  danger: "border border-algeria-red/40 text-algeria-red hover:bg-algeria-red hover:text-ivory",
  ghost: "border border-gold/40 bg-white text-green-deep hover:bg-gold",
};

// Icon-only square button, or (when children are given) a compact labelled button
export default function IconButton({
  icon: Icon, label, variant = "ghost", large = false, loading = false, disabled = false, className = "", children, ...p
}) {
  const hasText = children != null;
  const size = hasText ? "h-10 gap-2 px-4 text-xs font-bold" : large ? "size-12" : "size-10";
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={loading || disabled}
      className={`inline-flex shrink-0 items-center justify-center rounded-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${size} ${VARIANTS[variant]} ${className}`}
      {...p}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current/40 border-t-current" />
      ) : (
        Icon && <Icon className="size-4" />
      )}
      {children}
    </button>
  );
}
