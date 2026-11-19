import Image from "next/image";

type LogoProps = {
  businessName: string;
  logoUrl?: string | null;
  variant?: "light" | "dark";
};

/**
 * Brand wordmark. Uses the configured logo when available,
 * otherwise an elegant typographic wordmark.
 */
export function Logo({ businessName, logoUrl, variant = "light" }: LogoProps) {
  // Full brand name as the wordmark — e.g. "SAWEE CARS."
  const primary = businessName.trim().toUpperCase() || "SAWEE CARS";

  if (logoUrl) {
    return (
      <span className="relative inline-flex items-center gap-3">
        <Image
          src={logoUrl}
          alt={`${businessName} logo`}
          width={44}
          height={44}
          className="h-11 w-auto object-contain"
        />
        <span className="text-sm font-semibold">{businessName}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center leading-none">
      <span
        className={`font-heading text-xl md:text-2xl font-bold tracking-[0.14em] ${
          variant === "dark" ? "text-white" : "text-foreground"
        }`}
      >
        {primary}
        <span className="text-gold">.</span>
      </span>
    </span>
  );
}
