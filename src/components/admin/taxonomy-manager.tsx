"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type TaxonomyBrand = { id: string; name: string; slug: string; vehicleCount: number };
export type TaxonomyCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  vehicleCount: number;
};

type Props = {
  brands: TaxonomyBrand[];
  categories: TaxonomyCategory[];
};

export function TaxonomyManager({ brands, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [kind, setKind] = useState<"brand" | "category">("brand");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "brand" | "category"; id: string; name: string } | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/taxonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: newName,
          ...(kind === "category" ? { description: newDescription } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Could not create.");
        return;
      }
      toast.success(`${kind === "brand" ? "Brand" : "Category"} "${newName}" created.`);
      setCreateOpen(false);
      setNewName("");
      setNewDescription("");
      refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleCategoryActive(id: string, isActive: boolean) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/taxonomy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "category", id, isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message || "Update failed.");
        return;
      }
      toast.success(isActive ? "Category is now visible on the website." : "Category hidden from the website.");
      refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/taxonomy?kind=${deleteTarget.kind}&id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message || "Delete failed.");
        return;
      }
      toast.success(`Deleted "${deleteTarget.name}".`);
      setDeleteTarget(null);
      refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setBusy(false);
    }
  }

  function openCreate(selectedKind: "brand" | "category") {
    setKind(selectedKind);
    setError(null);
    setCreateOpen(true);
  }

  return (
    <Tabs defaultValue="categories">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
          <TabsTrigger value="brands">Brands ({brands.length})</TabsTrigger>
        </TabsList>
        <Button size="sm" onClick={() => openCreate("brand")} className="bg-ink text-white hover:bg-ink/85">
          <Plus className="mr-1 h-4 w-4" aria-hidden />
          Brand
        </Button>
      </div>

      <TabsContent value="categories" className="mt-4">
        <div className="mb-3 flex justify-end">
          <Button size="sm" onClick={() => openCreate("category")} className="bg-ink text-white hover:bg-ink/85">
            <Plus className="mr-1 h-4 w-4" aria-hidden />
            Category
          </Button>
        </div>
        <ul className="divide-y divide-border rounded-lg border border-border bg-white">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold">
                  {c.name}
                  {!c.isActive && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">HIDDEN</Badge>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.vehicleCount} vehicle{c.vehicleCount === 1 ? "" : "s"} · /inventory?category={c.slug}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => toggleCategoryActive(c.id, !c.isActive)}
                >
                  {c.isActive ? (
                    <>
                      <EyeOff className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Show
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-700 hover:bg-red-50"
                  disabled={busy}
                  onClick={() => setDeleteTarget({ kind: "category", id: c.id, name: c.name })}
                  aria-label={`Delete category ${c.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </TabsContent>

      <TabsContent value="brands" className="mt-4">
        <ul className="divide-y divide-border rounded-lg border border-border bg-white">
          {brands.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{b.name}</p>
                <p className="text-xs text-muted-foreground">
                  {b.vehicleCount} vehicle{b.vehicleCount === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-red-700 hover:bg-red-50"
                disabled={busy}
                onClick={() => setDeleteTarget({ kind: "brand", id: b.id, name: b.name })}
                aria-label={`Delete brand ${b.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      </TabsContent>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add {kind === "brand" ? "brand" : "category"}</DialogTitle>
            <DialogDescription>
              {kind === "brand"
                ? "Brands appear in the vehicle form and inventory filters."
                : "Active categories appear on the homepage and inventory filters."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={create} className="flex flex-col gap-4" noValidate>
            {error && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            )}
            <div>
              <Label htmlFor="tax-name">Name *</Label>
              <Input id="tax-name" value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1.5" required minLength={2} maxLength={80} />
            </div>
            {kind === "category" && (
              <div>
                <Label htmlFor="tax-desc">Short description</Label>
                <Textarea id="tax-desc" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="mt-1.5" rows={2} maxLength={300} />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy} className="bg-gold text-gold-foreground hover:bg-gold-dark">
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Creating…
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Deletion is blocked while any vehicle still uses this {deleteTarget?.kind}.
              Categories can be hidden instead without deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={busy}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {pending && <span className="sr-only">Refreshing…</span>}
    </Tabs>
  );
}
