import type { Vehicle, VehicleImage, Brand, Category, SiteSetting } from "@prisma/client";

export type VehicleImageListed = Pick<
  VehicleImage,
  "id" | "imageUrl" | "publicId" | "altText" | "sortOrder" | "isPrimary"
>;

export type VehicleCardData = Vehicle & {
  brand: Pick<Brand, "id" | "name" | "slug">;
  category: Pick<Category, "id" | "name" | "slug"> | null;
  images: VehicleImageListed[];
};

export type VehicleDetailData = Vehicle & {
  brand: Pick<Brand, "id" | "name" | "slug">;
  category: Pick<Category, "id" | "name" | "slug"> | null;
  images: VehicleImageListed[];
};

export type { Vehicle, VehicleImage, Brand, Category, SiteSetting };

export type Role = "SUPER_ADMIN" | "ADMIN" | "EDITOR";
export type VehicleStatus = "AVAILABLE" | "RESERVED" | "SOLD";

export type Paginated<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type AdminStats = {
  totalVehicles: number;
  available: number;
  reserved: number;
  sold: number;
  published: number;
  drafts: number;
  featured: number;
};
