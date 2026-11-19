import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Phone, Instagram, MapPin, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/settings";
import { buildWhatsAppUrl, GENERAL_INQUIRY_MESSAGE } from "@/lib/whatsapp";
import { Reveal } from "@/components/home/reveal";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Sawee Vintage & Classic Cars — reach us directly on WhatsApp, phone or Instagram. No forms, no middlemen.",
  alternates: { canonical: "/contact" },
};

export const revalidate = 300;

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, GENERAL_INQUIRY_MESSAGE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 md:py-16">
      <header className="mb-12 max-w-2xl">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight md:text-5xl">
          Get In Touch
        </h1>
        <p className="mt-4 text-muted-foreground">
          The fastest way to reach us is WhatsApp. We do not use contact forms — every
          enquiry goes straight to the team, and you get a personal reply.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* WhatsApp */}
        <Reveal>
          <div className="flex h-full flex-col rounded-lg border border-border bg-white p-7 transition-shadow hover:shadow-[0_8px_30px_rgba(21,21,21,0.08)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
              <MessageCircle className="h-6 w-6 text-gold-dark" aria-hidden />
            </span>
            <h2 className="mt-5 font-heading text-lg font-bold">WhatsApp</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Preferred channel. Ask about availability, request extra photos or arrange a
              viewing.
            </p>
            <p className="mt-4 font-heading text-lg font-bold">+255 710 853 255</p>
            <Button asChild className="mt-5 w-full bg-gold text-gold-foreground hover:bg-gold-dark">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
                Open WhatsApp Chat
              </a>
            </Button>
          </div>
        </Reveal>

        {/* Phone */}
        <Reveal delay={0.06}>
          <div className="flex h-full flex-col rounded-lg border border-border bg-white p-7 transition-shadow hover:shadow-[0_8px_30px_rgba(21,21,21,0.08)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
              <Phone className="h-6 w-6 text-gold-dark" aria-hidden />
            </span>
            <h2 className="mt-5 font-heading text-lg font-bold">Phone</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Prefer to talk? Call us during business hours.
            </p>
            <p className="mt-4 font-heading text-lg font-bold">{settings.phone}</p>
            <Button asChild variant="outline" className="mt-5 w-full">
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>
                <Phone className="mr-2 h-4 w-4" aria-hidden />
                Call Now
              </a>
            </Button>
          </div>
        </Reveal>

        {/* Instagram */}
        <Reveal delay={0.12}>
          <div className="flex h-full flex-col rounded-lg border border-border bg-white p-7 transition-shadow hover:shadow-[0_8px_30px_rgba(21,21,21,0.08)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
              <Instagram className="h-6 w-6 text-gold-dark" aria-hidden />
            </span>
            <h2 className="mt-5 font-heading text-lg font-bold">Instagram</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              See the latest arrivals and photos first — and DM us anytime.
            </p>
            <p className="mt-4 font-heading text-lg font-bold">@sawee_oldcarstz</p>
            <Button asChild variant="outline" className="mt-5 w-full">
              <a
                href={settings.instagramUrl || "https://www.instagram.com/sawee_oldcarstz/"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="mr-2 h-4 w-4" aria-hidden />
                Visit Profile
                <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden />
              </a>
            </Button>
          </div>
        </Reveal>

        {/* Location */}
        <Reveal delay={0.06}>
          <div className="flex h-full flex-col rounded-lg border border-border bg-white p-7">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
              <MapPin className="h-6 w-6 text-gold-dark" aria-hidden />
            </span>
            <h2 className="mt-5 font-heading text-lg font-bold">Location</h2>
            {settings.address ? (
              <p className="mt-2 leading-relaxed text-muted-foreground">{settings.address}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Our showroom location details will be published here soon. Until then,
                message us on WhatsApp and we will share directions and arrange your visit.
              </p>
            )}
          </div>
        </Reveal>

        {/* Business hours */}
        <Reveal delay={0.12}>
          <div className="flex h-full flex-col rounded-lg border border-border bg-white p-7">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
              <Clock className="h-6 w-6 text-gold-dark" aria-hidden />
            </span>
            <h2 className="mt-5 font-heading text-lg font-bold">Business Hours</h2>
            {settings.businessHours ? (
              <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">
                {settings.businessHours}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Viewings are available by appointment. Message us on WhatsApp and we will
                find a time that suits you.
              </p>
            )}
          </div>
        </Reveal>

        {/* Inventory CTA card */}
        <Reveal delay={0.18}>
          <div className="flex h-full flex-col rounded-lg border border-gold/40 bg-ink p-7 text-white dark-section">
            <h2 className="font-heading text-lg font-bold">Start with the collection</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-300">
              Browse the full inventory, find the vehicle you like, and tap &ldquo;Enquire via
              WhatsApp&rdquo; — the message will reference the exact vehicle automatically.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-5 w-full border-gold bg-transparent text-gold hover:bg-gold hover:text-gold-foreground"
            >
              <Link href="/inventory">Browse Inventory</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
