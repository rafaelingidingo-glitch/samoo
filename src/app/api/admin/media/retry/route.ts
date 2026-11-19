import { NextRequest, NextResponse } from "next/server";
import { requireUser, canDeleteRecords } from "@/lib/auth/guards";
import { processPendingDeletions } from "@/lib/services/media-cleanup";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api";

/**
 * GET /api/admin/media/retry — list pending media deletions.
 * POST /api/admin/media/retry — process the queue now (ADMIN and above).
 */
export async function GET() {
  try {
    await requireUser();
    const pending = await db.pendingMediaDeletion.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      pending: pending.map((p) => ({
        id: p.id,
        publicId: p.publicId,
        attempts: p.attempts,
        lastError: p.lastError,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireUser(["SUPER_ADMIN", "ADMIN"]);
    if (!canDeleteRecords(actor.role)) {
      return NextResponse.json(
        { error: { message: "You do not have permission to run media cleanup." } },
        { status: 403 }
      );
    }
    const result = await processPendingDeletions({ id: actor.id, name: actor.name });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
