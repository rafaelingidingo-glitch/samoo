"use client";

import { useRouter } from "next/navigation";
import { Filter, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TRANSMISSION_OPTIONS, FUEL_TYPE_OPTIONS } from "@/lib/format";
import type { PublicVehicleQuery } from "@/lib/validations";

export type BrandOption = { id: string; name: string; slug: string; vehicleCount: number };
export type CategoryOption = { id: string; name: string; slug: string; vehicleCount: number };

type Props = {
  brands: BrandOption[];
  categories: CategoryOption[];
  years: number[];
  current: PublicVehicleQuery;
  variant: "sidebar" | "drawer";
};

/**
 * Inventory filter panel. All state lives in the URL — this component
 * just writes params and lets the server re-render results.
 * Text inputs are uncontrolled inside <form> elements; their defaults
 * re-seed automatically whenever the URL changes.
 */
export function InventoryFilters({ brands, categories, years, current, variant }: Props) {
  const router = useRouter();

  function pushParams(patch: Record<string, string | undefined>) {
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
      ...patch,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== "") params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/inventory?${qs}` : "/inventory", { scroll: false });
  }

  const activeFilterCount = [
    current.q,
    current.brand,
    current.category,
    current.minPrice !== undefined ? "1" : undefined,
    current.maxPrice !== undefined ? "1" : undefined,
    current.year?.toString(),
    current.transmission,
    current.fuel,
    current.availability,
  ].filter(Boolean).length;

  const body = (
    <div className="flex flex-col gap-5">
      {/* Search — uncontrolled form, Enter or Go applies */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const val = String(new FormData(e.currentTarget).get("q") ?? "").trim();
          pushParams({ q: val || undefined });
        }}
      >
        <Label htmlFor={`filter-q-${variant}`} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Search
        </Label>
        <div className="mt-2 flex gap-2">
          <Input
            id={`filter-q-${variant}`}
            name="q"
            defaultValue={current.q ?? ""}
            key={`q-${variant}-${current.q ?? ""}`}
            placeholder="Title, brand, model, year"
            aria-label="Search vehicles by title, brand, model or year"
          />
          <Button type="submit" variant="outline">
            Go
          </Button>
        </div>
      </form>

      {/* Brand */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Brand
        </Label>
        <Select
          value={current.brand ?? "all"}
          onValueChange={(v) => pushParams({ brand: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="mt-2" aria-label="Filter by brand">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.slug}>
                {b.name} ({b.vehicleCount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Category
        </Label>
        <Select
          value={current.category ?? "all"}
          onValueChange={(v) => pushParams({ category: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="mt-2" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name} ({c.vehicleCount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price range — uncontrolled form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const min = String(data.get("min") ?? "").trim();
          const max = String(data.get("max") ?? "").trim();
          pushParams({ minPrice: min || undefined, maxPrice: max || undefined });
        }}
      >
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Price range (TSh)
        </Label>
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="number"
            name="min"
            min={0}
            defaultValue={current.minPrice?.toString() ?? ""}
            key={`min-${variant}-${current.minPrice ?? ""}`}
            placeholder="Min"
            aria-label="Minimum price in TSh"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            name="max"
            min={0}
            defaultValue={current.maxPrice?.toString() ?? ""}
            key={`max-${variant}-${current.maxPrice ?? ""}`}
            placeholder="Max"
            aria-label="Maximum price in TSh"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" className="mt-2 w-full">
          Apply price range
        </Button>
      </form>

      {/* Year */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Year
        </Label>
        <Select
          value={current.year?.toString() ?? "all"}
          onValueChange={(v) => pushParams({ year: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="mt-2" aria-label="Filter by year">
            <SelectValue placeholder="Any year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any year</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transmission */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Transmission
        </Label>
        <Select
          value={current.transmission ?? "all"}
          onValueChange={(v) => pushParams({ transmission: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="mt-2" aria-label="Filter by transmission">
            <SelectValue placeholder="Any transmission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any transmission</SelectItem>
            {TRANSMISSION_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fuel */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Fuel type
        </Label>
        <Select
          value={current.fuel ?? "all"}
          onValueChange={(v) => pushParams({ fuel: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="mt-2" aria-label="Filter by fuel type">
            <SelectValue placeholder="Any fuel type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any fuel type</SelectItem>
            {FUEL_TYPE_OPTIONS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Availability */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Availability
        </Label>
        <Select
          value={current.availability ?? "all"}
          onValueChange={(v) => pushParams({ availability: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="mt-2" aria-label="Filter by availability">
            <SelectValue placeholder="Any availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any availability</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="SOLD">Sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear */}
      {activeFilterCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          className="justify-start text-muted-foreground"
          onClick={() => router.push("/inventory", { scroll: false })}
        >
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
          Clear all filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  if (variant === "sidebar") {
    return (
      <div className="rounded-lg border border-border bg-white p-6">
        <p className="mb-5 flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wider">
          <SlidersHorizontal className="h-4 w-4 text-gold-dark" aria-hidden />
          Filters
        </p>
        {body}
      </div>
    );
  }

  // Drawer variant (mobile)
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" aria-hidden />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-bold text-gold-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] overflow-y-auto custom-scrollbar sm:w-[380px]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8">{body}</div>
      </SheetContent>
    </Sheet>
  );
}
