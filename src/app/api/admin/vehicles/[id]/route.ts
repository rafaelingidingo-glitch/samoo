import { NextRequest, NextResponse } from "next/server";
import { vehicleUpdateSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth/guards";
import { updateVehicle, deleteVehicle, cleanupVehicleMedia } from "@/lib/services/vehicles";
import { queueMediaDeletions } from "@/lib/services/media-cleanup";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, jsonError, readJson } from "@/lib/api";
import { revalidatePath } from "next/cache";

/**
 * PATCH /api/admin/vehicles/[id] — update vehicle fields (EDITOR and above).
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
    const parsed = vehicleUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(400, first?.message || "Invalid vehicle data.");
    }

    const vehicle = await updateVehicle(id, parsed.data);
    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "VEHICLE_UPDATE",
      entityType: "VEHICLE",
      entityId: id,
      details: vehicle.title,
    });
    revalidatePath("/", "layout");

    return NextResponse.json({ vehicle: { ...vehicle, price: Number(vehicle.price) } });
  } catch (error) {
    if (error instanceof Error && error.message === "Vehicle not found") {
      return jsonError(404, "Vehicle not found.");
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/vehicles/[id] — delete vehicle + media cleanup (ADMIN and above).
 * Editors may not delete records.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(req);
    const user = await requireUser(["SUPER_ADMIN", "ADMIN"]);
    const { id } = await params;

    const images = await deleteVehicle(id);

    // Best-effort asset cleanup with retryable queue for failures.
    const cleanup = await cleanupVehicleMedia(images);
    if (cleanup.failed.length > 0) {
      await queueMediaDeletions(cleanup.failed);
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "VEHICLE_DELETE",
      entityType: "VEHICLE",
      entityId: id,
      details: `Deleted vehicle and cleaned ${cleanup.succeeded} media asset(s).`,
    });
    revalidatePath("/", "layout");

    return NextResponse.json({ ok: true, cleanedImages: cleanup.succeeded });
  } catch (error) {
    if (error instanceof Error && error.message === "Vehicle not found") {
      return jsonError(404, "Vehicle not found.");
    }
    return handleApiError(error);
  }
}
