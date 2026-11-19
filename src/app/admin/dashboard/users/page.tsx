import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { requirePageUser, canManageUsers } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { UsersManager } from "@/components/admin/users-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const user = await requirePageUser();
  if (!user) redirect("/admin/login?next=/admin/dashboard/users");

  if (!canManageUsers(user.role)) {
    return (
      <Card className="border-border shadow-none py-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold uppercase tracking-tight">
            <ShieldAlert className="h-5 w-5 text-amber-600" aria-hidden />
            Restricted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            User management is available to <strong>Super Admins</strong> only.
          </p>
        </CardContent>
      </Card>
    );
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Staff accounts and role-based permissions. There is no public registration — all
          accounts are created here.
        </p>
      </div>

      <UsersManager
        users={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
        currentUserId={user.id}
      />
    </div>
  );
}
