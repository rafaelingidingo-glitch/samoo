import { NextResponse } from "next/server";
import { getBrandsWithCounts } from "@/lib/services/vehicles";
import { handleApiError } from "@/lib/api";

/** GET /api/brands — brands with published-vehicle counts. */
export async function GET() {
  try {
    const brands = await getBrandsWithCounts();
    return NextResponse.json({ brands });
  } catch (error) {
    return handleApiError(error);
  }
}
