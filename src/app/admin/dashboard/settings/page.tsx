import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { requirePageUser, canManageSettings } from "@/lib/auth/guards";
import { getSiteSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { getBrandsWithCounts } from "@/lib/services/vehicles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const user = await requirePageUser();
  if (!user) redirect("/admin/login?next=/admin/dashboard/settings");

  const settings = await getSiteSettings();

  const isSuperAdmin = canManageSettings(user.role);

  const allBrands = await getBrandsWithCounts();
  const allCategories = await db_categoriesAll();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Central configuration — contact details, content copy, categories and brands.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated: {settings.updatedAt ? formatDateTime(settings.updatedAt) : "never"}
        </p>
      </div>

      <Card className="border-border shadow-none py-0">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-base font-bold uppercase tracking-tight">
            Categories &amp; Brands
          </CardTitle>
          <CardDescription>
            Master data for the vehicle form and public filters. Brands used by vehicles
            cannot be deleted; categories can be hidden without deletion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaxonomyManager brands={allBrands} categories={allCategories} />
        </CardContent>
      </Card>

      {isSuperAdmin ? (
        <SettingsForm settings={settings} />
      ) : (
        <Card className="border-border shadow-none py-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-heading text-base font-bold uppercase tracking-tight">
              <ShieldAlert className="h-5 w-5 text-amber-600" aria-hidden />
              Website settings — restricted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Business information and website content can only be edited by a{" "}
              <strong>Super Admin</strong>. Ask a Super Admin if something here needs to be
              changed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Admin sees every category (including hidden) with counts of published vehicles. */
async function db_categoriesAll() {
  const { db } = await import("@/lib/db");
  const cats = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const counts = await db.vehicle.groupBy({
    by: ["categoryId"],
    where: { isPublished: true },
    _count: { id: true },
  });
  const map = new Map(counts.map((c) => [c.categoryId, c._count.id]));
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    isActive: c.isActive,
    vehicleCount: map.get(c.id) ?? 0,
  }));
}
