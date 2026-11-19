"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { optimizedImageUrl } from "@/lib/cloudinary/image-url";
import type { VehicleImageListed } from "@/types";

/**
 * Vehicle image gallery:
 * main stage + thumbnail strip, prev/next, keyboard navigation,
 * mobile swipe, and a fullscreen lightbox.
 */
export function VehicleGallery({
  images,
  vehicleTitle,
}: {
  images: VehicleImageListed[];
  vehicleTitle: string;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = images.length;
  const current = images[index];

  const next = useCallback(() => setIndex((i) => (count ? (i + 1) % count : 0)), [count]);
  const prev = useCallback(() => setIndex((i) => (count ? (i - 1 + count) % count : 0)), [count]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, next, prev]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };

  if (count === 0 || !current) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-border bg-secondary">
        <p className="text-sm text-muted-foreground">Photographs coming soon.</p>
      </div>
    );
  }

  const stageAlt = current.altText || `${vehicleTitle} — photo ${index + 1} of ${count}`;

  return (
    <div role="region" aria-label={`${vehicleTitle} photo gallery`} onKeyDown={onKeyDown}>
      {/* Main stage */}
      <div
        className="group relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-secondary"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
          if (delta > 48) prev();
          else if (delta < -48) next();
          touchStartX.current = null;
        }}
      >
        {images.map((img, i) => (
          <Image
            key={img.id}
            src={optimizedImageUrl(img.imageUrl, 1600)}
            alt={img.altText || `${vehicleTitle} — photo ${i + 1} of ${count}`}
            fill
            priority={i === 0}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className={`object-cover transition-opacity duration-300 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
        ))}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white opacity-90 backdrop-blur transition hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-gold md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white opacity-90 backdrop-blur transition hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-gold md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Open fullscreen viewer"
          className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 p-2.5 text-white backdrop-blur transition hover:bg-black/70"
        >
          <Expand className="h-5 w-5" aria-hidden />
        </button>

        <span className="absolute bottom-3 left-3 rounded bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          {index + 1} / {count}
        </span>
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="custom-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-md border-2 transition ${
                i === index
                  ? "border-gold"
                  : "border-transparent opacity-75 hover:opacity-100"
              }`}
            >
              <Image
                src={optimizedImageUrl(img.imageUrl, 400)}
                alt={img.altText || `${vehicleTitle} thumbnail ${i + 1}`}
                fill
                sizes="112px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen image viewer"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Close fullscreen viewer"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
            autoFocus
          >
            <X className="h-6 w-6" aria-hidden />
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              >
                <ChevronLeft className="h-7 w-7" aria-hidden />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              >
                <ChevronRight className="h-7 w-7" aria-hidden />
              </button>
            </>
          )}
          <div
            className="relative h-[85vh] w-[92vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={optimizedImageUrl(current.imageUrl, 1920)}
              alt={stageAlt}
              fill
              sizes="92vw"
              className="object-contain"
            />
          </div>
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-neutral-300">
            {stageAlt} ({index + 1}/{count})
          </p>
        </div>
      )}
    </div>
  );
}
