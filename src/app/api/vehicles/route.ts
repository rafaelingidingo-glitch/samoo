import { NextRequest, NextResponse } from "next/server";
import { publicVehicleQuerySchema } from "@/lib/validations";
import { getPublishedVehicles } from "@/lib/services/vehicles";
import { handleApiError } from "@/lib/api";

/**
 * GET /api/vehicles
 * Public, paginated inventory listing. Only published vehicles.
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const raw: Record<string, string> = {};
    for (const key of ["q", "brand", "category", "minPrice", "maxPrice", "year", "transmission", "fuel", "availability", "sort", "page"]) {
      const v = params.get(key);
      if (v) raw[key] = v;
    }
    const parsed = publicVehicleQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid query parameters." } },
        { status: 400 }
      );
    }
    const result = await getPublishedVehicles(parsed.data);
    // Prices as numbers for JSON consumers.
    const items = result.items.map((v) => ({ ...v, price: Number(v.price) }));
    return NextResponse.json({ ...result, items });
  } catch (error) {
    return handleApiError(error);
  }
}
