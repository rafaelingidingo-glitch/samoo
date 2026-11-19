"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function TablePagination({
  page,
  totalPages,
  total,
}: {
  page: number;
  totalPages: number;
  total?: number;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  function go(target: number) {
    router.push(hrefFor(target), { scroll: false });
  }

  return (
    <nav aria-label="Inventory pagination" className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-gold disabled:opacity-40"
      >
        <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
        Previous
      </button>
      <span className="px-3 text-sm text-muted-foreground">
        Page <span className="font-semibold text-foreground">{page}</span> of {totalPages}
        {total !== undefined && ` · ${total} total`}
      </span>
      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-gold disabled:opacity-40"
      >
        Next
        <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
      </button>
      <Link
        href={hrefFor(page)}
        className="sr-only"
        aria-label={`Current page ${page}`}
      >
        {page}
      </Link>
    </nav>
  );
}
