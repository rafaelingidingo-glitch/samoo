import { NextRequest, NextResponse } from "next/server";
import { vehicleImagesSyncSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth/guards";
import { syncVehicleImages, cleanupVehicleMedia } from "@/lib/services/vehicles";
import { queueMediaDeletions } from "@/lib/services/media-cleanup";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, jsonError, readJson } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

/**
 * PATCH /api/admin/vehicles/[id]/images
 * Replaces the vehicle's ordered image set. Publishing permission is NOT
 * required — editors can manage photos — but deleting images requires the
 * same role level as the write itself.
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
    const parsed = vehicleImagesSyncSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(400, first?.message || "Invalid image data.");
    }

    const vehicle = await db.vehicle.findUnique({
      where: { id },
      select: { id: true, title: true, isPublished: true },
    });
    if (!vehicle) return jsonError(404, "Vehicle not found.");

    const { removed } = await syncVehicleImages(id, parsed.data);

    const cleanup = await cleanupVehicleMedia(removed);
    if (cleanup.failed.length > 0) {
      await queueMediaDeletions(cleanup.failed);
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "VEHICLE_IMAGES_SYNC",
      entityType: "IMAGE",
      entityId: id,
      details: `${vehicle.title}: ${parsed.data.images.length} images set, ${cleanup.succeeded} removed asset(s) cleaned.`,
    });
    revalidatePath("/", "layout");

    return NextResponse.json({ ok: true, removedCleaned: cleanup.succeeded });
  } catch (error) {
    if (error instanceof Error && error.message === "Vehicle not found") {
      return jsonError(404, "Vehicle not found.");
    }
    return handleApiError(error);
  }
}
