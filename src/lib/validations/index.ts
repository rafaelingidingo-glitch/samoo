import { z } from "zod";

/**
 * All request validation lives here. Role/status/condition values are
 * string literals (SQLite portability) but strictly enforced by these
 * schemas — the validation layer is the "enum" boundary.
 */

export const ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const;
export const VEHICLE_STATUSES = ["AVAILABLE", "RESERVED", "SOLD"] as const;
export const TRANSMISSIONS = ["Manual", "Automatic"] as const;
export const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric"] as const;
export const CONDITIONS = ["RESTORED", "EXCELLENT", "GOOD", "FAIR", "PROJECT"] as const;

// ------------------------------------------------------------------
// Auth
// ------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().trim().min(3, "Email is required.").max(200).email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.").max(200),
});

export const setupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().trim().min(3, "Email is required.").max(200).email("Enter a valid email address."),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(200)
    .regex(/[A-Za-z]/, "Password must contain a letter.")
    .regex(/[0-9]/, "Password must contain a number."),
});

// ------------------------------------------------------------------
// Users (admin management)
// ------------------------------------------------------------------
export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().trim().min(3, "Email is required.").max(200).email("Enter a valid email address."),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(200)
    .regex(/[A-Za-z]/, "Password must contain a letter.")
    .regex(/[0-9]/, "Password must contain a number."),
  role: z.enum(ROLES),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(200)
    .regex(/[A-Za-z]/, "Password must contain a letter.")
    .regex(/[0-9]/, "Password must contain a number.")
    .optional(),
});

// ------------------------------------------------------------------
// Vehicles
// ------------------------------------------------------------------
const vehicleImageInput = z.object({
  imageUrl: z.string().trim().min(1).max(2048),
  publicId: z.string().trim().max(300).nullable().optional(),
  altText: z.string().trim().max(300).nullable().optional(),
  sortOrder: z.number().int().min(0).max(1000),
  isPrimary: z.boolean(),
});

const vehicleBaseFields = {
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(150),
  brandId: z.string().trim().min(1, "Brand is required."),
  model: z.string().trim().min(1, "Model is required.").max(100),
  categoryId: z.string().trim().max(100).nullable().optional().or(z.literal("").transform(() => null)),
  year: z.coerce.number().int().min(1900, "Year must be 1900 or later.").max(2100),
  price: z.coerce
    .number({ message: "Price is required." })
    .min(0, "Price cannot be negative.")
    .max(9_999_999_999, "Price is too large."),
  currency: z.literal("TZS").default("TZS"),
  mileage: z.coerce.number().int().min(0).max(5_000_000).nullable().optional()
    .or(z.literal("").transform(() => null)),
  fuelType: z.enum(FUEL_TYPES).nullable().optional().or(z.literal("").transform(() => null)),
  transmission: z.enum(TRANSMISSIONS).nullable().optional().or(z.literal("").transform(() => null)),
  engineCapacity: z.string().trim().max(50).nullable().optional().or(z.literal("").transform(() => null)),
  condition: z.enum(CONDITIONS).nullable().optional().or(z.literal("").transform(() => null)),
  description: z.string().trim().min(10, "Description must be at least 10 characters.").max(8000),
  highlights: z.string().trim().max(4000).nullable().optional()
    .or(z.literal("").transform(() => null)),
  status: z.enum(VEHICLE_STATUSES).default("AVAILABLE"),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
};

export const vehicleCreateSchema = z.object({
  ...vehicleBaseFields,
  images: z.array(vehicleImageInput).max(10, "Maximum 10 images per vehicle.").default([]),
});

export const vehicleUpdateSchema = z.object({
  ...vehicleBaseFields,
});

export const vehicleStatusUpdateSchema = z.object({
  status: z.enum(VEHICLE_STATUSES).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const vehicleImagesSyncSchema = z.object({
  images: z.array(vehicleImageInput).max(10, "Maximum 10 images per vehicle."),
});

// ------------------------------------------------------------------
// Site settings
// ------------------------------------------------------------------
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) =>
      v === "" ||
      // Absolute URL (https://… or http://…)
      /^https?:\/\/.+\..+/.test(v) ||
      // Site-relative path for local assets, e.g. /images/demo/hero.png
      (v.startsWith("/") && !v.startsWith("//") && v.length > 1 && !v.includes(" ")),
    "Enter a valid URL (https://…) or a site path starting with /."
  )
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional().or(z.literal("").transform(() => null));

export const settingsUpdateSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required.").max(150),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(30)
    .regex(/^[+0-9 ()-]+$/, "Phone can contain digits, +, spaces and dashes."),
  whatsappNumber: z
    .string()
    .trim()
    .min(7, "Enter a valid WhatsApp number.")
    .max(30)
    .regex(/^\+?[0-9 ()-]+$/, "WhatsApp number can contain digits and + only."),
  instagramUrl: optionalUrl,
  address: optionalText(300),
  businessHours: optionalText(300),
  logoUrl: optionalUrl,
  metaTitle: optionalText(150),
  metaDescription: optionalText(300),
  footerNote: optionalText(500),
  heroImageUrl: optionalUrl,
  aboutIntro: optionalText(2000),
  aboutStory: optionalText(6000),
  aboutMission: optionalText(2000),
  aboutVision: optionalText(2000),
  aboutCommitment: optionalText(2000),
});

// ------------------------------------------------------------------
// Public inventory query params
// ------------------------------------------------------------------
export const publicVehicleQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(), // slug
  category: z.string().trim().max(100).optional(), // slug
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  transmission: z.enum(TRANSMISSIONS).optional(),
  fuel: z.enum(FUEL_TYPES).optional(),
  availability: z.enum(["AVAILABLE", "RESERVED", "SOLD"]).optional(),
  sort: z
    .enum(["newest", "oldest", "price_asc", "price_desc", "year_desc"])
    .default("newest"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

export const adminVehicleQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(VEHICLE_STATUSES).optional(),
  publishState: z.enum(["published", "draft"]).optional(),
  featured: z.enum(["featured", "not_featured"]).optional(),
  sort: z
    .enum(["newest", "oldest", "price_asc", "price_desc", "year_desc"])
    .default("newest"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
export type VehicleStatusInput = z.infer<typeof vehicleStatusUpdateSchema>;
export type VehicleImagesSyncInput = z.infer<typeof vehicleImagesSyncSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type PublicVehicleQuery = z.infer<typeof publicVehicleQuerySchema>;
export type AdminVehicleQuery = z.infer<typeof adminVehicleQuerySchema>;
