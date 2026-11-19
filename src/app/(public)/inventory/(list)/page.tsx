import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { InventoryToolbar } from "@/components/inventory/inventory-toolbar";
import { Pagination } from "@/components/inventory/pagination";
import {
  getPublishedVehicles,
  getBrandsWithCounts,
  getCategoriesWithCounts,
  getActiveYears,
} from "@/lib/services/vehicles";
import { publicVehicleQuerySchema } from "@/lib/validations";

export const metadata: Metadata = {
  title: "Inventory — Explore Our Collection",
  description:
    "Discover distinctive vintage and classic automobiles from our collection. Search, filter and enquire directly via WhatsApp.",
  alternates: { canonical: "/inventory" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DEFAULTS = { sort: "newest", page: "1" } as const;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v !== undefined && v !== "") flat[key] = v;
  }

  const parsed = publicVehicleQuerySchema.safeParse({
    ...DEFAULTS,
    ...flat,
    page: flat.page || "1",
    sort: flat.sort || "newest",
  });
  const query = parsed.success ? parsed.data : publicVehicleQuerySchema.parse({});

  const [result, brands, categories, years] = await Promise.all([
    getPublishedVehicles(query),
    getBrandsWithCounts(),
    getCategoriesWithCounts(),
    getActiveYears(),
  ]);

  const hasActiveFilters =
    Boolean(query.q) ||
    Boolean(query.brand) ||
    Boolean(query.category) ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined ||
    Boolean(query.year) ||
    Boolean(query.transmission) ||
    Boolean(query.fuel) ||
    Boolean(query.availability);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 md:py-14">
      <header className="mb-10">
        <p className="eyebrow">Our Collection</p>
        <h1 className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight md:text-5xl">
          Explore Our Collection
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Discover distinctive automobiles from our collection.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block" aria-label="Vehicle filters">
          <InventoryFilters
            brands={brands}
            categories={categories}
            years={years}
            current={query}
            variant="sidebar"
          />
        </aside>

        <section aria-label="Vehicle results">
          {/* Mobile filter trigger + sort */}
          <InventoryToolbar
            total={result.total}
            current={query}
            brands={brands}
            categories={categories}
            years={years}
          />

          {result.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/50 px-6 py-20 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                <SearchX className="h-7 w-7 text-gold-dark" aria-hidden />
              </span>
              <h2 className="mt-5 font-heading text-xl font-bold">
                No vehicles match your search
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Try adjusting your filters or search terms, or browse the full collection.
              </p>
              {hasActiveFilters && (
                <Link
                  href="/inventory"
                  className="mt-6 inline-flex items-center rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/85"
                >
                  Clear all filters
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((vehicle, i) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} priority={i < 3} />
                ))}
              </div>
              {result.totalPages > 1 && (
                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  current={query}
                />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
