"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "RESERVED", label: "Reserved" },
  { value: "SOLD", label: "Sold" },
];

export function AdminInventoryToolbar({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushParams(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (!("page" in patch)) params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const hasFilters = ["q", "status", "publishState", "featured", "sort"].some((k) =>
    searchParams.get(k)
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = String(new FormData(e.currentTarget).get("q") ?? "").trim();
            pushParams({ q: val || undefined });
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              name="q"
              defaultValue={searchParams.get("q") ?? ""}
              key={`q-${searchParams.get("q") ?? ""}`}
              placeholder="Search title, brand, model…"
              className="w-64 pl-9"
              aria-label="Search inventory"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="ml-2">
            Search
          </Button>
        </form>

        <Select
          value={searchParams.get("status") ?? "all"}
          onValueChange={(v) => pushParams({ status: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="w-[150px]" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("publishState") ?? "all"}
          onValueChange={(v) => pushParams({ publishState: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="w-[150px]" aria-label="Filter by publish state">
            <SelectValue placeholder="All listings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All listings</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("featured") ?? "all"}
          onValueChange={(v) => pushParams({ featured: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by featured">
            <SelectValue placeholder="All vehicles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All vehicles</SelectItem>
            <SelectItem value="featured">Featured only</SelectItem>
            <SelectItem value="not_featured">Not featured</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("sort") ?? "newest"}
          onValueChange={(v) => pushParams({ sort: v === "newest" ? undefined : v })}
        >
          <SelectTrigger className="w-[180px]" aria-label="Sort inventory">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest added</SelectItem>
            <SelectItem value="oldest">Oldest added</SelectItem>
            <SelectItem value="price_asc">Price: low to high</SelectItem>
            <SelectItem value="price_desc">Price: high to low</SelectItem>
            <SelectItem value="year_desc">Newest year</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => router.push(pathname, { scroll: false })}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Clear
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        <span className="font-semibold text-foreground">{total}</span> {total === 1 ? "vehicle" : "vehicles"}
      </p>
    </div>
  );
}

export function AddVehicleButton() {
  return (
    <Button asChild className="bg-gold text-gold-foreground hover:bg-gold-dark">
      <a href="/admin/dashboard/inventory/new">
        <Plus className="mr-1.5 h-4 w-4" aria-hidden />
        Add Vehicle
      </a>
    </Button>
  );
}
