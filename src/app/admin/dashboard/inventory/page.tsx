import { Suspense } from "react";
import Link from "next/link";
import {
  getAdminVehicles,
} from "@/lib/services/vehicles";
import { requirePageUser, canDeleteRecords, canPublish } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { AdminInventoryToolbar } from "@/components/admin/inventory-toolbar";
import { InventoryTable } from "@/components/admin/inventory-table";
import { TablePagination } from "@/components/admin/table-pagination";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePageUser();
  if (!user) redirect("/admin/login?next=/admin/dashboard/inventory");

  const raw = await searchParams;
  const first = (key: string) => {
    const v = raw[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const page = Math.max(1, parseInt(first("page") || "1", 10) || 1);
  const sortParam = first("sort");
  const sort = (["newest", "oldest", "price_asc", "price_desc", "year_desc"] as const).find(
    (s) => s === sortParam
  ) ?? "newest";

  const result = await getAdminVehicles({
    q: first("q") || undefined,
    status: (["AVAILABLE", "RESERVED", "SOLD"] as const).find((s) => s === first("status")),
    publishState: first("publishState") === "published" ? "published" : first("publishState") === "draft" ? "draft" : undefined,
    featured: first("featured") === "featured" ? "featured" : first("featured") === "not_featured" ? "not_featured" : undefined,
    sort,
    page,
  });

  const vehicles = result.items.map((v) => ({ ...v, price: Number(v.price) }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage every vehicle record — availability, publishing and photos.
          </p>
        </div>
        <Link
          href="/admin/dashboard/inventory/new"
          className="inline-flex items-center rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground transition-colors hover:bg-gold-dark"
        >
          Add Vehicle
        </Link>
      </div>

      <Suspense fallback={<div className="h-12 animate-pulse rounded-md bg-secondary" />}>
        <AdminInventoryToolbar total={result.total} />
      </Suspense>

      <InventoryTable
        vehicles={vehicles}
        canDelete={canDeleteRecords(user.role)}
        canPublish={canPublish(user.role)}
        baseUrl="/admin/dashboard/inventory"
      />

      {result.totalPages > 1 && (
        <TablePagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
        />
      )}
    </div>
  );
}
