"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    { ok: password.length >= 10, label: "At least 10 characters" },
    { ok: /[A-Za-z]/.test(password), label: "Contains a letter" },
    { ok: /[0-9]/.test(password), label: "Contains a number" },
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Setup failed. Please try again.");
        return;
      }
      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-neutral-300">Full name</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Salum Said" autoComplete="name" className="text-ink-foreground placeholder:text-neutral-400" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-neutral-300">Email address</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" autoComplete="email" className="text-ink-foreground placeholder:text-neutral-400" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-neutral-300">Password</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="text-ink-foreground placeholder:text-neutral-400" />
        <ul className="mt-1 space-y-1" aria-label="Password requirements">
          {passwordChecks.map((c) => (
            <li key={c.label} className={`flex items-center gap-2 text-xs ${c.ok ? "text-emerald-400" : "text-neutral-400"}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${c.ok ? "bg-emerald-600" : "bg-neutral-400"}`} aria-hidden />
              {c.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm" className="text-neutral-300">Confirm password</Label>
        <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className="text-ink-foreground placeholder:text-neutral-400" />
      </div>

      <Button type="submit" disabled={loading} className="bg-gold text-ink hover:bg-gold-dark">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Creating account…
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" aria-hidden />
            Create Administrator
          </>
        )}
      </Button>

      <p className="flex items-start gap-2 rounded-md border border-neutral-800 bg-neutral-900/60 p-3 text-xs leading-relaxed text-neutral-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
        This is a one-time provisioning page. It permanently disables itself once the first
        administrator exists. Choose a strong, unique password — it is never stored in code.
      </p>
    </form>
  );
}
