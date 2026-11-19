"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, RotateCcw, ShieldCheck } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatDate } from "@/lib/format";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

const ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const;

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: "border-gold/40 bg-gold/10 text-gold-dark",
  ADMIN: "border-neutral-300 bg-neutral-100 text-neutral-800",
  EDITOR: "border-neutral-300 bg-neutral-100 text-neutral-600",
};

type Props = { users: AdminUser[]; currentUserId: string };

export function UsersManager({ users, currentUserId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Create form state
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "EDITOR" as (typeof ROLES)[number] });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Reset form state
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const activeSuperAdmins = users.filter((u) => u.role === "SUPER_ADMIN" && u.isActive).length;

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data?.error?.message || "Could not create the user.");
        return;
      }
      toast.success(`Account created for ${data.user.email}.`);
      setCreateOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "EDITOR" });
      refresh();
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function updateUser(id: string, patch: Record<string, unknown>, successMessage: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message || "Update failed.");
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

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message || "Password reset failed.");
        return;
      }
      toast.success(`Password updated for ${resetTarget.email}.`);
      setResetTarget(null);
      setResetPassword("");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{users.length}</span> staff account
          {users.length === 1 ? "" : "s"} · {activeSuperAdmins} active Super Admin
          {activeSuperAdmins === 1 ? "" : "s"}
        </p>
        <Button onClick={() => setCreateOpen(true)} className="bg-gold text-gold-foreground hover:bg-gold-dark">
          <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
          Add Staff Account
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/70">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                const lastSuperAdmin = u.role === "SUPER_ADMIN" && u.isActive && activeSuperAdmins <= 1;
                return (
                  <TableRow key={u.id} className={busyId === u.id ? "opacity-60" : ""}>
                    <TableCell className="font-semibold">
                      {u.name}
                      {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v) =>
                          updateUser(u.id, { role: v }, `${u.email} is now ${v.replace("_", " ")}.`)
                        }
                        disabled={busyId === u.id || isSelf || (lastSuperAdmin && busyId !== u.id)}
                      >
                        <SelectTrigger className="h-8 w-[150px]" aria-label={`Role for ${u.email}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={u.isActive ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}>
                        {u.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResetTarget(u)}
                          disabled={busyId === u.id}
                          aria-label={`Reset password for ${u.email}`}
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                          Reset password
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={u.isActive ? "text-red-700 hover:bg-red-50 hover:text-red-800" : "text-emerald-700 hover:bg-emerald-50"}
                          disabled={busyId === u.id || isSelf || (lastSuperAdmin && u.isActive)}
                          onClick={() =>
                            updateUser(
                              u.id,
                              { isActive: !u.isActive },
                              u.isActive ? `${u.email} deactivated.` : `${u.email} reactivated.`
                            )
                          }
                        >
                          {u.isActive ? "Deactivate" : "Reactivate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add staff account</DialogTitle>
            <DialogDescription>
              New accounts can sign in immediately. Share the password through a secure
              channel — it is stored hashed (bcrypt) and cannot be viewed again.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createUser} className="flex flex-col gap-4" noValidate>
            {createError && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {createError}
              </p>
            )}
            <div>
              <Label htmlFor="u-name">Full name *</Label>
              <Input id="u-name" value={newUser.name} onChange={(e) => setNewUser((v) => ({ ...v, name: e.target.value }))} className="mt-1.5" required minLength={2} />
            </div>
            <div>
              <Label htmlFor="u-email">Email *</Label>
              <Input id="u-email" type="email" value={newUser.email} onChange={(e) => setNewUser((v) => ({ ...v, email: e.target.value }))} className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="u-password">Password *</Label>
              <Input id="u-password" type="password" value={newUser.password} onChange={(e) => setNewUser((v) => ({ ...v, password: e.target.value }))} className="mt-1.5" required minLength={10} autoComplete="new-password" />
              <p className="mt-1 text-xs text-muted-foreground">Min 10 characters, with a letter and a number.</p>
            </div>
            <div>
              <Label htmlFor="u-role">Role *</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser((prev) => ({ ...prev, role: v as (typeof ROLES)[number] }))}>
                <SelectTrigger id="u-role" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EDITOR">Editor — add and edit vehicles, upload photos</SelectItem>
                  <SelectItem value="ADMIN">Admin — full inventory control, publishing, deletion</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin — everything incl. users &amp; settings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating} className="bg-gold text-gold-foreground hover:bg-gold-dark">
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Creating…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <AlertDialog open={resetTarget !== null} onOpenChange={(open) => !open && setResetTarget(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reset password for {resetTarget?.email}
            </AlertDialogTitle>
            <AlertDialogDescription>
              The current password will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={confirmReset} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="reset-password" className="sr-only">New password</Label>
              <Input
                id="reset-password"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                minLength={10}
                autoComplete="new-password"
                placeholder="New password (min 10 chars)"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                asChild
                disabled={resetting || resetPassword.length < 10}
                className="bg-ink text-white hover:bg-ink/85"
              >
                <button type="submit">
                  {resetting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      Updating…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" aria-hidden />
                      Update password
                    </>
                  )}
                </button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
      {pending && <span className="sr-only">Refreshing users…</span>}
    </>
  );
}
