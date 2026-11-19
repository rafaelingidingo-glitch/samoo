import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { uploadImage } from "@/lib/cloudinary";
import { logAudit } from "@/lib/audit";
import { UPLOAD_MAX_BYTES, UPLOAD_MAX_IMAGES_PER_VEHICLE } from "@/lib/env";
import { assertSameOrigin, handleApiError, jsonError } from "@/lib/api";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

/**
 * GET /api/admin/uploads — storage driver status for the admin UI.
 */
export async function GET() {
  try {
    await requireUser();
    return NextResponse.json({
      provider: isCloudinaryConfigured() ? "cloudinary" : "local",
      configured: isCloudinaryConfigured(),
      maxFileBytes: UPLOAD_MAX_BYTES,
      maxImagesPerVehicle: UPLOAD_MAX_IMAGES_PER_VEHICLE,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/**
 * POST /api/admin/uploads
 * Server-side upload endpoint (EDITOR and above).
 *
 * The client posts multipart/form-data with one or more `file` fields.
 * Validation happens here: MIME allow-list + 8 MB per-file limit.
 * When Cloudinary is configured, files are uploaded with a server-generated
 * signature — the API secret never reaches the browser.
 */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();

    const form = await req.formData();
    const files = form.getAll("file").filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return jsonError(400, "No files were provided.");
    }

    const results: {
      imageUrl: string;
      publicId: string | null;
      altText: string;
    }[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return jsonError(
          400,
          `"${file.name}" is not a supported image. Allowed: JPEG, PNG, WebP, AVIF.`
        );
      }
      if (file.size > UPLOAD_MAX_BYTES) {
        return jsonError(
          400,
          `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB — the maximum is 8 MB.`
        );
      }
      if (file.size === 0) {
        return jsonError(400, `"${file.name}" is empty.`);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        const uploaded = await uploadImage(buffer, file.type, file.name);
        results.push({
          imageUrl: uploaded.imageUrl,
          publicId: uploaded.publicId,
          altText: file.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 280),
        });
      } catch (err) {
        console.error("[uploads] provider error:", err);
        return jsonError(
          502,
          `Upload of "${file.name}" failed. The image storage provider did not accept the file — please retry.`
        );
      }
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "MEDIA_UPLOAD",
      entityType: "IMAGE",
      details: `${results.length} file(s) uploaded.`,
    });

    return NextResponse.json({ images: results }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
