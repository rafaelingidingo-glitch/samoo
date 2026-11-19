import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  MessageCircle,
  Calendar,
  Gauge,
  Cog,
  Fuel,
  CircleDot,
  BadgeCheck,
  CarFront,
} from "lucide-react";
import { VehicleGallery } from "@/components/vehicles/vehicle-gallery";
import { AvailabilityBadge } from "@/components/vehicles/availability-badge";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { BreadcrumbJsonLd, VehicleProductJsonLd } from "@/components/seo/json-ld";
import { getVehicleBySlug, getRelatedVehicles } from "@/lib/services/vehicles";
import { getCurrentUser } from "@/lib/auth/guards";
import { getSiteSettings } from "@/lib/settings";
import {
  buildWhatsAppUrl,
  vehicleInquiryMessage,
  SOLD_INQUIRY_MESSAGE,
  GENERAL_INQUIRY_MESSAGE,
} from "@/lib/whatsapp";
import { formatTZS, formatMileage, CONDITION_LABELS, AVAILABILITY_LABELS } from "@/lib/format";
import { optimizedImageUrl } from "@/lib/cloudinary";
import { SITE_URL } from "@/lib/env";
import type { VehicleDetailData } from "@/types";

type Params = Promise<{ slug: string }>;

/**
 * Staff members may preview unpublished vehicles; the public cannot.
 */
async function getVehicleForView(slug: string): Promise<{
  vehicle: VehicleDetailData | null;
  isStaffPreview: boolean;
}> {
  const user = await getCurrentUser();
  const vehicle = await getVehicleBySlug(slug, Boolean(user));
  if (!vehicle) return { vehicle: null, isStaffPreview: false };
  const isStaffPreview = !vehicle.isPublished;
  return { vehicle, isStaffPreview };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const { vehicle } = await getVehicleForView(slug);
  if (!vehicle) {
    return { title: "Vehicle not found" };
  }
  const mainImage = vehicle.images[0]?.imageUrl;
  return {
    title: `${vehicle.title} — ${vehicle.year} ${vehicle.brand.name}`,
    description: `${vehicle.title}. ${vehicle.brand.name} ${vehicle.model}, ${vehicle.year}. ${formatTZS(vehicle.price)}. View specifications and enquire via WhatsApp.`,
    alternates: { canonical: `/inventory/${vehicle.slug}` },
    openGraph: {
      title: `${vehicle.title} | SAWEE CARS`,
      description: vehicle.description.slice(0, 180),
      url: `${SITE_URL}/inventory/${vehicle.slug}`,
      type: "website",
      ...(mainImage ? { images: [{ url: optimizedImageUrl(mainImage, 1200), alt: vehicle.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      ...(mainImage ? { images: [optimizedImageUrl(mainImage, 1200)] } : {}),
    },
    robots: vehicle.isPublished ? undefined : { index: false, follow: false },
  };
}

export const revalidate = 300;

export default async function VehicleDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { vehicle, isStaffPreview } = await getVehicleForView(slug);
  if (!vehicle) notFound();

  const [settings, related] = await Promise.all([
    getSiteSettings(),
    getRelatedVehicles(vehicle, 3),
  ]);

  const isSold = vehicle.status === "SOLD";
  const message = isSold
    ? SOLD_INQUIRY_MESSAGE(vehicle.title)
    : vehicleInquiryMessage(vehicle.title, vehicle.slug);
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, message);
  const generalWhatsAppUrl = buildWhatsAppUrl(settings.whatsappNumber, GENERAL_INQUIRY_MESSAGE);

  const highlights = vehicle.highlights
    ? vehicle.highlights.split("\n").map((h) => h.trim()).filter(Boolean)
    : [];

  const specs: { icon: React.ElementType; label: string; value: string }[] = [
    { icon: CarFront, label: "Brand", value: vehicle.brand.name },
    { icon: BadgeCheck, label: "Model", value: vehicle.model },
    { icon: Calendar, label: "Year", value: String(vehicle.year) },
    ...(vehicle.mileage ? [{ icon: Gauge, label: "Mileage", value: formatMileage(vehicle.mileage) }] : []),
    ...(vehicle.transmission ? [{ icon: Cog, label: "Transmission", value: vehicle.transmission }] : []),
    ...(vehicle.fuelType ? [{ icon: Fuel, label: "Fuel type", value: vehicle.fuelType }] : []),
    ...(vehicle.engineCapacity ? [{ icon: CircleDot, label: "Engine capacity", value: vehicle.engineCapacity }] : []),
    ...(vehicle.condition ? [{ icon: BadgeCheck, label: "Condition", value: CONDITION_LABELS[vehicle.condition] || vehicle.condition }] : []),
    { icon: BadgeCheck, label: "Price", value: formatTZS(vehicle.price) },
    { icon: BadgeCheck, label: "Availability", value: AVAILABILITY_LABELS[vehicle.status] || vehicle.status },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 md:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          </li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li>
            <Link href="/inventory" className="transition-colors hover:text-foreground">Inventory</Link>
          </li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li aria-current="page" className="max-w-[50vw] truncate text-foreground">
            {vehicle.title}
          </li>
        </ol>
      </nav>

      {isStaffPreview && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Draft preview:</strong> this vehicle is not published and is only visible
          to signed-in staff. Publish it from the admin dashboard to make it public.
        </div>
      )}

      {/* JSON-LD */}
      <VehicleProductJsonLd
        title={vehicle.title}
        description={vehicle.description}
        url={`${SITE_URL}/inventory/${vehicle.slug}`}
        imageUrl={vehicle.images[0] ? optimizedImageUrl(vehicle.images[0].imageUrl, 1200) : null}
        brand={vehicle.brand.name}
        model={vehicle.model}
        year={vehicle.year}
        price={vehicle.price.toString()}
        currency={vehicle.currency}
        status={vehicle.status}
        vehicleCondition={vehicle.condition}
        mileage={vehicle.mileage}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Inventory", url: `${SITE_URL}/inventory` },
          { name: vehicle.title, url: `${SITE_URL}/inventory/${vehicle.slug}` },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Gallery */}
        <VehicleGallery images={vehicle.images} vehicleTitle={vehicle.title} />

        {/* Summary panel */}
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-heading text-2xl font-bold uppercase leading-tight tracking-tight md:text-3xl">
              {vehicle.title}
            </h1>
            <AvailabilityBadge status={vehicle.status} className="shrink-0" />
          </div>

          <p className="mt-2 text-muted-foreground">
            {vehicle.brand.name} · {vehicle.model} · {vehicle.year}
            {vehicle.category ? ` · ${vehicle.category.name}` : ""}
          </p>

          <p className="mt-5 font-heading text-3xl font-bold text-gold-dark md:text-4xl">
            {formatTZS(vehicle.price)}
          </p>

          {/* WhatsApp inquiry CTA */}
          <div className="mt-7 rounded-lg border border-border bg-secondary/60 p-5">
            {isSold ? (
              <>
                <p className="font-heading font-bold uppercase tracking-wide">
                  This vehicle has been sold
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Interested in something similar? Message us — we are happy to discuss
                  upcoming arrivals and comparable classics.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/85"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  Enquire About Similar Vehicles
                </a>
              </>
            ) : (
              <>
                <p className="font-heading font-bold uppercase tracking-wide">
                  Interested in this {vehicle.year} {vehicle.brand.name}?
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tap below to open WhatsApp with a pre-filled message about this exact
                  vehicle. We reply personally.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground transition-colors hover:bg-gold-dark"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  Enquire via WhatsApp
                </a>
                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-white px-6 py-3 text-sm font-semibold transition-colors hover:border-gold hover:text-gold-dark"
                >
                  Call {settings.phone}
                </a>
              </>
            )}
          </div>

          {/* Quick facts */}
          <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {specs.slice(0, 4).map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <s.icon className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</dt>
                  <dd className="font-semibold">{s.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Description + full specifications */}
      <div className="mt-14 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="description-heading">
          <h2 id="description-heading" className="font-heading text-xl font-bold uppercase tracking-tight">
            Vehicle Description
          </h2>
          <div className="mt-4 space-y-4 leading-relaxed text-foreground/90">
            {vehicle.description.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {highlights.length > 0 && (
            <div className="mt-8">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider">Highlights</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section aria-labelledby="specs-heading">
          <h2 id="specs-heading" className="font-heading text-xl font-bold uppercase tracking-tight">
            Specifications
          </h2>
          <dl className="mt-4 divide-y divide-border rounded-lg border border-border bg-white">
            {specs.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <dt className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <s.icon className="h-4 w-4 text-gold-dark" aria-hidden />
                  {s.label}
                </dt>
                <dd className="text-right text-sm font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* Related vehicles */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-16 md:mt-20">
          <div className="flex items-end justify-between gap-4">
            <h2 id="related-heading" className="font-heading text-2xl font-bold uppercase tracking-tight">
              You May Also Like
            </h2>
            <Link
              href="/inventory"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
