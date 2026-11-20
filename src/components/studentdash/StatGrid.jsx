const COLS = {
  2: "grid-cols-2",
  // on mobile the odd last card spans the full row
  3: "grid-cols-2 md:grid-cols-3 [&>:last-child:nth-child(odd)]:col-span-2 md:[&>:last-child:nth-child(odd)]:col-span-1",
};

export default function StatGrid({ cols = 3, children }) {
  return <div className={`grid gap-3 ${COLS[cols]}`}>{children}</div>;
}
