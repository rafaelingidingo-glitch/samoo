import Link from "next/link";
import { MessageCircle, Phone, Instagram, MapPin, Clock } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { buildWhatsAppUrl, GENERAL_INQUIRY_MESSAGE } from "@/lib/whatsapp";
import type { SiteSettings } from "@/lib/settings";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, GENERAL_INQUIRY_MESSAGE);

  return (
    <footer className="mt-auto dark-section bg-ink text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Logo businessName={settings.businessName} logoUrl={settings.logoUrl} variant="dark" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-400">
              {settings.footerNote ||
                "A curated collection of vintage and classic automobiles in Tanzania, presented with honesty and care."}
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
              Explore
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link className="transition-colors hover:text-gold" href="/">Home</Link></li>
              <li><Link className="transition-colors hover:text-gold" href="/inventory">Inventory</Link></li>
              <li><Link className="transition-colors hover:text-gold" href="/about">About Us</Link></li>
              <li><Link className="transition-colors hover:text-gold" href="/contact">Contact</Link></li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 transition-colors hover:text-gold"
                >
                  <Phone className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                  {settings.phone}
                </a>
              </li>
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-gold"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={settings.instagramUrl || "https://www.instagram.com/sawee_oldcarstz/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-gold"
                >
                  <Instagram className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                  Instagram
                </a>
              </li>
              {settings.address ? (
                <li className="inline-flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <span>{settings.address}</span>
                </li>
              ) : null}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
              Business Hours
            </h3>
            {settings.businessHours ? (
              <p className="mt-4 inline-flex items-start gap-2 text-sm text-neutral-400">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                <span className="whitespace-pre-line">{settings.businessHours}</span>
              </p>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                Available by appointment. Reach out on WhatsApp to arrange a viewing.
              </p>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-neutral-800 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center">
          <p>
            © {year} {settings.businessName}. All rights reserved.
          </p>
          <p className="max-w-xl leading-relaxed">
            Privacy: this website does not use tracking cookies or contact forms. All
            enquiries happen directly over WhatsApp, phone or Instagram.
          </p>
        </div>
      </div>
    </footer>
  );
}
