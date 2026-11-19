import { NextRequest, NextResponse } from "next/server";
import { userCreateSchema } from "@/lib/validations";
import { requireUser, canManageUsers } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, jsonError, readJson } from "@/lib/api";

/**
 * GET /api/admin/users — list users (SUPER_ADMIN only, passwords never returned).
 */
export async function GET() {
  try {
    const actor = await requireUser();
    if (!canManageUsers(actor.role)) {
      return jsonError(403, "Only Super Admins can manage users.");
    }
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/users — create a staff account (SUPER_ADMIN only).
 */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const actor = await requireUser();
    if (!canManageUsers(actor.role)) {
      return jsonError(403, "Only Super Admins can create users.");
    }

    const body = await readJson(req);
    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(400, first?.message || "Invalid user details.");
    }
    const { name, email, password, role } = parsed.data;

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: { name, email: email.toLowerCase(), passwordHash, role, isActive: true },
    });

    await logAudit({
      userId: actor.id,
      userName: actor.name,
      action: "USER_CREATE",
      entityType: "USER",
      entityId: user.id,
      details: `Created ${role} account for ${user.email}.`,
    });

    return NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
