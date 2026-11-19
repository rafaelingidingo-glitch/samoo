import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { rateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin, getClientIp, handleApiError, jsonError, readJson, ApiError } from "@/lib/api";

/**
 * POST /api/auth/login
 * Rate-limited credential login. Generic error message prevents
 * account enumeration. Sessions are HttpOnly JWT cookies.
 */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);

    const ip = getClientIp(req);
    // Per-IP throttle first (defends against credential stuffing sweeps).
    const ipLimit = rateLimit(`login:ip:${ip}`, 20, 60 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: { message: "Too many login attempts. Please try again later." } },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    const body = await readJson(req);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "Please enter a valid email address and password.");
    }
    const { email, password } = parsed.data;

    const emailKey = email.toLowerCase();
    const emailLimit = rateLimit(`login:email:${ip}:${emailKey}`, 5, 15 * 60 * 1000);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: { message: "Too many attempts for this account. Please wait 15 minutes and try again." } },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSeconds) } }
      );
    }

    const user = await db.user.findUnique({ where: { email: emailKey } });

    // Constant-shape response regardless of which factor failed.
    const invalid = new ApiError(401, "Invalid email or password.");
    if (!user) {
      await logAudit({ action: "LOGIN_FAILED", entityType: "AUTH", details: `unknown email ${emailKey}` });
      throw invalid;
    }
    if (!user.isActive) {
      await logAudit({
        userId: user.id,
        userName: user.name,
        action: "LOGIN_FAILED",
        entityType: "AUTH",
        details: "inactive account",
      });
      throw invalid;
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      await logAudit({
        userId: user.id,
        userName: user.name,
        action: "LOGIN_FAILED",
        entityType: "AUTH",
        details: "wrong password",
      });
      throw invalid;
    }

    resetRateLimit(`login:email:${ip}:${emailKey}`);
    await setSessionCookie({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });
    await logAudit({ userId: user.id, userName: user.name, action: "LOGIN", entityType: "AUTH" });

    return NextResponse.json({ user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return handleApiError(error);
  }
}
