"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  ExternalLink,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Trash2,
  Car,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { VehicleStatusBadge } from "@/components/admin/vehicle-status-badge";
import { formatTZS, formatDate, AVAILABILITY_LABELS } from "@/lib/format";
import { optimizedImageUrl } from "@/lib/cloudinary/image-url";
import type { VehicleCardData } from "@/types";

type AdminVehicleRow = Omit<VehicleCardData, "price"> & { price: number };

type Props = {
  vehicles: AdminVehicleRow[];
  canDelete: boolean;
  canPublish: boolean;
  baseUrl: string;
};

export function InventoryTable({ vehicles, canDelete, canPublish, baseUrl }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<AdminVehicleRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function patchStatus(
    id: string,
    title: string,
    patch: { status?: string; isPublished?: boolean; isFeatured?: boolean },
    successMessage: string
  ) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/vehicles/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message || "Action failed.");
        return;
      }
      toast.success(successMessage);
      refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message || "Delete failed.");
        return;
      }
      toast.success(`"${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-white px-6 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <Car className="h-7 w-7 text-muted-foreground/60" aria-hidden />
        </span>
        <p className="mt-5 font-heading text-lg font-bold">No vehicles found</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Try adjusting your search or filters, or add a new vehicle to the inventory.
        </p>
        <Button asChild className="mt-6 bg-gold text-gold-foreground hover:bg-gold-dark">
          <Link href={`${baseUrl}/new`}>
            Add Vehicle
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/70">
                <TableHead className="w-24">Photo</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="hidden md:table-cell">Year</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Flags</TableHead>
                <TableHead className="hidden xl:table-cell">Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((v) => {
                const img = v.images[0];
                const busy = busyId === v.id || (pending && busyId === v.id);
                return (
                  <TableRow key={v.id} className={busy ? "opacity-60" : ""}>
                    <TableCell>
                      <span className="relative block h-12 w-16 overflow-hidden rounded-md bg-secondary">
                        {img ? (
                          <Image
                            src={optimizedImageUrl(img.imageUrl, 240)}
                            alt={img.altText || v.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                            No photo
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <p className="truncate font-semibold">{v.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {v.brand.name} · {v.model} · {v.images.length} photo
                        {v.images.length === 1 ? "" : "s"}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{v.year}</TableCell>
                    <TableCell className="whitespace-nowrap font-semibold">
                      {formatTZS(v.price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <VehicleStatusBadge status={v.status} />
                        {!v.isPublished && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            DRAFT
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex gap-1.5">
                        {v.isFeatured && (
                          <Badge className="border-transparent bg-gold text-gold-foreground text-[10px]">
                            FEATURED
                          </Badge>
                        )}
                        {v.isPublished && (
                          <Badge variant="outline" className="text-[10px] text-emerald-800">
                            LIVE
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {formatDate(v.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${v.title}`} disabled={busy}>
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" aria-hidden />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>{AVAILABILITY_LABELS[v.status] || v.status}</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/dashboard/inventory/${v.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" aria-hidden />
                              Edit vehicle
                            </Link>
                          </DropdownMenuItem>
                          {v.isPublished && (
                            <DropdownMenuItem asChild>
                              <Link href={`/inventory/${v.slug}`} target="_blank">
                                <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
                                Preview on site
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {/* Availability */}
                          {(["AVAILABLE", "RESERVED", "SOLD"] as const).map((s) => (
                            <DropdownMenuItem
                              key={s}
                              disabled={v.status === s}
                              onClick={() =>
                                patchStatus(v.id, v.title, { status: s }, `Marked as ${AVAILABILITY_LABELS[s]}.`)
                              }
                            >
                              <Car className="mr-2 h-4 w-4" aria-hidden />
                              Mark as {AVAILABILITY_LABELS[s]}
                              {v.status === s && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          {canPublish && (
                            <>
                              <DropdownMenuItem
                                disabled={v.isPublished}
                                onClick={() =>
                                  patchStatus(v.id, v.title, { isPublished: true }, "Vehicle published.")
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" aria-hidden />
                                Publish
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!v.isPublished}
                                onClick={() =>
                                  patchStatus(v.id, v.title, { isPublished: false }, "Vehicle unpublished (saved as draft).")
                                }
                              >
                                <EyeOff className="mr-2 h-4 w-4" aria-hidden />
                                Unpublish
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  patchStatus(
                                    v.id,
                                    v.title,
                                    { isFeatured: !v.isFeatured },
                                    v.isFeatured ? "Removed from featured." : "Added to featured."
                                  )
                                }
                              >
                                {v.isFeatured ? (
                                  <>
                                    <StarOff className="mr-2 h-4 w-4" aria-hidden />
                                    Remove from featured
                                  </>
                                ) : (
                                  <>
                                    <Star className="mr-2 h-4 w-4" aria-hidden />
                                    Feature this vehicle
                                  </>
                                )}
                              </DropdownMenuItem>
                            </>
                          )}
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(v)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                                Delete vehicle
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <strong>{deleteTarget?.title}</strong> and its photo records. Associated image
              files are deleted from storage; any cleanup failures are queued for retry in
              Media. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Delete vehicle"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
