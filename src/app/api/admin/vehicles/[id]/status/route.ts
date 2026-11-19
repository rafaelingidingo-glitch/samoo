import { NextRequest, NextResponse } from "next/server";
import { vehicleStatusUpdateSchema } from "@/lib/validations";
import { requireUser, canPublish, canFeature } from "@/lib/auth/guards";
import { updateVehicleStatus } from "@/lib/services/vehicles";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, jsonError, readJson } from "@/lib/api";
import { revalidatePath } from "next/cache";

/**
 * PATCH /api/admin/vehicles/[id]/status
 *
 * Permissions (enforced here, server-side):
 *   - status (Available/Reserved/Sold): EDITOR, ADMIN, SUPER_ADMIN
 *   - publish/unpublish: ADMIN, SUPER_ADMIN
 *   - feature/unfeature: ADMIN, SUPER_ADMIN
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const { id } = await params;

    const body = await readJson(req);
    const parsed = vehicleStatusUpdateSchema.safeParse(body);
    if (!parsed.success) return jsonError(400, "Invalid status payload.");

    const { status, isPublished, isFeatured } = parsed.data;

    if ((isPublished !== undefined) && !canPublish(user.role)) {
      return jsonError(403, "You do not have permission to publish or unpublish vehicles.");
    }
    if (isFeatured !== undefined && !canFeature(user.role)) {
      return jsonError(403, "You do not have permission to feature vehicles.");
    }

    const vehicle = await db.vehicle.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!vehicle) return jsonError(404, "Vehicle not found.");

    await updateVehicleStatus(id, { status, isPublished, isFeatured });

    const parts: string[] = [];
    if (status) parts.push(status);
    if (isPublished !== undefined) parts.push(isPublished ? "PUBLISHED" : "UNPUBLISHED");
    if (isFeatured !== undefined) parts.push(isFeatured ? "FEATURED" : "UNFEATURED");

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: `VEHICLE_STATUS_UPDATE ${parts.join(", ")}`.trim(),
      entityType: "VEHICLE",
      entityId: id,
      details: vehicle.title,
    });
    revalidatePath("/", "layout");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
