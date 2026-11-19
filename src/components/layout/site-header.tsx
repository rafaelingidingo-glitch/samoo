"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, LogIn } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/inventory", label: "Inventory" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

type SiteHeaderProps = {
  businessName: string;
  logoUrl: string | null;
};

export function SiteHeader({ businessName, logoUrl }: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={`${businessName} — home`}
          className="shrink-0"
          onClick={() => setOpen(false)}
        >
          <Logo businessName={businessName} logoUrl={logoUrl} />
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main navigation" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`relative text-sm font-medium uppercase tracking-[0.12em] transition-colors hover:text-foreground ${
                    isActive(link.href) ? "text-foreground" : "text-muted-foreground"
                  } after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full ${
                    isActive(link.href) ? "after:w-full" : ""
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:block">
          <Button
            asChild
            variant="outline"
            className="border-border bg-transparent text-foreground hover:border-gold hover:bg-transparent hover:text-gold-dark"
          >
            <Link href="/admin/login">
              <LogIn className="h-4 w-4" aria-hidden />
              Login
            </Link>
          </Button>
        </div>

        {/* Mobile navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open navigation menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[340px]">
            <SheetHeader>
              <SheetTitle>
                <Logo businessName={businessName} logoUrl={logoUrl} />
              </SheetTitle>
            </SheetHeader>
            <nav aria-label="Mobile navigation" className="mt-4 flex flex-col px-4">
              <ul className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={`block border-b border-border py-4 text-sm font-medium uppercase tracking-[0.12em] transition-colors ${
                        isActive(link.href)
                          ? "text-gold"
                          : "text-foreground hover:text-gold"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Separator className="my-6" />
              <Button
                asChild
                variant="outline"
                className="w-full border-border bg-transparent text-foreground hover:border-gold hover:bg-transparent hover:text-gold-dark"
              >
                <Link href="/admin/login" onClick={() => setOpen(false)}>
                  <LogIn className="h-4 w-4" aria-hidden />
                  Login
                </Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
