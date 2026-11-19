import { db } from "@/lib/db";
import { deleteImage } from "@/lib/cloudinary";
import { logAudit } from "@/lib/audit";

/**
 * Retryable media cleanup queue.
 * When a Cloudinary (or local) deletion fails, the asset is recorded in
 * PendingMediaDeletion and retried from Admin > Media.
 */

export async function queueMediaDeletions(
  images: { imageUrl: string; publicId: string | null }[]
): Promise<void> {
  for (const image of images) {
    // Prefer the Cloudinary public id; fall back to a local key derived from the URL.
    const identifier = image.publicId ?? (image.imageUrl.startsWith("/api/files/") ? image.imageUrl.replace("/api/files/", "") : image.imageUrl);
    if (!identifier) continue;
    try {
      await db.pendingMediaDeletion.upsert({
        where: { publicId: identifier },
        update: {},
        create: { publicId: identifier },
      });
    } catch (error) {
      console.error("[media-cleanup] failed to queue deletion:", error);
    }
  }
}

/** Processes queued deletions; returns remaining count. */
export async function processPendingDeletions(
  actor?: { id?: string; name?: string }
): Promise<{ processed: number; remaining: number; failures: number }> {
  const pending = await db.pendingMediaDeletion.findMany({
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  let processed = 0;
  let failures = 0;

  for (const item of pending) {
    try {
      await deleteImage(item.publicId, item.publicId.startsWith("vehicles/") ? `/api/files/${item.publicId}` : item.publicId);
      await db.pendingMediaDeletion.delete({ where: { id: item.id } });
      processed += 1;
    } catch (error) {
      failures += 1;
      await db.pendingMediaDeletion.update({
        where: { id: item.id },
        data: {
          attempts: { increment: 1 },
          lastError: error instanceof Error ? error.message.slice(0, 300) : "unknown error",
        },
      });
    }
  }

  if (processed > 0 || failures > 0) {
    await logAudit({
      userId: actor?.id ?? null,
      userName: actor?.name ?? null,
      action: "MEDIA_CLEANUP_RETRY",
      entityType: "MEDIA_CLEANUP",
      details: `Processed ${processed}, failed ${failures}, remaining ${await db.pendingMediaDeletion.count()}`,
    });
  }

  return { processed, remaining: await db.pendingMediaDeletion.count(), failures };
}
