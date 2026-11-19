import Link from "next/link";
import { Cloud, HardDrive, Info, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { storageStatus } from "@/lib/cloudinary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MediaLibrary, RetryCleanupButton } from "@/components/admin/media-library";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media" };

export default async function AdminMediaPage() {
  const user = await requirePageUser();
  if (!user) redirect("/admin/login?next=/admin/dashboard/media");

  const [images, pending] = await Promise.all([
    db.vehicleImage.findMany({
      orderBy: [{ sortOrder: "asc" }],
      select: {
        id: true,
        imageUrl: true,
        publicId: true,
        altText: true,
        sortOrder: true,
        vehicleId: true,
        vehicle: { select: { id: true, title: true, slug: true } },
      },
    }),
    db.pendingMediaDeletion.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const status = storageStatus();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">Media</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every vehicle photograph in one place, with safe storage cleanup.
        </p>
      </div>

      {/* Storage status */}
      <Card className="border-border shadow-none py-0">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary">
              {status.provider === "cloudinary" ? (
                <Cloud className="h-5 w-5 text-gold-dark" aria-hidden />
              ) : (
                <HardDrive className="h-5 w-5 text-gold-dark" aria-hidden />
              )}
            </span>
            <div>
              <p className="font-semibold">
                Storage driver:{" "}
                {status.provider === "cloudinary" ? "Cloudinary (signed uploads)" : "Local disk (fallback)"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {status.provider === "cloudinary"
                  ? "Uploads go to Cloudinary with server-side signatures. The API secret is never exposed to the browser."
                  : "Cloudinary is not configured yet, so uploads are stored on the server and served via /api/files. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to switch to Cloudinary — existing uploads keep working."}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={status.configured ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"}>
            {status.configured ? "Cloudinary configured" : "Fallback active"}
          </Badge>
        </CardContent>
      </Card>

      {/* Pending cleanup */}
      <Card className="border-border shadow-none py-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-heading text-base font-bold uppercase tracking-tight">
            <ShieldAlert className="h-4 w-4 text-amber-600" aria-hidden />
            Pending Cleanup Queue
          </CardTitle>
          <CardDescription>
            Assets whose deletion failed are queued here and can be retried — no orphans are
            left behind silently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" aria-hidden />
              The queue is empty — all storage deletions have succeeded.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <ul className="divide-y divide-border rounded-md border border-border">
                {pending.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span className="max-w-[50%] truncate font-mono text-xs text-muted-foreground">
                      {p.publicId}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.attempts} attempt{p.attempts === 1 ? "" : "s"}
                      {p.lastError ? ` · last error: ${p.lastError.slice(0, 80)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <div>
                <RetryCleanupButton remaining={pending.length} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Library */}
      <Card className="border-border shadow-none py-0">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-base font-bold uppercase tracking-tight">
            Image Library ({images.length})
          </CardTitle>
          <CardDescription>Click a photo to remove it from its vehicle and storage.</CardDescription>
        </CardHeader>
        <CardContent>
          <MediaLibrary
            images={images.map((img) => ({
              id: img.id,
              imageUrl: img.imageUrl,
              publicId: img.publicId,
              altText: img.altText,
              vehicleId: img.vehicle.id,
              vehicleTitle: img.vehicle.title,
              vehicleSlug: img.vehicle.slug,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
