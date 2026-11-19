"use client";

import { useRouter } from "next/navigation";
import { InventoryFilters, type BrandOption, type CategoryOption } from "@/components/inventory/inventory-filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PublicVehicleQuery } from "@/lib/validations";

/**
 * Results header row: result count, mobile filter drawer trigger, sort select.
 */
export function InventoryToolbar({
  total,
  current,
  brands,
  categories,
  years,
}: {
  total: number;
  current: PublicVehicleQuery;
  brands: BrandOption[];
  categories: CategoryOption[];
  years: number[];
}) {
  const router = useRouter();

  const onSortChange = (v: string) => {
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
      sort: v !== "newest" ? v : undefined,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== "") params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/inventory?${qs}` : "/inventory", { scroll: false });
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-white px-4 py-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        <span className="font-semibold text-foreground">{total}</span>{" "}
        {total === 1 ? "vehicle" : "vehicles"} found
      </p>
      <div className="flex items-center gap-3">
        {/* Mobile filter drawer */}
        <div className="lg:hidden">
          <InventoryFilters
            brands={brands}
            categories={categories}
            years={years}
            current={current}
            variant="drawer"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">Sort</span>
          <Select value={current.sort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[190px]" aria-label="Sort vehicles">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest arrivals</SelectItem>
              <SelectItem value="oldest">Oldest listings</SelectItem>
              <SelectItem value="price_asc">Price: low to high</SelectItem>
              <SelectItem value="price_desc">Price: high to low</SelectItem>
              <SelectItem value="year_desc">Newest year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
