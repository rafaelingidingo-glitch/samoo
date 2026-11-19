import { Badge } from "@/components/ui/badge";

const STYLES: Record<string, string> = {
  AVAILABLE: "border-gold/50 bg-gold/10 text-gold-dark",
  RESERVED: "border-amber-300 bg-amber-100 text-amber-900",
  SOLD: "border-ink bg-ink text-white",
};

const LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
};

export function VehicleStatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES.AVAILABLE;
  const label = LABELS[status] ?? status;
  return (
    <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${style}`}>
      {label}
    </Badge>
  );
}
