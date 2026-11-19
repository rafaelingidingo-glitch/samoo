import { NextRequest, NextResponse } from "next/server";
import { setupSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin, getClientIp, handleApiError, jsonError, readJson } from "@/lib/api";

/**
 * POST /api/auth/setup
 *
 * Secure first-administrator provisioning.
 * - Works ONLY while the users table is empty.
 * - Once any user exists this endpoint permanently refuses to create users.
 * - Rate limited; no default/hardcoded passwords.
 */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);

    const ip = getClientIp(req);
    const limit = rateLimit(`setup:${ip}`, 10, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: { message: "Too many attempts. Please try again later." } },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const existingUsers = await db.user.count();
    if (existingUsers > 0) {
      return jsonError(
        403,
        "Setup has already been completed. Ask an administrator to create additional accounts from the dashboard."
      );
    }

    const body = await readJson(req);
    const parsed = setupSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(400, first?.message || "Invalid registration details.");
    }
    const { name, email, password } = parsed.data;

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "SETUP_SUPER_ADMIN_CREATED",
      entityType: "USER",
      entityId: user.id,
    });

    await setSessionCookie({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });

    return NextResponse.json({ ok: true, user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return handleApiError(error);
  }
}
