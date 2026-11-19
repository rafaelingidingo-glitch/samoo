/**
 * Schema.org structured data helpers (rendered as <script type="application/ld+json">).
 */

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is built server-side from DB values, not user input inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function AutoDealerJsonLd({
  businessName,
  phone,
  instagramUrl,
  siteUrl,
  address,
}: {
  businessName: string;
  phone: string;
  instagramUrl: string;
  siteUrl: string;
  address?: string | null;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "AutoDealer",
        name: businessName,
        telephone: phone,
        url: siteUrl,
        sameAs: [instagramUrl],
        ...(address ? { address: { "@type": "PostalAddress", streetAddress: address, addressCountry: "TZ" } } : {}),
        areaServed: "Tanzania",
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

/**
 * Product structured data. Only fields that exist in the database are
 * emitted — reviews and ratings are never invented.
 */
export function VehicleProductJsonLd({
  title,
  description,
  url,
  imageUrl,
  brand,
  model,
  year,
  price,
  currency,
  status,
  vehicleCondition,
  mileage,
}: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  brand: string;
  model: string;
  year: number;
  price: string;
  currency: string;
  status: string;
  vehicleCondition?: string | null;
  mileage?: number | null;
}) {
  const availability =
    status === "AVAILABLE"
      ? "https://schema.org/InStock"
      : status === "RESERVED"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/SoldOut";

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: title,
        description: description.slice(0, 300),
        ...(imageUrl ? { image: [imageUrl] } : {}),
        url,
        brand: { "@type": "Brand", name: brand },
        model,
        productionDate: String(year),
        ...(vehicleCondition ? { itemCondition: `https://schema.org/${mapCondition(vehicleCondition)}` } : {}),
        ...(mileage ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: mileage, unitCode: "KMT" } } : {}),
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: currency,
          price,
          availability,
          seller: { "@type": "AutoDealer", name: "SAWEE CARS" },
        },
      }}
    />
  );
}

function mapCondition(condition: string): string {
  switch (condition) {
    case "RESTORED":
    case "EXCELLENT":
      return "NewCondition";
    case "GOOD":
    case "FAIR":
      return "UsedCondition";
    default:
      return "UsedCondition";
  }
}
