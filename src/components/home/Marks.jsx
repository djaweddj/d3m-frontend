export const Diamond = ({ className = "" }) => (
  <svg viewBox="0 0 12 12" className={className} aria-hidden="true"><path d="M6 0 12 6 6 12 0 6Z" fill="currentColor" /></svg>
);

export const GoldRule = ({ className = "" }) => (
  <div className={`flex items-center justify-center gap-3 ${className}`}>
    <span className="nm-rule w-16 sm:w-24" />
    <Diamond className="size-2.5 text-gold" />
    <span className="nm-rule w-16 sm:w-24" />
  </div>
);

export const ColumnMark = ({ className = "" }) => (
  <svg viewBox="0 0 48 64" className={className} fill="currentColor" aria-hidden="true">
    <rect x="6" y="6" width="36" height="5" rx="1" />
    <rect x="9" y="13" width="30" height="3" rx="1" opacity=".7" />
    {[13, 19, 25, 31].map((x) => <rect key={x} x={x} y="18" width="3" height="36" rx="1.5" opacity=".85" />)}
    <rect x="4" y="56" width="40" height="5" rx="1" />
  </svg>
);

export const CrescentStar = ({ className = "" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
    <path d="M40 6a26 26 0 1 0 0 52 21 21 0 1 1 0-52Z" opacity=".9" />
    <path d="m44 22 3.2 6.8 7.3.9-5.4 5 1.4 7.3L44 38.5 37.5 42l1.4-7.3-5.4-5 7.3-.9L44 22Z" />
  </svg>
);