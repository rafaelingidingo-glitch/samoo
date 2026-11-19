import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryAdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="rounded-lg border border-border bg-white">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border p-4 last:border-0">
            <Skeleton className="h-12 w-16 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-64 max-w-full" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
