import Link from "next/link";
import { Plus, Car, CheckCircle2, Bookmark, Tag, Eye, FileEdit, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats } from "@/lib/services/vehicles";
import { db } from "@/lib/db";
import { formatTZS, formatDate, AVAILABILITY_LABELS } from "@/lib/format";
import { optimizedImageUrl } from "@/lib/cloudinary";
import { VehicleStatusBadge } from "@/components/admin/vehicle-status-badge";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [stats, recent] = await Promise.all([
    getDashboardStats(),
    db.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        year: true,
        price: true,
        status: true,
        isPublished: true,
        isFeatured: true,
        createdAt: true,
        brand: { select: { name: true } },
        images: {
          select: { imageUrl: true, altText: true },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
        },
      },
    }),
  ]);

  const statCards = [
    { label: "Total Vehicles", value: stats.totalVehicles, icon: Car, tone: "bg-ink text-white" },
    { label: "Available", value: stats.available, icon: CheckCircle2, tone: "bg-gold/15 text-gold-dark" },
    { label: "Reserved", value: stats.reserved, icon: Bookmark, tone: "bg-amber-100 text-amber-900" },
    { label: "Sold", value: stats.sold, icon: Tag, tone: "bg-neutral-200 text-neutral-800" },
    { label: "Published", value: stats.published, icon: Eye, tone: "bg-emerald-100 text-emerald-900" },
    { label: "Drafts", value: stats.drafts, icon: FileEdit, tone: "bg-neutral-100 text-neutral-600" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live inventory statistics from the database.
          </p>
        </div>
        <Button asChild className="bg-gold text-gold-foreground hover:bg-gold-dark">
          <Link href="/admin/dashboard/inventory/new">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            Add Vehicle
          </Link>
        </Button>
      </div>

      {/* Stats grid — real counts only */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border py-0 shadow-none">
            <CardContent className="p-5">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.tone}`}>
                <card.icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-4 font-heading text-3xl font-bold">{card.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recently added */}
      <Card className="border-border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading text-lg font-bold uppercase tracking-tight">
              Recently Added
            </CardTitle>
            <CardDescription>The five most recent vehicles in the database.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/dashboard/inventory">
              All inventory
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-secondary/50 px-6 py-12 text-center">
              <Car className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden />
              <p className="mt-3 text-sm font-semibold">No vehicles yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first vehicle to see it listed here.
              </p>
              <Button asChild className="mt-4 bg-gold text-gold-foreground hover:bg-gold-dark">
                <Link href="/admin/dashboard/inventory/new">Add Vehicle</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((v) => {
                const img = v.images[0];
                return (
                  <li key={v.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
                      {img ? (
                        <Image
                          src={optimizedImageUrl(img.imageUrl, 320)}
                          alt={img.altText || v.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{v.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.brand.name} · {formatTZS(v.price)} · added {formatDate(v.createdAt)}
                      </p>
                    </div>
                    <div className="hidden shrink-0 items-center gap-2 sm:flex">
                      <VehicleStatusBadge status={v.status} />
                      {!v.isPublished && (
                        <Badge variant="outline" className="text-[10px]">DRAFT</Badge>
                      )}
                      {v.isFeatured && (
                        <Badge className="border-transparent bg-gold text-gold-foreground text-[10px]">FEATURED</Badge>
                      )}
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0">
                      <Link href={`/admin/dashboard/inventory/${v.id}/edit`}>Edit</Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
