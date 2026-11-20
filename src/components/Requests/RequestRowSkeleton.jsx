export default function RequestRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border border-gold/25 bg-white p-4" aria-hidden="true">
      <div className="size-12 shrink-0 animate-pulse rounded-sm bg-sand" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-1/3 animate-pulse bg-sand" />
        <div className="h-4 w-1/2 animate-pulse bg-sand" />
      </div>
      <div className="hidden size-10 animate-pulse rounded-sm bg-sand sm:block" />
      <div className="hidden size-10 animate-pulse rounded-sm bg-sand sm:block" />
    </div>
  );
}