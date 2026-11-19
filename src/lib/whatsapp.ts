import { SITE_URL } from "@/lib/env";

/**
 * WhatsApp deep-link helpers.
 *
 * The business WhatsApp number is stored in SiteSetting (default
 * 255710853255) and passed in explicitly — nothing is hardcoded
 * in page components.
 */

export function sanitizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  return digits.replace(/^0+/, "");
}

export function buildWhatsAppUrl(
  whatsappNumber: string,
  message: string
): string {
  const number = sanitizeWhatsAppNumber(whatsappNumber);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const GENERAL_INQUIRY_MESSAGE =
  "Hello Sawee Vintage & Classic Cars. I found you through your website and would like to learn more about your vehicles.";

export const SOLD_INQUIRY_MESSAGE = (vehicleTitle: string) =>
  `Hello Sawee Vintage & Classic Cars. I saw that the ${vehicleTitle} on your website is sold. Do you have similar vehicles available or expected?`;

export function vehicleInquiryMessage(vehicleTitle: string, slug: string): string {
  const vehicleUrl = `${SITE_URL}/inventory/${slug}`;
  return (
    `Hello Sawee Vintage & Classic Cars. I am interested in the ${vehicleTitle} ` +
    `listed on your website. Please share more details about its availability.\n${vehicleUrl}`
  );
}
