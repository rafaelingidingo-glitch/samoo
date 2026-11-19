import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, canPublish } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { uniqueBrandOrCategorySlug } from "@/lib/slug";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin, handleApiError, jsonError, readJson } from "@/lib/api";
import { revalidatePath } from "next/cache";

/**
 * POST /api/admin/taxonomy — create a brand or category (ADMIN and above).
 * Body: { kind: "brand" | "category", name, description?, sortOrder? }
 */
const createSchema = z.object({
  kind: z.enum(["brand", "category"]),
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  description: z.string().trim().max(300).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireUser(["SUPER_ADMIN", "ADMIN"]);
    if (!canPublish(user.role)) {
      return jsonError(403, "You do not have permission to manage brands and categories.");
    }

    const body = await readJson(req);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(400, first?.message || "Invalid taxonomy data.");
    }
    const { kind, name, description, sortOrder } = parsed.data;

    // Unique name check
    const existing =
      kind === "brand"
        ? await db.brand.findUnique({ where: { name } })
        : await db.category.findUnique({ where: { name } });
    if (existing) return jsonError(409, `"${name}" already exists.`);

    if (kind === "brand") {
      const brand = await db.brand.create({
        data: { name, slug: await uniqueBrandOrCategorySlug(name, "brand") },
      });
      await logAudit({
        userId: user.id,
        userName: user.name,
        action: "TAXONOMY_CREATE",
        entityType: "VEHICLE",
        entityId: brand.id,
        details: `Created brand "${name}".`,
      });
      revalidatePath("/", "layout");
      return NextResponse.json({ item: brand }, { status: 201 });
    }

    const category = await db.category.create({
      data: {
        name,
        slug: await uniqueBrandOrCategorySlug(name, "category"),
        description: description || null,
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
    });
    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "TAXONOMY_CREATE",
      entityType: "VEHICLE",
      entityId: category.id,
      details: `Created category "${name}".`,
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ item: category }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/admin/taxonomy — update a brand/category.
 * Body: { kind, id, name?, description?, isActive?, sortOrder? }
 */
const updateSchema = z.object({
  kind: z.enum(["brand", "category"]),
  id: z.string().min(1),
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(300).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireUser(["SUPER_ADMIN", "ADMIN"]);
    if (!canPublish(user.role)) {
      return jsonError(403, "You do not have permission to manage brands and categories.");
    }

    const body = await readJson(req);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return jsonError(400, "Invalid taxonomy update.");

    const { kind, id, name, description, isActive, sortOrder } = parsed.data;
    if (kind === "brand") {
      const data: Record<string, unknown> = {};
      if (name) data.name = name;
      await db.brand.update({ where: { id }, data });
    } else {
      const data: Record<string, unknown> = {};
      if (name) data.name = name;
      if (description !== undefined) data.description = description || null;
      if (isActive !== undefined) data.isActive = isActive;
      if (sortOrder !== undefined) data.sortOrder = sortOrder;
      await db.category.update({ where: { id }, data });
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "TAXONOMY_UPDATE",
      entityType: "VEHICLE",
      entityId: id,
      details: `Updated ${kind}.`,
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/taxonomy?id=…&kind=brand|category (ADMIN and above).
 * Refuses to delete when vehicles still reference the record.
 */
export async function DELETE(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireUser(["SUPER_ADMIN", "ADMIN"]);
    if (!canPublish(user.role)) {
      return jsonError(403, "You do not have permission to manage brands and categories.");
    }

    const kind = req.nextUrl.searchParams.get("kind");
    const id = req.nextUrl.searchParams.get("id");
    if ((kind !== "brand" && kind !== "category") || !id) {
      return jsonError(400, "Provide kind and id.");
    }

    if (kind === "brand") {
      const count = await db.vehicle.count({ where: { brandId: id } });
      if (count > 0) {
        return jsonError(
          409,
          `This brand is used by ${count} vehicle(s). Reassign those vehicles first.`
        );
      }
      await db.brand.delete({ where: { id } });
    } else {
      const count = await db.vehicle.count({ where: { categoryId: id } });
      if (count > 0) {
        return jsonError(
          409,
          `This category is used by ${count} vehicle(s). Reassign those vehicles first.`
        );
      }
      await db.category.delete({ where: { id } });
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "TAXONOMY_DELETE",
      entityType: "VEHICLE",
      entityId: id,
      details: `Deleted ${kind}.`,
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
