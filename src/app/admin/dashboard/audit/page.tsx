import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { requirePageUser, canManageUsers } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit Log" };

const PER_PAGE = 30;

const ACTION_TONES: Record<string, string> = {
  LOGIN: "border-emerald-300 bg-emerald-50 text-emerald-900",
  LOGOUT: "border-neutral-300 bg-neutral-100 text-neutral-700",
  LOGIN_FAILED: "border-red-200 bg-red-50 text-red-800",
  VEHICLE_CREATE: "border-gold/50 bg-gold/10 text-gold-dark",
  VEHICLE_UPDATE: "border-gold/50 bg-gold/10 text-gold-dark",
  VEHICLE_DELETE: "border-red-200 bg-red-50 text-red-800",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePageUser();
  if (!user) redirect("/admin/login?next=/admin/dashboard/audit");

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
            The audit log is available to <strong>Super Admins</strong> only.
          </p>
        </CardContent>
      </Card>
    );
  }

  const raw = await searchParams;
  const pageParam = Array.isArray(raw.page) ? raw.page[0] : raw.page;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const [total, logs] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Security-relevant events across the dashboard — {total} record{total === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/70">
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>By</TableHead>
                <TableHead className="hidden lg:table-cell">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No audit events recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        ACTION_TONES[log.action.split(" ")[0]] ?? "border-neutral-300 bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.entityType}
                    {log.entityId && (
                      <span className="ml-1 font-mono text-xs text-muted-foreground">
                        #{log.entityId.slice(0, 8)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.userName || <span className="text-muted-foreground">system</span>}
                  </TableCell>
                  <TableCell className="hidden max-w-[320px] truncate text-sm text-muted-foreground lg:table-cell">
                    {log.details || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 && (
            <a
              href={`/admin/dashboard/audit?page=${page - 1}`}
              className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:border-gold"
            >
              Previous
            </a>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/admin/dashboard/audit?page=${page + 1}`}
              className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:border-gold"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
