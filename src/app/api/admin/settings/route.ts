import { NextRequest, NextResponse } from "next/server";
import { settingsUpdateSchema } from "@/lib/validations";
import { requireUser, canManageSettings } from "@/lib/auth/guards";
import { updateSiteSettings } from "@/lib/settings";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, jsonError, readJson } from "@/lib/api";
import { revalidatePath } from "next/cache";

/**
 * PATCH /api/admin/settings — SUPER_ADMIN only.
 */
export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    if (!canManageSettings(user.role)) {
      return jsonError(403, "Only Super Admins can edit website settings.");
    }

    const body = await readJson(req);
    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(400, first?.message || "Invalid settings data.");
    }

    const settings = await updateSiteSettings(parsed.data);
    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "SETTINGS_UPDATE",
      entityType: "SETTINGS",
      details: "Website settings updated.",
    });
    revalidatePath("/", "layout");

    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}
