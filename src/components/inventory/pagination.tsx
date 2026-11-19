import Link from "next/link";
import type { PublicVehicleQuery } from "@/lib/validations";

/**
 * URL-preserving pagination for inventory results.
 */
export function Pagination({
  page,
  totalPages,
  current,
}: {
  page: number;
  totalPages: number;
  current: PublicVehicleQuery;
}) {
  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      q: current.q,
      brand: current.brand,
      category: current.category,
      minPrice: current.minPrice?.toString(),
      maxPrice: current.maxPrice?.toString(),
      year: current.year?.toString(),
      transmission: current.transmission,
      fuel: current.fuel,
      availability: current.availability,
      sort: current.sort !== "newest" ? current.sort : undefined,
      page: target > 1 ? target.toString() : undefined,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== "") params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/inventory?${qs}` : "/inventory";
  };

  // Compact page list: 1 … around current … last
  const pages: (number | "…")[] = [];
  const push = (p: number | "…") => pages.push(p);
  const window = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= page - window && p <= page + window)
    ) {
      push(p);
    } else if (pages[pages.length - 1] !== "…") {
      push("…");
    }
  }

  return (
    <nav
      aria-label="Inventory pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 && (
        <Link
          href={hrefFor(page - 1)}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-gold hover:text-gold-dark"
          aria-label="Previous page"
        >
          Previous
        </Link>
      )}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              p === page
                ? "border-gold bg-gold text-gold-foreground"
                : "border-border hover:border-gold hover:text-gold-dark"
            }`}
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-gold hover:text-gold-dark"
          aria-label="Next page"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
