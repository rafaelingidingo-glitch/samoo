import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AvailabilityBadge } from "@/components/vehicles/availability-badge";
import { optimizedImageUrl } from "@/lib/cloudinary/image-url";
import { formatTZS } from "@/lib/format";
import type { VehicleCardData } from "@/types";

export function VehicleCard({
  vehicle,
  priority = false,
}: {
  vehicle: VehicleCardData;
  priority?: boolean;
}) {
  const mainImage = vehicle.images[0];
  const imageUrl = mainImage
    ? optimizedImageUrl(mainImage.imageUrl, 900)
    : undefined;
  const alt = mainImage?.altText || `${vehicle.title} — ${vehicle.brand.name} ${vehicle.model}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:shadow-[0_8px_30px_rgba(21,21,21,0.08)]">
      <Link
        href={`/inventory/${vehicle.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-secondary"
        aria-label={`View details for ${vehicle.title}`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No photo yet
          </span>
        )}
        <div className="absolute left-3 top-3">
          <AvailabilityBadge status={vehicle.status} />
        </div>
        {vehicle.status === "SOLD" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="rotate-[-4deg] rounded border-2 border-white px-4 py-1 font-heading text-lg font-bold uppercase tracking-[0.2em] text-white">
              Sold
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-heading text-lg font-bold leading-snug">
            <Link
              href={`/inventory/${vehicle.slug}`}
              className="transition-colors hover:text-gold-dark"
            >
              {vehicle.title}
            </Link>
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {vehicle.brand.name} · {vehicle.model} · {vehicle.year}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="font-heading text-base font-bold text-gold-dark">
            {formatTZS(vehicle.price)}
          </p>
          <Link
            href={`/inventory/${vehicle.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-foreground transition-colors hover:text-gold-dark"
          >
            View Details
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
