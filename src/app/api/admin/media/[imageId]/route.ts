import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { deleteImage } from "@/lib/cloudinary";
import { queueMediaDeletions } from "@/lib/services/media-cleanup";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, jsonError } from "@/lib/api";
import { revalidatePath } from "next/cache";

/**
 * DELETE /api/admin/media/[imageId]
 * Removes a single vehicle image: DB record + storage asset (with
 * retryable cleanup on failure). Editors and above may remove photos.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const { imageId } = await params;

    const image = await db.vehicleImage.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        imageUrl: true,
        publicId: true,
        vehicleId: true,
        vehicle: { select: { title: true } },
      },
    });
    if (!image) return jsonError(404, "Image not found.");

    await db.vehicleImage.delete({ where: { id: imageId } });

    let cleaned = false;
    try {
      await deleteImage(image.publicId, image.imageUrl);
      cleaned = true;
    } catch {
      await queueMediaDeletions([{ imageUrl: image.imageUrl, publicId: image.publicId }]);
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "MEDIA_DELETE",
      entityType: "IMAGE",
      entityId: imageId,
      details: `Removed photo from "${image.vehicle.title}"${cleaned ? " (asset deleted)" : " (cleanup queued)"}.`,
    });
    revalidatePath("/", "layout");

    return NextResponse.json({ ok: true, assetDeleted: cleaned });
  } catch (error) {
    return handleApiError(error);
  }
}
