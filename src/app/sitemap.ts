import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * XML sitemap — static public routes + every published vehicle.
 * Never includes drafts, sold-anything exclusions are not needed
 * (sold vehicles remain valid public pages).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/inventory`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  try {
    const vehicles = await db.vehicle.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    return [
      ...staticRoutes,
      ...vehicles.map((v) => ({
        url: `${SITE_URL}/inventory/${v.slug}`,
        lastModified: v.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // Database unavailable — still return static routes.
    return staticRoutes;
  }
}
