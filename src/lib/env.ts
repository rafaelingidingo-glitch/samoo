/**
 * Central environment access.
 * Never import this file from client components.
 */

export const isProd = process.env.NODE_ENV === "production";

/** Absolute site URL used for canonical URLs, sitemap, OG and WhatsApp links. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

/** Local fallback upload directory (used when Cloudinary is not configured). */
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || `${process.cwd()}/uploads`;

export const UPLOAD_MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const UPLOAD_MAX_IMAGES_PER_VEHICLE = 10;
