import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Instagram, MessageCircle, Phone, ShieldCheck, Car, HeartHandshake } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { Reveal } from "@/components/home/reveal";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/settings";
import { buildWhatsAppUrl, GENERAL_INQUIRY_MESSAGE } from "@/lib/whatsapp";
import {
  getFeaturedVehicles,
  getLatestVehicles,
  getCategoriesWithCounts,
} from "@/lib/services/vehicles";
import { optimizedImageUrl } from "@/lib/cloudinary";
import { AutoDealerJsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/env";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "SAWEE CARS — Vintage & Classic Automobiles in Tanzania",
  description:
    "Discover timeless automotive excellence. Browse a distinctive collection of vintage and classic automobiles at SAWEE CARS, Tanzania.",
  alternates: { canonical: "/" },
};

const WHY_US = [
  {
    icon: Car,
    title: "A Curated Selection",
    body: "Every vehicle in our collection is personally inspected and presented honestly — what you see on this website is what you will find in the yard.",
  },
  {
    icon: HeartHandshake,
    title: "Personal Service",
    body: "Speak directly with us on WhatsApp at every step, from your first enquiry to viewing and handover. No call centres, no pressure.",
  },
  {
    icon: ShieldCheck,
    title: "Straightforward & Honest",
    body: "Clear photographs, clear specifications and clear availability. We answer your questions openly so you can decide with confidence.",
  },
];

export default async function HomePage() {
  const [settings, featured, latest, categories] = await Promise.all([
    getSiteSettings(),
    getFeaturedVehicles(6),
    getLatestVehicles(4),
    getCategoriesWithCounts(),
  ]);

  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, GENERAL_INQUIRY_MESSAGE);
  const heroImage = settings.heroImageUrl || "/images/demo/hero.png";

  return (
    <>
      <AutoDealerJsonLd
        businessName={settings.businessName}
        phone={settings.phone}
        instagramUrl={settings.instagramUrl || "https://www.instagram.com/sawee_oldcarstz/"}
        siteUrl={SITE_URL}
      />

      {/* 2 — Hero */}
      <Hero
        imageUrl={heroImage}
        headline="Discover timeless automotive excellence."
        description="Explore a distinctive collection of vintage and classic automobiles at SAWEE CARS."
      />

      {/* 3 — Featured vehicles */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-heading" className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Featured</p>
                  <h2
                    id="featured-heading"
                    className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight md:text-4xl"
                  >
                    Selected Automobiles
                  </h2>
                </div>
                <Link
                  href="/inventory"
                  className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  View full collection
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((vehicle, i) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} priority={i < 3} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* 4 — Browse categories */}
      {categories.length > 0 && (
        <section aria-labelledby="categories-heading" className="bg-secondary py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="max-w-2xl">
                <p className="eyebrow">Collections</p>
                <h2
                  id="categories-heading"
                  className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight md:text-4xl"
                >
                  Browse by Category
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Find the kind of automobile you are looking for, managed and updated by our team.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/inventory?category=${encodeURIComponent(cat.slug)}`}
                    className="group flex flex-col justify-between rounded-lg border border-border bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_8px_30px_rgba(21,21,21,0.08)]"
                  >
                    <div>
                      <h3 className="font-heading text-lg font-bold transition-colors group-hover:text-gold-dark">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <p className="mt-6 flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {cat.vehicleCount} {cat.vehicleCount === 1 ? "vehicle" : "vehicles"}
                      <ArrowRight
                        className="h-4 w-4 text-gold transition-transform group-hover:translate-x-1"
                        aria-hidden
                      />
                    </p>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* 5 — Latest arrivals */}
      {latest.length > 0 && (
        <section aria-labelledby="latest-heading" className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Just In</p>
                  <h2
                    id="latest-heading"
                    className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight md:text-4xl"
                  >
                    Latest Arrivals
                  </h2>
                </div>
                <Link
                  href="/inventory?sort=newest"
                  className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  See all new arrivals
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {latest.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* 6 — About SAWEE CARS */}
      <section aria-labelledby="about-heading" className="bg-ink py-16 text-white dark-section md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src="/images/demo/about.png"
                alt="Inside the SAWEE CARS showroom"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div>
              <p className="eyebrow">About SAWEE CARS</p>
              <h2
                id="about-heading"
                className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight md:text-4xl"
              >
                Passion for the Automobile
              </h2>
              <p className="mt-5 leading-relaxed text-neutral-300">
                {settings.aboutIntro ||
                  "SAWEE CARS is a Tanzanian dealership dedicated to vintage and classic automobiles. We present a curated collection, share honest specifications and photography, and guide enthusiasts through every enquiry personally."}
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-8 border-gold bg-transparent text-gold hover:bg-gold hover:text-gold-foreground"
              >
                <Link href="/about">
                  Learn more about us
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7 — Why choose us */}
      <section aria-labelledby="why-heading" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">Why Choose Us</p>
              <h2
                id="why-heading"
                className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight md:text-4xl"
              >
                Built on Trust &amp; Passion
              </h2>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {WHY_US.map((item, i) => (
              <Reveal key={item.title} delay={0.08 * i}>
                <div className="flex h-full flex-col rounded-lg border border-border bg-white p-7 transition-shadow hover:shadow-[0_8px_30px_rgba(21,21,21,0.08)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                    <item.icon className="h-6 w-6 text-gold-dark" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-bold">{item.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8 — Instagram */}
      <section aria-labelledby="instagram-heading" className="bg-secondary py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col items-center gap-6 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink">
                <Instagram className="h-7 w-7 text-gold" aria-hidden />
              </span>
              <div>
                <h2 id="instagram-heading" className="font-heading text-2xl font-bold uppercase md:text-3xl">
                  Follow the Collection
                </h2>
                <p className="mt-3 max-w-xl text-muted-foreground">
                  New arrivals, behind-the-scenes moments and the latest photography are shared
                  first on our Instagram.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-ink text-white hover:bg-ink/85"
              >
                <a
                  href={settings.instagramUrl || "https://www.instagram.com/sawee_oldcarstz/"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @sawee_oldcarstz
                  <Instagram className="ml-2 h-4 w-4" aria-hidden />
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 9 — Contact CTA */}
      <section aria-labelledby="contact-cta-heading" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-lg border border-gold/30 bg-white p-8 text-center shadow-[0_8px_30px_rgba(185,154,98,0.10)] md:p-14">
              <p className="eyebrow">Get In Touch</p>
              <h2
                id="contact-cta-heading"
                className="mx-auto mt-2 max-w-2xl font-heading text-3xl font-bold uppercase tracking-tight md:text-4xl"
              >
                Interested in a vehicle? Let&apos;s talk.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Message us directly on WhatsApp for availability, viewing arrangements and any
                questions about our collection.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gold px-8 text-gold-foreground hover:bg-gold-dark"
                >
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" aria-hidden />
                    Chat on WhatsApp
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-8">
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>
                    <Phone className="mr-2 h-4 w-4" aria-hidden />
                    {settings.phone}
                  </a>
                </Button>
                <Link
                  href="/contact"
                  className="text-sm font-semibold uppercase tracking-wider text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Contact page
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
