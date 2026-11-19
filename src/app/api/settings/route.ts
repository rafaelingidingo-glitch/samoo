import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/settings";
import { handleApiError } from "@/lib/api";

/**
 * GET /api/settings — public business information used by integrations.
 * Contains only contact/business settings; no secrets.
 */
export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({
      businessName: settings.businessName,
      phone: settings.phone,
      whatsappNumber: settings.whatsappNumber,
      instagramUrl: settings.instagramUrl,
      address: settings.address,
      businessHours: settings.businessHours,
      logoUrl: settings.logoUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
