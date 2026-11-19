"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Car,
  Images,
  Settings,
  Users,
  ScrollText,
  LogOut,
  Menu,
  Plus,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/dashboard/inventory", label: "Inventory", icon: Car, exact: false },
  { href: "/admin/dashboard/media", label: "Media", icon: Images, exact: false },
  { href: "/admin/dashboard/settings", label: "Settings", icon: Settings, exact: false },
  { href: "/admin/dashboard/users", label: "Users", icon: Users, exact: false, superOnly: true },
  { href: "/admin/dashboard/audit", label: "Audit Log", icon: ScrollText, exact: false, superOnly: true },
];

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: "bg-gold/15 text-gold border-gold/40",
  ADMIN: "bg-neutral-100 text-neutral-800 border-neutral-300",
  EDITOR: "bg-neutral-100 text-neutral-600 border-neutral-300",
};

type AdminShellProps = {
  user: { name: string; email: string; role: string };
  businessName: string;
  logoUrl: string | null;
  children: React.ReactNode;
};

export function AdminShell({ user, businessName, logoUrl, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => !item.superOnly || user.role === "SUPER_ADMIN");
  const isActive = (item: (typeof NAV_ITEMS)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out");
      router.replace("/admin/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
      setLoggingOut(false);
    }
  }

  const navContent = (
    <>
      <nav aria-label="Admin navigation" className="flex flex-1 flex-col gap-1 px-3 py-4">
        {visibleItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-neutral-400 hover:bg-sidebar-accent/60 hover:text-white"
              }`}
            >
              <item.icon
                className={`h-5 w-5 ${active ? "text-gold" : ""}`}
                aria-hidden
              />
              {item.label}
              {item.href.endsWith("inventory") && (
                <span className="ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-800 px-3 py-4">
        <Button
          asChild
          size="sm"
          className="mb-3 w-full bg-gold text-gold-foreground hover:bg-gold-dark"
        >
          <Link href="/admin/dashboard/inventory/new" onClick={() => setMobileOpen(false)}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            Add Vehicle
          </Link>
        </Button>
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-neutral-500">{user.email}</p>
          </div>
          <Badge variant="outline" className={`text-[10px] ${ROLE_BADGE[user.role]}`}>
            {user.role.replace("_", " ")}
          </Badge>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-neutral-400 transition-colors hover:bg-sidebar-accent/60 hover:text-white disabled:opacity-60"
        >
          {loggingOut ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <LogOut className="h-5 w-5" aria-hidden />
          )}
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-[72px] items-center border-b border-neutral-800 px-5">
          <Logo businessName={businessName} logoUrl={logoUrl} variant="dark" />
        </div>
        {navContent}
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between gap-4 border-b border-border bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" aria-label="Open admin menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] border-neutral-800 bg-sidebar p-0 text-sidebar-foreground">
                <SheetHeader className="border-b border-neutral-800 px-5 py-4">
                  <SheetTitle>
                    <Logo businessName={businessName} logoUrl={logoUrl} variant="dark" />
                  </SheetTitle>
                </SheetHeader>
                {navContent}
              </SheetContent>
            </Sheet>

            <div>
              <p className="font-heading text-sm font-bold uppercase tracking-wider">
                Management Dashboard
              </p>
              <p className="text-xs text-muted-foreground">
                {businessName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/" target="_blank" rel="noopener noreferrer">
                View website
              </Link>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main id="admin-content" className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
