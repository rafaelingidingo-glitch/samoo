import { NextRequest, NextResponse } from "next/server";
import { userUpdateSchema } from "@/lib/validations";
import { requireUser, canManageUsers } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, jsonError, readJson } from "@/lib/api";

/**
 * PATCH /api/admin/users/[id] — update role/name/status/password (SUPER_ADMIN only).
 * Guards: cannot deactivate or demote yourself; cannot deactivate/demote the
 * last active SUPER_ADMIN.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(req);
    const actor = await requireUser();
    if (!canManageUsers(actor.role)) {
      return jsonError(403, "Only Super Admins can manage users.");
    }
    const { id } = await params;

    const body = await readJson(req);
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(400, first?.message || "Invalid user update.");
    }

    const target = await db.user.findUnique({ where: { id } });
    if (!target) return jsonError(404, "User not found.");

    const data = parsed.data;
    if (target.id === actor.id && (data.isActive === false || (data.role && data.role !== "SUPER_ADMIN"))) {
      return jsonError(400, "You cannot deactivate or demote your own account.");
    }

    if (
      (data.isActive === false || (data.role && data.role !== "SUPER_ADMIN")) &&
      target.role === "SUPER_ADMIN" &&
      target.isActive
    ) {
      const activeSuperAdmins = await db.user.count({
        where: { role: "SUPER_ADMIN", isActive: true, id: { not: target.id } },
      });
      if (activeSuperAdmins === 0) {
        return jsonError(
          400,
          "This is the last active Super Admin. Promote another Super Admin before demoting or deactivating this account."
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password !== undefined) updateData.passwordHash = await hashPassword(data.password);

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    await logAudit({
      userId: actor.id,
      userName: actor.name,
      action: "USER_UPDATE",
      entityType: "USER",
      entityId: id,
      details: `Updated ${updated.email} (${updated.role}, active=${updated.isActive}${data.password ? ", password reset" : ""}).`,
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
