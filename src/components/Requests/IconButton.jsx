const VARIANTS = {
  solid: "bg-green-deep text-ivory hover:bg-green-soft",
  danger: "border border-algeria-red/40 text-algeria-red hover:bg-algeria-red hover:text-ivory",
  ghost: "border border-gold/40 bg-white text-green-deep hover:bg-gold",
};

export default function IconButton({ icon: Icon, label, variant = "ghost", large = false, loading = false, className = "", ...p }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={loading || p.disabled}
      className={`grid shrink-0 place-items-center rounded-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        large ? "size-12" : "size-10"
      } ${VARIANTS[variant]} ${className}`}
      {...p}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current/40 border-t-current" />
      ) : (
        <Icon className="size-4" />
      )}
    </button>
  );
}