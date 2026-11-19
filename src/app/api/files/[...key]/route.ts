import { NextRequest, NextResponse } from "next/server";
import { readLocalFile } from "@/lib/cloudinary";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

/**
 * GET /api/files/[...key]
 * Serves locally-stored uploads (fallback when Cloudinary is not configured).
 * Path traversal is prevented inside readLocalFile.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const file = await readLocalFile(key.join("/"));
  if (!file) {
    return NextResponse.json({ error: { message: "File not found." } }, { status: 404 });
  }
  const name = key[key.length - 1] || "";
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  const mime = MIME_BY_EXT[ext] || "application/octet-stream";

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// Local-driver serving must always be live.
export const dynamic = "force-dynamic";
