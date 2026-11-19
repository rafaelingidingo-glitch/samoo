import { Badge } from "@/components/ui/badge";
import { AVAILABILITY_LABELS } from "@/lib/format";
import type { VehicleStatus } from "@/types";

const STYLES: Record<VehicleStatus, string> = {
  AVAILABLE: "border-gold/50 bg-gold/10 text-gold-dark",
  RESERVED: "border-amber-300 bg-amber-100 text-amber-900",
  SOLD: "border-ink bg-ink text-white",
};

export function AvailabilityBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const key = (status as VehicleStatus) in STYLES ? (status as VehicleStatus) : "AVAILABLE";
  return (
    <Badge
      variant="outline"
      className={`border font-semibold uppercase tracking-wider ${STYLES[key]} ${className}`}
    >
      {AVAILABILITY_LABELS[key]}
    </Badge>
  );
}
