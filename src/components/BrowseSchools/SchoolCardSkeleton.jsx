export default function SchoolCardSkeleton() {
  return (
    <div className="border border-gold/25 bg-white p-6" aria-hidden="true">
      <div className="mb-5 flex items-start justify-between">
        <div className="size-16 animate-pulse rounded-sm bg-sand" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-sand" />
      </div>
      <div className="mb-3 h-6 w-2/3 animate-pulse bg-sand" />
      <div className="mb-2 h-4 w-1/2 animate-pulse bg-sand" />
      <div className="mb-2 h-4 w-3/5 animate-pulse bg-sand" />
      <div className="mb-6 h-4 w-1/3 animate-pulse bg-sand" />
      <div className="flex items-center justify-between border-t border-gold/25 pt-5">
        <div className="h-10 w-24 animate-pulse bg-sand" />
        <div className="h-12 w-32 animate-pulse rounded-sm bg-sand" />
      </div>
    </div>
  );
}