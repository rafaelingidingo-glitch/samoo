import { db } from "@/lib/db";

/**
 * Slug utilities — SEO-friendly, unique, URL-safe.
 */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Returns a unique vehicle slug (appends -2, -3, … when needed). */
export async function uniqueVehicleSlug(title: string, year?: number): Promise<string> {
  const base = slugify([title, year].filter(Boolean).join(" "));
  let candidate = base || "vehicle";
  let counter = 1;
  // Bounded loop — practically never exceeded.
  for (let i = 0; i < 50; i++) {
    const existing = await db.vehicle.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return `${base}-${Date.now()}`;
}

export async function uniqueBrandOrCategorySlug(
  base: string,
  kind: "brand" | "category",
  excludeId?: string
): Promise<string> {
  const root = slugify(base) || kind;
  let candidate = root;
  let counter = 1;
  for (let i = 0; i < 50; i++) {
    const existing =
      kind === "brand"
        ? await db.brand.findFirst({
            where: { slug: candidate, id: excludeId ? { not: excludeId } : undefined },
          })
        : await db.category.findFirst({
            where: { slug: candidate, id: excludeId ? { not: excludeId } : undefined },
          });
    if (!existing) return candidate;
    counter += 1;
    candidate = `${root}-${counter}`;
  }
  return `${root}-${Date.now()}`;
}
