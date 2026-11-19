"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { optimizedImageUrl } from "@/lib/cloudinary/image-url";

export type LibraryImage = {
  id: string;
  imageUrl: string;
  publicId: string | null;
  altText: string | null;
  vehicleId: string;
  vehicleTitle: string;
  vehicleSlug: string;
};

export function MediaLibrary({ images }: { images: LibraryImage[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<LibraryImage | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      const res = await fetch(`/api/admin/media/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message || "Could not delete the image.");
        return;
      }
      toast.success(
        data.assetDeleted
          ? "Image deleted and asset removed from storage."
          : "Image record deleted. Asset cleanup was queued (see below)."
      );
      setDeleting(null);
      refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (images.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-white px-6 py-16 text-center">
        <p className="font-heading text-lg font-bold">No images yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload photos while adding or editing vehicles and they will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {images.map((img) => (
          <div
            key={img.id}
            className={`group overflow-hidden rounded-lg border border-border bg-white transition ${
              busyId === img.id ? "opacity-50" : ""
            }`}
          >
            <div className="relative aspect-[4/3] bg-secondary">
              <Image
                src={optimizedImageUrl(img.imageUrl, 480)}
                alt={img.altText || `Photo for ${img.vehicleTitle}`}
                fill
                sizes="(max-width:640px) 50vw, 240px"
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
                <button
                  type="button"
                  onClick={() => setDeleting(img)}
                  aria-label={`Delete photo for ${img.vehicleTitle}`}
                  className="rounded-full bg-white/95 p-2.5 text-destructive opacity-0 shadow transition group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
            <div className="p-3">
              <Link
                href={`/admin/dashboard/inventory/${img.vehicleId}/edit`}
                className="line-clamp-1 text-xs font-semibold hover:text-gold-dark"
              >
                {img.vehicleTitle}
              </Link>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {img.publicId ? "Cloudinary" : "Local"}
                </span>
                <Link
                  href={`/inventory/${img.vehicleSlug}`}
                  target="_blank"
                  className="text-muted-foreground transition hover:text-foreground"
                  aria-label={`Open ${img.vehicleTitle} on the website`}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from{" "}
              <strong>{deleting?.vehicleTitle}</strong> and deleted from storage. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={busyId !== null}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busyId !== null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Delete photo"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {pending && <span className="sr-only">Refreshing media library…</span>}
    </>
  );
}

export function RetryCleanupButton({ remaining }: { remaining: number }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/media/retry", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message || "Cleanup failed.");
        return;
      }
      if (data.processed === 0) {
        toast.info("No pending deletions could be processed yet.", {
          description: data.failures > 0
            ? `${data.failures} item(s) failed again — they remain queued for another retry.`
            : undefined,
        });
      } else {
        toast.success(`Cleaned ${data.processed} pending asset(s). ${data.remaining} remaining.`);
      }
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button onClick={run} disabled={running || remaining === 0} size="sm">
      {running ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
      )}
      Retry cleanup now
    </Button>
  );
}
