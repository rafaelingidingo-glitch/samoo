import crypto from "crypto";
import { mkdir, writeFile, unlink, readFile, stat } from "fs/promises";
import path from "path";
import "server-only";
import { UPLOAD_DIR, isProd } from "@/lib/env";
import { optimizedImageUrl, isLocalUpload } from "@/lib/cloudinary/image-url";

// Re-export client-safe helpers so server code can import everything from one place.
export { optimizedImageUrl, isLocalUpload };

/**
 * Image storage abstraction.
 *
 * 1. CLOUDINARY (production) — when CLOUDINARY_CLOUD_NAME / API_KEY /
 *    API_SECRET are configured, uploads are performed server-side using
 *    Cloudinary signed uploads. The API secret never leaves the server.
 *
 * 2. LOCAL (development fallback) — when Cloudinary is not configured,
 *    images are stored under the configured UPLOAD_DIR and served through
 *    /api/files/[...key]. The admin dashboard shows which driver is active.
 *
 * Both drivers return a public `imageUrl` usable by next/image and a
 * `publicId` used for deletion (null for local files).
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "saweecars/vehicles";

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

export type UploadResult = {
  imageUrl: string;
  publicId: string | null;
  provider: "cloudinary" | "local";
  width?: number;
  height?: number;
};

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  error?: { message: string };
};

// ------------------------------------------------------------------
// Cloudinary signed upload (REST API, no SDK dependency)
// ------------------------------------------------------------------
function signParams(params: Record<string, string>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto
    .createHash("sha1")
    .update(`${toSign}${API_SECRET}`)
    .digest("hex");
}

async function cloudinaryUpload(
  buffer: Buffer,
  filename: string
): Promise<UploadResult> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params: Record<string, string> = {
    folder: CLOUDINARY_FOLDER,
    timestamp,
  };
  const signature = signParams(params);

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]), filename);
  form.append("api_key", API_KEY as string);
  form.append("timestamp", timestamp);
  form.append("folder", CLOUDINARY_FOLDER);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  );

  const data = (await res.json()) as CloudinaryUploadResponse;
  if (!res.ok || data.error || !data.secure_url) {
    throw new Error(
      data.error?.message || "Cloudinary upload failed. Please retry."
    );
  }

  return {
    imageUrl: data.secure_url,
    publicId: data.public_id,
    provider: "cloudinary",
    width: data.width,
    height: data.height,
  };
}

export async function cloudinaryDestroy(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signParams({
    public_id: publicId,
    timestamp,
    invalidate: "true",
  });

  const form = new FormData();
  form.append("api_key", API_KEY as string);
  form.append("timestamp", timestamp);
  form.append("public_id", publicId);
  form.append("invalidate", "true");
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
    { method: "POST", body: form }
  );
  const data = (await res.json()) as { result?: string; error?: { message: string } };
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || "Cloudinary destroy failed.");
  }
  if (data.result !== "ok" && data.result !== "not found") {
    throw new Error(`Unexpected Cloudinary destroy result: ${data.result}`);
  }
}

// ------------------------------------------------------------------
// Local fallback storage
// ------------------------------------------------------------------
const ALLOWED_EXT = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
]);

function safeKey(key: string): string {
  // Prevent path traversal; keys are <subdir>/<filename> only.
  const cleaned = key.replace(/\\/g, "/").split("/").filter((p) => p && p !== "." && p !== "..");
  return cleaned.join("/");
}

async function localUpload(buffer: Buffer, mime: string): Promise<UploadResult> {
  const ext = ALLOWED_EXT.get(mime) || ".jpg";
  const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  const relKey = `vehicles/${name}`;
  const abs = path.join(UPLOAD_DIR, relKey);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buffer);
  return { imageUrl: `/api/files/${relKey}`, publicId: null, provider: "local" };
}

export async function readLocalFile(key: string): Promise<Buffer | null> {
  const rel = safeKey(key);
  if (!rel) return null;
  const abs = path.join(UPLOAD_DIR, rel);
  // Ensure the resolved path stays inside UPLOAD_DIR.
  if (!path.resolve(abs).startsWith(path.resolve(UPLOAD_DIR))) return null;
  try {
    const s = await stat(abs);
    if (!s.isFile()) return null;
    return await readFile(abs);
  } catch {
    return null;
  }
}

export async function localDelete(key: string): Promise<void> {
  const rel = safeKey(key);
  if (!rel) return;
  const abs = path.join(UPLOAD_DIR, rel);
  if (!path.resolve(abs).startsWith(path.resolve(UPLOAD_DIR))) return;
  try {
    await unlink(abs);
  } catch {
    /* already gone — treat as success */
  }
}

// ------------------------------------------------------------------
// Public API of the storage layer
// ------------------------------------------------------------------
export async function uploadImage(
  buffer: Buffer,
  mime: string,
  filename = "upload.jpg"
): Promise<UploadResult> {
  if (isCloudinaryConfigured()) {
    return cloudinaryUpload(buffer, filename);
  }
  if (isProd) {
    console.warn(
      "[cloudinary] Not configured in production — falling back to local storage."
    );
  }
  return localUpload(buffer, mime);
}

/**
 * Deletes an asset. `publicId` is the Cloudinary public id when the asset
 * came from Cloudinary; for local assets pass the local key.
 * Throws on failure so the caller can queue a retry.
 */
export async function deleteImage(
  publicId: string | null,
  imageUrl: string
): Promise<void> {
  if (publicId && isCloudinaryConfigured()) {
    await cloudinaryDestroy(publicId);
    return;
  }
  if (imageUrl.startsWith("/api/files/")) {
    await localDelete(imageUrl.replace("/api/files/", ""));
    return;
  }
  // Unknown/foreign URL — nothing to clean up.
}

/**
 * Delivery-optimized URL helper moved to ./image-url (client-safe).
 */

export type StorageStatus = {
  provider: "cloudinary" | "local";
  configured: boolean;
};

export function storageStatus(): StorageStatus {
  return {
    provider: isCloudinaryConfigured() ? "cloudinary" : "local",
    configured: isCloudinaryConfigured(),
  };
}
