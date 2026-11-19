import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, readSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin, handleApiError } from "@/lib/api";

/** POST /api/auth/logout — clears the session cookie and audits the event. */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await readSession();
    await clearSessionCookie();
    if (session) {
      await logAudit({
        userId: session.sub,
        userName: session.name,
        action: "LOGOUT",
        entityType: "AUTH",
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
