"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save, CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageManager, type FormImage } from "@/components/admin/image-manager";
import {
  TRANSMISSION_OPTIONS,
  FUEL_TYPE_OPTIONS,
  CONDITION_OPTIONS,
  CONDITION_LABELS,
  AVAILABILITY_LABELS,
} from "@/lib/format";

type BrandOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };

export type VehicleFormValues = {
  title: string;
  brandId: string;
  model: string;
  categoryId: string | null;
  year: number | "";
  price: number | "";
  currency: "TZS";
  mileage: number | "";
  fuelType: string;
  transmission: string;
  engineCapacity: string;
  condition: string;
  description: string;
  highlights: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  isFeatured: boolean;
  isPublished: boolean;
};

type Props = {
  mode: "create" | "edit";
  vehicleId?: string;
  initial: VehicleFormValues;
  initialImages: FormImage[];
  brands: BrandOption[];
  categories: CategoryOption[];
  canPublish: boolean;
  canFeature: boolean;
};

export function VehicleForm({
  mode,
  vehicleId,
  initial,
  initialImages,
  brands,
  categories,
  canPublish,
  canFeature,
}: Props) {
  const router = useRouter();
  const [values, setValues] = useState<VehicleFormValues>(initial);
  const [images, setImages] = useState<FormImage[]>(initialImages);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (values.title.trim().length < 3) e.title = "Title must be at least 3 characters.";
    if (!values.brandId) e.brandId = "Select a brand.";
    if (!values.model.trim()) e.model = "Model is required.";
    if (!values.year || values.year < 1900 || values.year > 2100) e.year = "Enter a year between 1900 and 2100.";
    if (values.price === "" || values.price < 0) e.price = "Enter a valid price in TSh.";
    if (values.description.trim().length < 10) e.description = "Description must be at least 10 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent, publishOverride?: boolean) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const payload = {
      title: values.title.trim(),
      brandId: values.brandId,
      model: values.model.trim(),
      categoryId: values.categoryId || null,
      year: Number(values.year),
      price: Number(values.price),
      currency: "TZS",
      mileage: values.mileage === "" ? null : Number(values.mileage),
      fuelType: values.fuelType || null,
      transmission: values.transmission || null,
      engineCapacity: values.engineCapacity.trim() || null,
      condition: values.condition || null,
      description: values.description.trim(),
      highlights: values.highlights.trim() || null,
      status: values.status,
      isFeatured: canFeature ? values.isFeatured : false,
      isPublished: publishOverride !== undefined ? publishOverride : values.isPublished,
      images: images.map((img, idx) => ({
        imageUrl: img.imageUrl,
        publicId: img.publicId,
        altText: img.altText.trim() || null,
        sortOrder: idx,
        isPrimary: idx === 0,
      })),
    };

    setSaving(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setServerError(data?.error?.message || "Could not save the vehicle.");
          return;
        }
        toast.success(
          payload.isPublished ? "Vehicle saved and published." : "Vehicle saved as draft."
        );
        router.push("/admin/dashboard/inventory");
        router.refresh();
      } else {
        // Save fields first.
        const res = await fetch(`/api/admin/vehicles/${vehicleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setServerError(data?.error?.message || "Could not save the vehicle.");
          return;
        }
        // Then sync the image set (handles removals, reorder, alt text).
        const imgRes = await fetch(`/api/admin/vehicles/${vehicleId}/images`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: payload.images }),
        });
        if (!imgRes.ok) {
          const imgData = await imgRes.json();
          setServerError(imgData?.error?.message || "Vehicle saved, but images could not be updated.");
          return;
        }
        toast.success("Vehicle updated.");
        router.push("/admin/dashboard/inventory");
        router.refresh();
      }
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const err = (key: string) =>
    errors[key] ? (
      <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form onSubmit={(e) => onSubmit(e)} noValidate className="flex flex-col gap-6">
      {serverError && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {serverError}
        </div>
      )}

      {/* Publishing bar */}
      <Card className="border-border shadow-none py-0">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2.5">
              <Switch
                id="publish-switch"
                checked={values.isPublished}
                onCheckedChange={(checked) => {
                  if (!canPublish) {
                    toast.error("Only Admins and Super Admins can publish vehicles.");
                    return;
                  }
                  set("isPublished", checked);
                }}
                disabled={!canPublish || saving}
              />
              <Label htmlFor="publish-switch" className="text-sm font-semibold">
                {values.isPublished ? "Published — visible on website" : "Draft — hidden from website"}
              </Label>
            </div>

            {canFeature && (
              <div className="flex items-center gap-2.5">
                <Switch
                  id="feature-switch"
                  checked={values.isFeatured}
                  onCheckedChange={(checked) => set("isFeatured", checked)}
                  disabled={saving}
                />
                <Label htmlFor="feature-switch" className="text-sm font-semibold">
                  Featured on homepage
                </Label>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-[170px]">
              <Select
                value={values.status}
                onValueChange={(v) => set("status", v as VehicleFormValues["status"])}
              >
                <SelectTrigger aria-label="Availability status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["AVAILABLE", "RESERVED", "SOLD"] as const).map((s) => (
                    <SelectItem key={s} value={s}>{AVAILABILITY_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={(e) => onSubmit(e, false)}
            >
              Save as draft
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gold text-gold-foreground hover:bg-gold-dark"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" aria-hidden />
                  {mode === "create" ? "Save vehicle" : "Save changes"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        {/* Left column: basic info + description */}
        <div className="flex flex-col gap-6">
          <Card className="border-border shadow-none py-0">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold uppercase tracking-tight">
                Basic Information
              </CardTitle>
              <CardDescription>The vehicle title becomes its SEO-friendly page URL.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="title">Vehicle title *</Label>
                <Input
                  id="title"
                  value={values.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. 1978 Toyota Land Cruiser FJ40"
                  className="mt-1.5"
                  maxLength={150}
                />
                {err("title")}
              </div>

              <div>
                <Label htmlFor="brand">Brand *</Label>
                <Select
                  value={values.brandId || undefined}
                  onValueChange={(v) => set("brandId", v)}
                >
                  <SelectTrigger id="brand" className="mt-1.5" aria-label="Brand">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {err("brandId")}
              </div>

              <div>
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={values.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder="e.g. Land Cruiser FJ40"
                  className="mt-1.5"
                  maxLength={100}
                />
                {err("model")}
              </div>

              <div>
                <Label htmlFor="year">Manufacturing year *</Label>
                <Input
                  id="year"
                  type="number"
                  min={1900}
                  max={2100}
                  value={values.year}
                  onChange={(e) => set("year", e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 1978"
                  className="mt-1.5"
                />
                {err("year")}
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={values.categoryId || "none"}
                  onValueChange={(v) => set("categoryId", v === "none" ? null : v)}
                >
                  <SelectTrigger id="category" className="mt-1.5" aria-label="Category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none py-0">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold uppercase tracking-tight">
                Description
              </CardTitle>
              <CardDescription>
                Use a blank line between paragraphs. Be factual — availability and details
                shown here are public.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div>
                <Label htmlFor="description">Vehicle description *</Label>
                <Textarea
                  id="description"
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={7}
                  className="mt-1.5"
                  maxLength={8000}
                />
                {err("description")}
              </div>
              <div>
                <Label htmlFor="highlights">Highlights (one per line, optional)</Label>
                <Textarea
                  id="highlights"
                  value={values.highlights}
                  onChange={(e) => set("highlights", e.target.value)}
                  rows={4}
                  placeholder={"Original-correct paint\nMatching numbers\nReady for viewing"}
                  className="mt-1.5"
                  maxLength={4000}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none py-0">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold uppercase tracking-tight">
                Photographs
              </CardTitle>
              <CardDescription>
                Upload up to 20 photos. The first photo is the main image used in listings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageManager images={images} onChange={setImages} />
            </CardContent>
          </Card>
        </div>

        {/* Right column: pricing + specs */}
        <div className="flex flex-col gap-6">
          <Card className="border-border shadow-none py-0">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold uppercase tracking-tight">
                Pricing
              </CardTitle>
              <CardDescription>Prices are stored and displayed in Tanzanian Shillings (TSh).</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="price">Price (TSh) *</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step={100000}
                value={values.price}
                onChange={(e) => set("price", e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 45000000"
                className="mt-1.5"
              />
              {err("price")}
              <p className="mt-2 text-xs text-muted-foreground">Currency: TZS (fixed)</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none py-0">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold uppercase tracking-tight">
                Specifications
              </CardTitle>
              <CardDescription>Optional fields are hidden on the website when empty.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div>
                <Label htmlFor="mileage">Mileage (km)</Label>
                <Input
                  id="mileage"
                  type="number"
                  min={0}
                  value={values.mileage}
                  onChange={(e) => set("mileage", e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 84500"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="transmission">Transmission</Label>
                <Select value={values.transmission || "none"} onValueChange={(v) => set("transmission", v === "none" ? "" : v)}>
                  <SelectTrigger id="transmission" className="mt-1.5" aria-label="Transmission">
                    <SelectValue placeholder="Not specified" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {TRANSMISSION_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fuel">Fuel type</Label>
                <Select value={values.fuelType || "none"} onValueChange={(v) => set("fuelType", v === "none" ? "" : v)}>
                  <SelectTrigger id="fuel" className="mt-1.5" aria-label="Fuel type">
                    <SelectValue placeholder="Not specified" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {FUEL_TYPE_OPTIONS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="engine">Engine capacity</Label>
                <Input
                  id="engine"
                  value={values.engineCapacity}
                  onChange={(e) => set("engineCapacity", e.target.value)}
                  placeholder='e.g. "2.8 L" or "2800 cc"'
                  className="mt-1.5"
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select value={values.condition || "none"} onValueChange={(v) => set("condition", v === "none" ? "" : v)}>
                  <SelectTrigger id="condition" className="mt-1.5" aria-label="Condition">
                    <SelectValue placeholder="Not specified" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {CONDITION_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{CONDITION_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between rounded-lg border border-border bg-white p-4">
            <Link
              href="/admin/dashboard/inventory"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to inventory
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
