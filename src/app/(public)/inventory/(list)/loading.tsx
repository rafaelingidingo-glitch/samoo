import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 md:py-14">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-10 w-80 max-w-full" />
      <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="hidden lg:flex flex-col gap-5 rounded-lg border border-border p-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
