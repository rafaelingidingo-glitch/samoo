import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import type { SettingsUpdateInput } from "@/lib/validations";

/**
 * Central site settings service.
 *
 * A single SiteSetting row holds all configurable business information.
 * Sensible, client-approved defaults are used when the row (or a field)
 * has not been customized yet.
 */

export type SiteSettings = {
  businessName: string;
  phone: string;
  whatsappNumber: string;
  instagramUrl: string;
  address: string | null;
  businessHours: string | null;
  logoUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  footerNote: string | null;
  heroImageUrl: string | null;
  aboutIntro: string | null;
  aboutStory: string | null;
  aboutMission: string | null;
  aboutVision: string | null;
  aboutCommitment: string | null;
  updatedAt: Date | null;
};

/**
 * REAL business information provided by the client.
 * Null values mean "not provided yet" and are rendered as
 * placeholders / hidden until the client approves content.
 */
export const DEFAULT_SETTINGS: Omit<SiteSettings, "updatedAt"> = {
  businessName: "SAWEE CARS",
  phone: "+255710853255",
  whatsappNumber: "255710853255",
  instagramUrl: "https://www.instagram.com/sawee_oldcarstz/",
  address: null,
  businessHours: null,
  logoUrl: null,
  metaTitle: null,
  metaDescription: null,
  footerNote: null,
  heroImageUrl: null,
  aboutIntro: null,
  aboutStory: null,
  aboutMission: null,
  aboutVision: null,
  aboutCommitment: null,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await db.siteSetting.findUnique({
    where: { id: "singleton" },
  });

  if (!row) return { ...DEFAULT_SETTINGS, updatedAt: null };

  const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const value = (row as unknown as Record<string, unknown>)[key];
    if (value !== null && value !== undefined && value !== "") {
      settings[key] = value;
    }
  }
  return { ...(settings as unknown as Omit<SiteSettings, "updatedAt">), updatedAt: row.updatedAt };
}

/**
 * Columns that cannot store NULL (schema-level NOT NULL with defaults).
 * For these, null/empty input is ignored so the previous value is kept.
 */
const NON_NULLABLE_SETTING_KEYS = new Set([
  "businessName",
  "phone",
  "whatsappNumber",
  "instagramUrl",
]);

/**
 * Updates the singleton settings row from validated form input.
 * `null`/empty values are stored as NULL for nullable columns (clearing
 * the override so defaults apply again) and skipped for non-nullable ones.
 */
export async function updateSiteSettings(
  data: SettingsUpdateInput
): Promise<SiteSettings> {
  const updateData: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    const isEmpty = value === null || (typeof value === "string" && value.trim() === "");
    if (isEmpty) {
      if (!NON_NULLABLE_SETTING_KEYS.has(key)) updateData[key] = null;
      continue;
    }
    updateData[key] = value as string;
  }

  const row = await db.siteSetting.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      ...DEFAULT_SETTINGS,
      ...updateData,
    } as Prisma.SiteSettingUncheckedCreateInput,
    update: updateData as Prisma.SiteSettingUncheckedUpdateInput,
  });

  // Settings affect header/footer/contact across the site.
  revalidatePath("/", "layout");

  const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const value = (row as unknown as Record<string, unknown>)[key];
    if (value !== null && value !== undefined && value !== "") {
      settings[key] = value;
    }
  }
  return { ...(settings as unknown as Omit<SiteSettings, "updatedAt">), updatedAt: row.updatedAt };
}
