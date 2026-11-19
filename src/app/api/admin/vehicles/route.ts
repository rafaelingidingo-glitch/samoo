import { NextRequest, NextResponse } from "next/server";
import { vehicleCreateSchema, publicVehicleQuerySchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth/guards";
import { createVehicle, getAdminVehicles } from "@/lib/services/vehicles";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, jsonError, readJson } from "@/lib/api";
import { revalidatePath } from "next/cache";

/**
 * POST /api/admin/vehicles — create a vehicle (EDITOR and above).
 */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();

    const body = await readJson(req);
    const parsed = vehicleCreateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(400, first?.message || "Invalid vehicle data.");
    }

    const vehicle = await createVehicle(parsed.data);
    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "VEHICLE_CREATE",
      entityType: "VEHICLE",
      entityId: vehicle.id,
      details: vehicle.title,
    });
    revalidatePath("/", "layout");

    return NextResponse.json({ vehicle: { ...vehicle, price: Number(vehicle.price) } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/admin/vehicles — admin inventory listing with filters.
 * Accepts admin query params, falls back to public schema fields.
 */
export async function GET(req: NextRequest) {
  try {
    await requireUser();

    const params = req.nextUrl.searchParams;
    const raw: Record<string, string> = {};
    for (const key of ["q", "status", "publishState", "featured", "sort", "page"]) {
      const v = params.get(key);
      if (v) raw[key] = v;
    }
    const parsed = publicVehicleQuerySchema.pick({ sort: true, page: true }).safeParse({
      sort: raw.sort || "newest",
      page: raw.page || "1",
    });
    if (!parsed.success) return jsonError(400, "Invalid query parameters.");

    const result = await getAdminVehicles({
      q: raw.q,
      status: raw.status as "AVAILABLE" | "RESERVED" | "SOLD" | undefined,
      publishState: raw.publishState as "published" | "draft" | undefined,
      featured: raw.featured as "featured" | "not_featured" | undefined,
      sort: parsed.data.sort,
      page: parsed.data.page,
    });

    const items = result.items.map((v) => ({ ...v, price: Number(v.price) }));
    return NextResponse.json({ ...result, items });
  } catch (error) {
    return handleApiError(error);
  }
}
