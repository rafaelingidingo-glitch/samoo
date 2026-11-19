import { NextResponse } from "next/server";
import { getCategoriesWithCounts } from "@/lib/services/vehicles";
import { handleApiError } from "@/lib/api";

/** GET /api/categories — active categories with published-vehicle counts. */
export async function GET() {
  try {
    const categories = await getCategoriesWithCounts();
    return NextResponse.json({ categories });
  } catch (error) {
    return handleApiError(error);
  }
}
