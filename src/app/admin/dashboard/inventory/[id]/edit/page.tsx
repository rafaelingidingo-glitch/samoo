import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser, canPublish, canFeature } from "@/lib/auth/guards";
import { VehicleForm } from "@/components/admin/vehicle-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Vehicle" };

type Params = Promise<{ id: string }>;

export default async function EditVehiclePage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requirePageUser();
  if (!user) redirect(`/admin/login?next=/admin/dashboard/inventory/${id}/edit`);

  const vehicle = await db.vehicle.findUnique({
    where: { id },
    include: {
      images: { orderBy: [{ sortOrder: "asc" }], select: { imageUrl: true, publicId: true, altText: true } },
    },
  });
  if (!vehicle) notFound();

  const [brands, categories] = await Promise.all([
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">Edit Vehicle</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {vehicle.title} · added{" "}
            {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(vehicle.createdAt)}
          </p>
        </div>
        {vehicle.isPublished && (
          <Link
            href={`/inventory/${vehicle.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-gold"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            View public page
          </Link>
        )}
      </div>

      <VehicleForm
        mode="edit"
        vehicleId={vehicle.id}
        initial={{
          title: vehicle.title,
          brandId: vehicle.brandId,
          model: vehicle.model,
          categoryId: vehicle.categoryId,
          year: vehicle.year,
          price: Number(vehicle.price),
          currency: "TZS",
          mileage: vehicle.mileage ?? "",
          fuelType: vehicle.fuelType ?? "",
          transmission: vehicle.transmission ?? "",
          engineCapacity: vehicle.engineCapacity ?? "",
          condition: vehicle.condition ?? "",
          description: vehicle.description,
          highlights: vehicle.highlights ?? "",
          status: (vehicle.status as "AVAILABLE" | "RESERVED" | "SOLD") || "AVAILABLE",
          isFeatured: vehicle.isFeatured,
          isPublished: vehicle.isPublished,
        }}
        initialImages={vehicle.images.map((img) => ({
          imageUrl: img.imageUrl,
          publicId: img.publicId,
          altText: img.altText ?? "",
        }))}
        brands={brands}
        categories={categories}
        canPublish={canPublish(user.role)}
        canFeature={canFeature(user.role)}
      />
    </div>
  );
}
