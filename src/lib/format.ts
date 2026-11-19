/**
 * Display formatters.
 */

type PriceLike = string | number | null | undefined;

/** Formats a price in Tanzanian Shillings: "TSh 45,000,000". */
export function formatTZS(price: PriceLike): string {
  if (price === null || price === undefined || price === "") return "Price on request";
  const n = typeof price === "number" ? price : Number(price);
  if (Number.isNaN(n)) return "Price on request";
  return `TSh ${new Intl.NumberFormat("en-US").format(Math.round(n))}`;
}

export function formatMileage(mileage: number | null | undefined): string {
  if (mileage === null || mileage === undefined) return "—";
  return `${new Intl.NumberFormat("en-US").format(mileage)} km`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
};

export const CONDITION_LABELS: Record<string, string> = {
  RESTORED: "Restored",
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
  PROJECT: "Project",
};

export const TRANSMISSION_OPTIONS = ["Manual", "Automatic"];
export const FUEL_TYPE_OPTIONS = ["Petrol", "Diesel", "Hybrid", "Electric"];
export const CONDITION_OPTIONS = ["RESTORED", "EXCELLENT", "GOOD", "FAIR", "PROJECT"];
