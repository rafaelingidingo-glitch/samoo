import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { getCurrentUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/admin/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12 dark-section">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15">
            <ShieldCheck className="h-7 w-7 text-gold" aria-hidden />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold uppercase tracking-wide text-white">
            Admin Sign In
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Sawee Vintage &amp; Classic Cars — management dashboard
          </p>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-7 shadow-2xl">
          <Suspense fallback={<div className="h-64 animate-pulse rounded bg-neutral-800" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Authorized personnel only. All sign-in attempts are rate-limited and audited.
        </p>
      </div>
    </div>
  );
}
