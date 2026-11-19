const Block = ({ className = "" }) => <div className={`animate-pulse bg-sand ${className}`} />;

export default function SchoolDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-ivory" aria-hidden="true">
      <div className="bg-green-deep pb-16 pt-32 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-7 h-8 w-48 animate-pulse rounded-full bg-ivory/10" />
          <div className="mb-4 h-14 w-full max-w-md animate-pulse bg-ivory/10" />
          <div className="h-5 w-56 animate-pulse bg-ivory/10" />
        </div>
      </div>
      <div className="container mx-auto grid gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:px-8 lg:py-20">
        <div className="space-y-10">
          <div className="grid gap-4 sm:grid-cols-3">
            <Block className="h-36" /><Block className="h-36" /><Block className="h-36" />
          </div>
          <Block className="h-64" />
          <Block className="h-56" />
          <Block className="h-56" />
        </div>
        <Block className="h-[30rem]" />
      </div>
    </div>
  );
}