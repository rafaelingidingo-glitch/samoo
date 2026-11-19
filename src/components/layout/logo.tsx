import Image from "next/image";

type LogoProps = {
  businessName: string;
  logoUrl?: string | null;
  variant?: "light" | "dark";
  compact?: boolean;
};

/**
 * Brand wordmark. Uses the configured logo when available,
 * otherwise an elegant typographic wordmark.
 */
export function Logo({ businessName, logoUrl, variant = "light", compact = false }: LogoProps) {
  const nameWords = businessName.trim().split(" ");
  const primary = nameWords[0]?.toUpperCase() || "SAWEE";

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
        {!compact && (
          <span className="text-sm font-semibold">{businessName}</span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col leading-none">
      <span
        className={`font-heading text-xl md:text-2xl font-bold tracking-[0.14em] ${
          variant === "dark" ? "text-white" : "text-foreground"
        }`}
      >
        {primary}
        <span className="text-gold">.</span>
      </span>
      {!compact && (
        <span
          className={`mt-1 text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.28em] ${
            variant === "dark" ? "text-neutral-400" : "text-muted-foreground"
          }`}
        >
          Vintage &amp; Classic Cars
        </span>
      )}
    </span>
  );
}
