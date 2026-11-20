export default function TeacherCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 border border-gold/25 bg-white p-6 pt-8" aria-hidden="true">
      <div className="mt-2 size-16 animate-pulse rounded-sm bg-sand" />
      <div className="h-6 w-2/3 animate-pulse bg-sand" />
      <div className="h-4 w-1/2 animate-pulse bg-sand" />
      <div className="h-7 w-24 animate-pulse bg-sand" />
      <div className="mt-4 h-10 w-full animate-pulse rounded-sm bg-sand" />
    </div>
  );
}
