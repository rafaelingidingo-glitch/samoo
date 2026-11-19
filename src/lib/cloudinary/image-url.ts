/**
 * Client-safe image URL helpers.
 * This module has NO Node built-in dependencies so it can be imported
 * from both server and client components.
 */

/**
 * Produces a delivery-optimized URL for Cloudinary assets
 * (auto format + quality + optional width). Local URLs are returned
 * unchanged — next/image handles their optimization.
 */
export function optimizedImageUrl(imageUrl: string, width?: number): string {
  if (!imageUrl.includes("res.cloudinary.com") || !imageUrl.includes("/upload/")) {
    return imageUrl;
  }
  const transforms: string[] = ["f_auto", "q_auto"];
  if (width) transforms.push(`w_${width}`);
  return imageUrl.replace("/upload/", `/upload/${transforms.join(",")}/`);
}

export function isLocalUpload(imageUrl: string): boolean {
  return imageUrl.startsWith("/api/files/");
}
