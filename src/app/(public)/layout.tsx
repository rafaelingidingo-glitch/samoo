import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSiteSettings } from "@/lib/settings";
import { buildWhatsAppUrl, GENERAL_INQUIRY_MESSAGE } from "@/lib/whatsapp";

export const revalidate = 300;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, GENERAL_INQUIRY_MESSAGE);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader
        businessName={settings.businessName}
        logoUrl={settings.logoUrl}
        whatsappUrl={whatsappUrl}
      />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
