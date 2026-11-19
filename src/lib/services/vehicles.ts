import { Prisma, type PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { deleteImage } from "@/lib/cloudinary";
import { uniqueVehicleSlug } from "@/lib/slug";
import type {
  AdminVehicleQuery,
  PublicVehicleQuery,
  VehicleCreateInput,
  VehicleImagesSyncInput,
  VehicleStatusInput,
  VehicleUpdateInput,
} from "@/lib/validations";
import type { AdminStats, Paginated, VehicleCardData, VehicleDetailData } from "@/types";

/**
 * Vehicle data-access service.
 * All queries are shaped to avoid N+1 (single include for brand/category/images).
 */

const VEHICLE_CARD_INCLUDE = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: {
    select: { id: true, imageUrl: true, publicId: true, altText: true, sortOrder: true, isPrimary: true },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
  },
} satisfies Prisma.VehicleInclude;

export const PER_PAGE = 12;
export const ADMIN_PER_PAGE = 10;

function sortClause(sort: string): Prisma.VehicleOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "price_asc":
      return [{ price: "asc" }, { createdAt: "desc" }];
    case "price_desc":
      return [{ price: "desc" }, { createdAt: "desc" }];
    case "year_desc":
      return [{ year: "desc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

// ------------------------------------------------------------------
// Public queries (published vehicles only)
// ------------------------------------------------------------------
export async function getPublishedVehicles(
  query: PublicVehicleQuery
): Promise<Paginated<VehicleCardData>> {
  const perPage = PER_PAGE;
  const page = query.page;

  const where: Prisma.VehicleWhereInput = {
    isPublished: true,
  };

  if (query.q) {
    const q = query.q;
    const yearAsNumber = Number(q);
    const yearExact =
      Number.isInteger(yearAsNumber) && yearAsNumber >= 1900 && yearAsNumber <= 2100
        ? yearAsNumber
        : -1;
    where.OR = [
      { title: { contains: q } },
      { model: { contains: q } },
      { brand: { name: { contains: q } } },
      { year: yearExact },
    ];
  }
  if (query.brand) where.brand = { slug: query.brand };
  if (query.category) where.category = { slug: query.category };
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {
      ...(query.minPrice !== undefined ? { gte: new Prisma.Decimal(query.minPrice) } : {}),
      ...(query.maxPrice !== undefined ? { lte: new Prisma.Decimal(query.maxPrice) } : {}),
    };
  }
  if (query.year) where.year = query.year;
  if (query.transmission) where.transmission = query.transmission;
  if (query.fuel) where.fuelType = query.fuel;
  if (query.availability) where.status = query.availability;

  const [total, items] = await Promise.all([
    db.vehicle.count({ where }),
    db.vehicle.findMany({
      where,
      include: VEHICLE_CARD_INCLUDE,
      orderBy: sortClause(query.sort),
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    items: items as VehicleCardData[],
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getFeaturedVehicles(limit = 6): Promise<VehicleCardData[]> {
  const items = await db.vehicle.findMany({
    where: { isPublished: true, isFeatured: true },
    include: VEHICLE_CARD_INCLUDE,
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });
  return items as VehicleCardData[];
}

export async function getLatestVehicles(limit = 4): Promise<VehicleCardData[]> {
  const items = await db.vehicle.findMany({
    where: { isPublished: true },
    include: VEHICLE_CARD_INCLUDE,
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });
  return items as VehicleCardData[];
}

export async function getVehicleBySlug(
  slug: string,
  includeUnpublished = false
): Promise<VehicleDetailData | null> {
  const item = await db.vehicle.findFirst({
    where: { slug, ...(includeUnpublished ? {} : { isPublished: true }) },
    include: VEHICLE_CARD_INCLUDE,
  });
  return (item as VehicleDetailData) ?? null;
}

export async function getRelatedVehicles(
  vehicle: VehicleDetailData,
  limit = 3
): Promise<VehicleCardData[]> {
  const where: Prisma.VehicleWhereInput = {
    isPublished: true,
    id: { not: vehicle.id },
  };
  const related = await db.vehicle.findMany({
    where: {
      ...where,
      ...(vehicle.categoryId ? { categoryId: vehicle.categoryId } : {}),
    },
    include: VEHICLE_CARD_INCLUDE,
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });

  if (related.length >= limit) return related as VehicleCardData[];

  // Fill remainder with same-brand vehicles.
  const excludeIds = [vehicle.id, ...related.map((r) => r.id)];
  const fill = await db.vehicle.findMany({
    where: {
      isPublished: true,
      id: { notIn: excludeIds },
      brandId: vehicle.brandId,
    },
    include: VEHICLE_CARD_INCLUDE,
    orderBy: [{ createdAt: "desc" }],
    take: limit - related.length,
  });

  return [...related, ...fill] as VehicleCardData[];
}

export async function getCategoriesWithCounts() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const counts = await db.vehicle.groupBy({
    by: ["categoryId"],
    where: { isPublished: true },
    _count: { id: true },
  });
  const countMap = new Map(counts.map((c) => [c.categoryId, c._count.id]));
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    vehicleCount: countMap.get(c.id) ?? 0,
  }));
}

export async function getBrandsWithCounts() {
  const brands = await db.brand.findMany({ orderBy: { name: "asc" } });
  const counts = await db.vehicle.groupBy({
    by: ["brandId"],
    where: { isPublished: true },
    _count: { id: true },
  });
  const countMap = new Map(counts.map((c) => [c.brandId, c._count.id]));
  return brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    vehicleCount: countMap.get(b.id) ?? 0,
  }));
}

export async function getActiveYears(): Promise<number[]> {
  const rows = await db.vehicle.findMany({
    where: { isPublished: true },
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" },
  });
  return rows.map((r) => r.year);
}

// ------------------------------------------------------------------
// Admin queries
// ------------------------------------------------------------------
export async function getAdminVehicles(
  query: AdminVehicleQuery
): Promise<Paginated<VehicleCardData>> {
  const perPage = ADMIN_PER_PAGE;
  const page = query.page;

  const where: Prisma.VehicleWhereInput = {};
  if (query.q) {
    where.OR = [
      { title: { contains: query.q } },
      { model: { contains: query.q } },
      { brand: { name: { contains: query.q } } },
    ];
  }
  if (query.status) where.status = query.status;
  if (query.publishState === "published") where.isPublished = true;
  if (query.publishState === "draft") where.isPublished = false;
  if (query.featured === "featured") where.isFeatured = true;
  if (query.featured === "not_featured") where.isFeatured = false;

  const [total, items] = await Promise.all([
    db.vehicle.count({ where }),
    db.vehicle.findMany({
      where,
      include: VEHICLE_CARD_INCLUDE,
      orderBy: sortClause(query.sort),
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    items: items as VehicleCardData[],
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getVehicleById(id: string): Promise<VehicleDetailData | null> {
  const item = await db.vehicle.findUnique({
    where: { id },
    include: {
      ...VEHICLE_CARD_INCLUDE,
      images: {
        select: { id: true, imageUrl: true, publicId: true, altText: true, sortOrder: true, isPrimary: true },
        orderBy: [{ sortOrder: "asc" }],
      },
    },
  });
  return (item as VehicleDetailData) ?? null;
}

export async function getDashboardStats(): Promise<AdminStats> {
  const [totalVehicles, available, reserved, sold, published, drafts, featured] =
    await Promise.all([
      db.vehicle.count(),
      db.vehicle.count({ where: { status: "AVAILABLE" } }),
      db.vehicle.count({ where: { status: "RESERVED" } }),
      db.vehicle.count({ where: { status: "SOLD" } }),
      db.vehicle.count({ where: { isPublished: true } }),
      db.vehicle.count({ where: { isPublished: false } }),
      db.vehicle.count({ where: { isFeatured: true } }),
    ]);
  return { totalVehicles, available, reserved, sold, published, drafts, featured };
}

// ------------------------------------------------------------------
// Admin mutations
// ------------------------------------------------------------------
function parseHighlights(highlights?: string | null): string | null {
  if (!highlights) return null;
  const cleaned = highlights
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
  return cleaned || null;
}

function priceToDecimal(price: number): Prisma.Decimal {
  return new Prisma.Decimal(price);
}

export async function createVehicle(
  input: VehicleCreateInput
): Promise<VehicleDetailData> {
  const slug = await uniqueVehicleSlug(input.title, input.year);
  const images = normalizeImages(input.images);

  const vehicle = await db.vehicle.create({
    data: {
      title: input.title,
      slug,
      brandId: input.brandId,
      model: input.model,
      categoryId: input.categoryId || null,
      year: input.year,
      price: priceToDecimal(input.price),
      currency: input.currency,
      mileage: input.mileage ?? null,
      fuelType: input.fuelType ?? null,
      transmission: input.transmission ?? null,
      engineCapacity: input.engineCapacity ?? null,
      condition: input.condition ?? null,
      description: input.description,
      highlights: parseHighlights(input.highlights),
      status: input.status,
      isFeatured: input.isFeatured,
      isPublished: input.isPublished,
      images: {
        create: images.map((img) => ({
          imageUrl: img.imageUrl,
          publicId: img.publicId ?? null,
          altText: img.altText ?? null,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
        })),
      },
    },
    include: VEHICLE_CARD_INCLUDE,
  });
  return vehicle as VehicleDetailData;
}

export async function updateVehicle(
  id: string,
  input: VehicleUpdateInput
): Promise<VehicleDetailData> {
  const existing = await db.vehicle.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!existing) throw new Error("Vehicle not found");

  const data: Prisma.VehicleUpdateInput = {
    title: input.title,
    brand: { connect: { id: input.brandId } },
    model: input.model,
    category: input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true },
    year: input.year,
    price: priceToDecimal(input.price),
    currency: input.currency,
    mileage: input.mileage ?? null,
    fuelType: input.fuelType ?? null,
    transmission: input.transmission ?? null,
    engineCapacity: input.engineCapacity ?? null,
    condition: input.condition ?? null,
    description: input.description,
    highlights: parseHighlights(input.highlights),
    status: input.status,
    isFeatured: input.isFeatured,
    isPublished: input.isPublished,
  };

  const vehicle = await db.vehicle.update({
    where: { id },
    data,
    include: VEHICLE_CARD_INCLUDE,
  });
  return vehicle as VehicleDetailData;
}

export async function updateVehicleStatus(
  id: string,
  input: VehicleStatusInput
): Promise<void> {
  await db.vehicle.update({
    where: { id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
      ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
    },
  });
}

/**
 * Deletes a vehicle and schedules/perform media cleanup.
 * Returns the image list so the caller can queue failed deletions.
 */
export async function deleteVehicle(
  id: string
): Promise<{ images: { imageUrl: string; publicId: string | null }[] }> {
  const vehicle = await db.vehicle.findUnique({
    where: { id },
    include: {
      images: { select: { imageUrl: true, publicId: true } },
    },
  });
  if (!vehicle) throw new Error("Vehicle not found");

  const images = vehicle.images.map((i) => ({ imageUrl: i.imageUrl, publicId: i.publicId }));

  await db.vehicle.delete({ where: { id } });

  // Best-effort media cleanup. Failures are queued for retry by the caller.
  return images;
}

/** Attempts media cleanup for a list of images; returns the failed ones. */
export async function cleanupVehicleMedia(
  images: { imageUrl: string; publicId: string | null }[]
): Promise<{ failed: { imageUrl: string; publicId: string | null }[]; succeeded: number }> {
  const failed: { imageUrl: string; publicId: string | null }[] = [];
  let succeeded = 0;

  for (const image of images) {
    try {
      await deleteImage(image.publicId, image.imageUrl);
      succeeded += 1;
    } catch {
      failed.push(image);
    }
  }
  return { failed, succeeded };
}

export async function syncVehicleImages(
  vehicleId: string,
  input: VehicleImagesSyncInput
): Promise<{ removed: { imageUrl: string; publicId: string | null }[] }> {
  const vehicle = await db.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true },
  });
  if (!vehicle) throw new Error("Vehicle not found");

  const result = await db.$transaction(async (tx: PrismaClient) => {
    const existing = await tx.vehicleImage.findMany({
      where: { vehicleId },
      select: { id: true, imageUrl: true, publicId: true },
    });

    const desiredUrls = new Set(input.images.map((i) => i.imageUrl));
    const removed = existing.filter((e) => !desiredUrls.has(e.imageUrl));

    // Replace the whole ordered set (small N — simplest correct approach).
    await tx.vehicleImage.deleteMany({ where: { vehicleId } });
    if (input.images.length > 0) {
      await tx.vehicleImage.createMany({
        data: input.images.map((img, idx) => ({
          vehicleId,
          imageUrl: img.imageUrl,
          publicId: img.publicId ?? null,
          altText: img.altText ?? null,
          sortOrder: img.sortOrder ?? idx,
          isPrimary: img.isPrimary,
        })),
      });
    }
    return removed;
  });

  return { removed: result.map((r) => ({ imageUrl: r.imageUrl, publicId: r.publicId })) };
}

function normalizeImages(
  images: VehicleCreateInput["images"]
): { imageUrl: string; publicId?: string | null; altText?: string | null; sortOrder: number; isPrimary: boolean }[] {
  if (images.length === 0) return [];
  // Exactly one primary: first image is primary when none flagged.
  const anyPrimary = images.some((i) => i.isPrimary);
  return images.map((img, idx) => ({
    imageUrl: img.imageUrl,
    publicId: img.publicId ?? null,
    altText: img.altText ?? null,
    sortOrder: img.sortOrder ?? idx,
    isPrimary: anyPrimary ? img.isPrimary : idx === 0,
  }));
}
