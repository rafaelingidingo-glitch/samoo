import { db } from "@/lib/db";

/**
 * Security audit logging. Failures must never break the primary
 * operation — logging is best-effort.
 */
export async function logAudit(entry: {
  userId?: string | null;
  userName?: string | null;
  action: string;
  entityType: "AUTH" | "VEHICLE" | "IMAGE" | "SETTINGS" | "USER" | "MEDIA_CLEANUP";
  entityId?: string | null;
  details?: string | null;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        userName: entry.userName ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        details: entry.details ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log:", error);
  }
}
