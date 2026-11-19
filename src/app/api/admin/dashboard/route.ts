import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { getDashboardStats } from "@/lib/services/vehicles";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api";

/** GET /api/admin/dashboard — real database statistics + recent vehicles. */
export async function GET() {
  try {
    await requireUser();
    const stats = await getDashboardStats();
    const recent = await db.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        year: true,
        price: true,
        status: true,
        isPublished: true,
        isFeatured: true,
        createdAt: true,
        images: { select: { imageUrl: true, altText: true }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        brand: { select: { name: true } },
      },
    });

    return NextResponse.json({
      stats,
      recentVehicles: recent.map((v) => ({ ...v, price: Number(v.price) })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
