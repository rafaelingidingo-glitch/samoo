import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requirePageUser } from "@/lib/auth/guards";
import { getSiteSettings } from "@/lib/settings";

export const metadata = {
  title: { default: "Admin Dashboard", template: "%s | Sawee Admin" },
  robots: { index: false, follow: false },
};

/**
 * Admin dashboard layout — server-side authorization gate.
 * Middleware already redirects unauthenticated visitors; this re-checks
 * the session against the database (defense in depth).
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageUser();
  if (!user) redirect("/admin/login?next=/admin/dashboard");

  const settings = await getSiteSettings();

  return (
    <AdminShell
      user={{ name: user.name, email: user.email, role: user.role }}
      businessName={settings.businessName}
      logoUrl={settings.logoUrl}
    >
      {children}
    </AdminShell>
  );
}
