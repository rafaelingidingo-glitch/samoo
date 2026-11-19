import type { Metadata } from "next";
import { Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SetupForm } from "@/components/admin/setup-form";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "First Administrator Setup",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  const userCount = await db.user.count();
  const setupCompleted = userCount > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12 dark-section">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15">
            <ShieldCheck className="h-7 w-7 text-gold" aria-hidden />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold uppercase tracking-wide text-white">
            {setupCompleted ? "Setup Complete" : "Create First Administrator"}
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            SAWEE CARS — dashboard provisioning
          </p>
        </div>

        {setupCompleted ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-7 text-center">
            <Lock className="mx-auto h-10 w-10 text-neutral-500" aria-hidden />
            <p className="mt-4 text-sm leading-relaxed text-neutral-300">
              The first administrator account already exists, so this provisioning page is
              permanently disabled. New staff accounts are created from{" "}
              <strong className="text-white">Dashboard → Users</strong> by a Super Admin.
            </p>
            <Button asChild className="mt-6 w-full bg-gold text-gold-foreground hover:bg-gold-dark">
              <Link href="/admin/login">Go to Sign In</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-7 shadow-2xl">
            <SetupForm />
          </div>
        )}
      </div>
    </div>
  );
}
