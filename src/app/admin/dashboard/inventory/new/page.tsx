import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageUser, canPublish, canFeature } from "@/lib/auth/guards";
import { VehicleForm } from "@/components/admin/vehicle-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add Vehicle" };

export default async function NewVehiclePage() {
  const user = await requirePageUser();
  if (!user) redirect("/admin/login?next=/admin/dashboard/inventory/new");

  const [brands, categories] = await Promise.all([
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">Add Vehicle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the details, upload photographs, then save as a draft or publish immediately.
        </p>
      </div>

      <VehicleForm
        mode="create"
        initial={{
          title: "",
          brandId: "",
          model: "",
          categoryId: null,
          year: "",
          price: "",
          currency: "TZS",
          mileage: "",
          fuelType: "",
          transmission: "",
          engineCapacity: "",
          condition: "",
          description: "",
          highlights: "",
          status: "AVAILABLE",
          isFeatured: false,
          isPublished: canPublish(user.role),
        }}
        initialImages={[]}
        brands={brands}
        categories={categories}
        canPublish={canPublish(user.role)}
        canFeature={canFeature(user.role)}
      />
    </div>
  );
}
