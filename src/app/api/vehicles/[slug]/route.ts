import { NextRequest, NextResponse } from "next/server";
import { getVehicleBySlug } from "@/lib/services/vehicles";
import { handleApiError, jsonError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/guards";

/**
 * GET /api/vehicles/[slug]
 * Public vehicle detail. Draft vehicles are hidden unless a staff session exists.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await getCurrentUser();
    const vehicle = await getVehicleBySlug(slug, Boolean(user));
    if (!vehicle) return jsonError(404, "Vehicle not found.");
    return NextResponse.json({
      ...vehicle,
      price: Number(vehicle.price),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
