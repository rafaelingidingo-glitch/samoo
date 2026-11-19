"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SiteSettings } from "@/lib/settings";

type Props = { settings: SiteSettings };

export function SettingsForm({ settings }: Props) {
  const router = useRouter();
  const [values, setValues] = useState({
    businessName: settings.businessName,
    phone: settings.phone,
    whatsappNumber: settings.whatsappNumber,
    instagramUrl: settings.instagramUrl ?? "",
    address: settings.address ?? "",
    businessHours: settings.businessHours ?? "",
    logoUrl: settings.logoUrl ?? "",
    metaTitle: settings.metaTitle ?? "",
    metaDescription: settings.metaDescription ?? "",
    footerNote: settings.footerNote ?? "",
    heroImageUrl: settings.heroImageUrl ?? "",
    aboutIntro: settings.aboutIntro ?? "",
    aboutStory: settings.aboutStory ?? "",
    aboutMission: settings.aboutMission ?? "",
    aboutVision: settings.aboutVision ?? "",
    aboutCommitment: settings.aboutCommitment ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function set(key: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data?.error?.message || "Could not save settings.");
        return;
      }
      toast.success("Settings saved. The website has been updated.");
      router.refresh();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {serverError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {serverError}
        </p>
      )}

      <Card className="border-border shadow-none py-0">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-base font-bold uppercase tracking-tight">
            Business Information
          </CardTitle>
          <CardDescription>
            These details appear automatically in the navigation, footer, contact page and
            WhatsApp links across the whole website.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="businessName">Business name *</Label>
            <Input id="businessName" value={values.businessName} onChange={(e) => set("businessName", e.target.value)} className="mt-1.5" required maxLength={150} />
          </div>
          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" value={values.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1.5" required />
            <p className="mt-1 text-xs text-muted-foreground">Displayed as-is, e.g. +255 710 853 255</p>
          </div>
          <div>
            <Label htmlFor="whatsappNumber">WhatsApp number *</Label>
            <Input id="whatsappNumber" value={values.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} className="mt-1.5" required />
            <p className="mt-1 text-xs text-muted-foreground">International format without +, e.g. 255710853255</p>
          </div>
          <div>
            <Label htmlFor="instagramUrl">Instagram URL</Label>
            <Input id="instagramUrl" value={values.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} className="mt-1.5" placeholder="https://www.instagram.com/sawee_oldcarstz/" />
          </div>
          <div>
            <Label htmlFor="logoUrl">Logo URL (optional)</Label>
            <Input id="logoUrl" value={values.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} className="mt-1.5" placeholder="https://… or /images/logo.png" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Business address</Label>
            <Input id="address" value={values.address} onChange={(e) => set("address", e.target.value)} className="mt-1.5" placeholder="Leave empty until the client approves an official address" />
            <p className="mt-1 text-xs text-muted-foreground">
              Shown in the footer and contact page once provided. Left empty, the website
              explains that location details are coming soon.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="businessHours">Business hours</Label>
            <Textarea id="businessHours" value={values.businessHours} onChange={(e) => set("businessHours", e.target.value)} className="mt-1.5" rows={3} placeholder={"Mon – Fri: 8:00 – 18:00\nSat: 9:00 – 15:00\nSun: By appointment"} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-none py-0">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-base font-bold uppercase tracking-tight">
            Website Content
          </CardTitle>
          <CardDescription>Editable copy for the homepage hero and the About page. Provisional text is shown on the website until you approve real copy.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div>
            <Label htmlFor="heroImageUrl">Hero image URL (homepage background)</Label>
            <Input id="heroImageUrl" value={values.heroImageUrl} onChange={(e) => set("heroImageUrl", e.target.value)} className="mt-1.5" placeholder="/images/demo/hero.png or https://…" />
          </div>
          <div>
            <Label htmlFor="aboutIntro">About — introduction</Label>
            <Textarea id="aboutIntro" value={values.aboutIntro} onChange={(e) => set("aboutIntro", e.target.value)} className="mt-1.5" rows={3} />
          </div>
          <div>
            <Label htmlFor="aboutStory">About — our story</Label>
            <Textarea id="aboutStory" value={values.aboutStory} onChange={(e) => set("aboutStory", e.target.value)} className="mt-1.5" rows={5} />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <Label htmlFor="aboutMission">Mission</Label>
              <Textarea id="aboutMission" value={values.aboutMission} onChange={(e) => set("aboutMission", e.target.value)} className="mt-1.5" rows={4} />
            </div>
            <div>
              <Label htmlFor="aboutVision">Vision</Label>
              <Textarea id="aboutVision" value={values.aboutVision} onChange={(e) => set("aboutVision", e.target.value)} className="mt-1.5" rows={4} />
            </div>
            <div>
              <Label htmlFor="aboutCommitment">Commitment</Label>
              <Textarea id="aboutCommitment" value={values.aboutCommitment} onChange={(e) => set("aboutCommitment", e.target.value)} className="mt-1.5" rows={4} />
            </div>
          </div>
          <p className="flex items-start gap-2 rounded-md bg-secondary px-3 py-2.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Please have the client review and approve all published copy before launch — the
            current text is provisional and contains no unverified claims.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border shadow-none py-0">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-base font-bold uppercase tracking-tight">
            SEO Defaults
          </CardTitle>
          <CardDescription>Used when a page does not define its own metadata.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="metaTitle">Meta title override</Label>
            <Input id="metaTitle" value={values.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} className="mt-1.5" maxLength={150} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="metaDescription">Meta description override</Label>
            <Textarea id="metaDescription" value={values.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} className="mt-1.5" rows={2} maxLength={300} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="footerNote">Footer note</Label>
            <Textarea id="footerNote" value={values.footerNote} onChange={(e) => set("footerNote", e.target.value)} className="mt-1.5" rows={2} maxLength={500} placeholder="Short brand statement shown under the logo in the footer." />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="submit"
          disabled={saving}
          className="bg-gold px-8 text-gold-foreground hover:bg-gold-dark"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" aria-hidden />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
