/**
 * Database seed — SAWEE CARS
 *
 * Creates:
 *   1. Categories and brands (admin-manageable master data)
 *   2. Default site settings row (real client-provided business info)
 *   3. DEMO vehicle listings — CLEARLY MARKED placeholder inventory
 *      used only for development/design verification.
 *
 * DEMO DATA POLICY: every demo vehicle title contains "(Demo Listing)"
 * and its description states it must be replaced by the client.
 * Delete the demo vehicles from Admin > Inventory before launch.
 *
 * Run: bun run db:seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Vintage Cars", slug: "vintage-cars", description: "Pre-1975 automobiles with timeless character.", sortOrder: 1 },
  { name: "Classic Cars", slug: "classic-cars", description: "Recognisable classics from every era of motoring.", sortOrder: 2 },
  { name: "Luxury Cars", slug: "luxury-cars", description: "Refined, elegant and prestigious automobiles.", sortOrder: 3 },
  { name: "SUVs", slug: "suvs", description: "Capable off-roaders and iconic 4x4s.", sortOrder: 4 },
  { name: "Sports Cars", slug: "sports-cars", description: "Performance classics built for driving pleasure.", sortOrder: 5 },
  { name: "Trucks & Pickups", slug: "trucks-pickups", description: "Classic utility vehicles with working heritage.", sortOrder: 6 },
];

const BRANDS = [
  "Toyota",
  "Mercedes-Benz",
  "Ford",
  "Land Rover",
  "Jaguar",
  "Porsche",
  "BMW",
  "Chevrolet",
];

type DemoVehicle = {
  title: string;
  brand: string;
  model: string;
  category: string;
  year: number;
  price: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  engineCapacity: string;
  condition: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  isFeatured: boolean;
  isPublished: boolean;
  images: { imageUrl: string; altText: string }[];
  description: string;
  highlights: string[];
};

const DEMO_NOTE =
  "DEMO LISTING — This is placeholder content created for development and design verification. Replace it with a real vehicle (or delete it) from the admin dashboard before launch.";

const DEMO_VEHICLES: DemoVehicle[] = [
  {
    title: "1978 Toyota Land Cruiser FJ40 (Demo Listing)",
    brand: "Toyota",
    model: "Land Cruiser FJ40",
    category: "SUVs",
    year: 1978,
    price: "45000000",
    mileage: 84500,
    fuelType: "Petrol",
    transmission: "Manual",
    engineCapacity: "4.2 L",
    condition: "RESTORED",
    status: "AVAILABLE",
    isFeatured: true,
    isPublished: true,
    images: [
      { imageUrl: "/images/demo/fj40-1.png", altText: "1978 Toyota Land Cruiser FJ40 in olive green, three-quarter front view" },
      { imageUrl: "/images/demo/fj40-2.png", altText: "1978 Toyota Land Cruiser FJ40 rear three-quarter view with spare wheel" },
    ],
    description:
      "A fully restored Toyota Land Cruiser FJ40 in classic olive green over a clean interior. This example combines the legendary FJ40 silhouette with a strong, honest presentation throughout.\n\nDEMO LISTING — This is placeholder content created for development and design verification. Replace it with a real vehicle (or delete it) from the admin dashboard before launch.",
    highlights: ["Frame-off restoration completed", "Original-correct olive green paint", "Manual 4-speed gearbox", "Ready for immediate viewing"],
  },
  {
    title: "1971 Mercedes-Benz 280SL Pagoda (Demo Listing)",
    brand: "Mercedes-Benz",
    model: "280SL",
    category: "Classic Cars",
    year: 1971,
    price: "85000000",
    mileage: 92100,
    fuelType: "Petrol",
    transmission: "Automatic",
    engineCapacity: "2.8 L",
    condition: "EXCELLENT",
    status: "AVAILABLE",
    isFeatured: true,
    isPublished: true,
    images: [
      { imageUrl: "/images/demo/280sl-1.png", altText: "1971 Mercedes-Benz 280SL Pagoda in cream white, three-quarter front view" },
    ],
    description:
      "The beloved 'Pagoda' W113 with its distinctive concave hardtop, finished in elegant cream white. A refined roadster with automatic transmission and the smooth 2.8-litre straight-six.\n\nDEMO LISTING — This is placeholder content created for development and design verification. Replace it with a real vehicle (or delete it) from the admin dashboard before launch.",
    highlights: ["Original Pagoda hardtop included", "Automatic transmission", "Matching numbers", "Elegant cream white finish"],
  },
  {
    title: "1966 Ford Mustang Fastback (Demo Listing)",
    brand: "Ford",
    model: "Mustang Fastback",
    category: "Classic Cars",
    year: 1966,
    price: "95000000",
    mileage: 110400,
    fuelType: "Petrol",
    transmission: "Manual",
    engineCapacity: "4.7 L",
    condition: "RESTORED",
    status: "AVAILABLE",
    isFeatured: true,
    isPublished: true,
    images: [
      { imageUrl: "/images/demo/mustang-1.png", altText: "1966 Ford Mustang Fastback in deep burgundy red, three-quarter front view" },
      { imageUrl: "/images/demo/mustang-2.png", altText: "1966 Ford Mustang Fastback side profile view" },
    ],
    description:
      "An iconic first-generation Mustang fastback in deep burgundy. Restored with care, this V8 example delivers the full classic American motoring experience.\n\nDEMO LISTING — This is placeholder content created for development and design verification. Replace it with a real vehicle (or delete it) from the admin dashboard before launch.",
    highlights: ["289 V8 engine", "Fastback body style", "Restored condition", "Manual transmission"],
  },
  {
    title: "1990 Land Rover Defender 110 (Demo Listing)",
    brand: "Land Rover",
    model: "Defender 110",
    category: "SUVs",
    year: 1990,
    price: "55000000",
    mileage: 156800,
    fuelType: "Diesel",
    transmission: "Manual",
    engineCapacity: "2.5 L",
    condition: "GOOD",
    status: "RESERVED",
    isFeatured: false,
    isPublished: true,
    images: [
      { imageUrl: "/images/demo/defender-1.png", altText: "1990 Land Rover Defender 110 in khaki beige on a dirt road" },
    ],
    description:
      "A genuinely usable Defender 110 station wagon in khaki beige. Presented honestly with its working history intact — a capable everyday classic.\n\nDEMO LISTING — This is placeholder content created for development and design verification. Replace it with a real vehicle (or delete it) from the admin dashboard before launch.",
    highlights: ["200TDi diesel engine", "110 station wagon configuration", "Well-maintained working classic", "Currently reserved"],
  },
  {
    title: "1974 Jaguar E-Type Series 3 (Demo Listing)",
    brand: "Jaguar",
    model: "E-Type",
    category: "Vintage Cars",
    year: 1974,
    price: "120000000",
    mileage: 68200,
    fuelType: "Petrol",
    transmission: "Manual",
    engineCapacity: "5.3 L",
    condition: "EXCELLENT",
    status: "AVAILABLE",
    isFeatured: false,
    isPublished: true,
    images: [
      { imageUrl: "/images/demo/etype-1.png", altText: "1974 Jaguar E-Type Series 3 in silver blue, three-quarter front view" },
      { imageUrl: "/images/demo/etype-2.png", altText: "1974 Jaguar E-Type Series 3 rear three-quarter view" },
    ],
    description:
      "The final and most developed E-Type: Series 3 V12 with the wider stance and distinctive louvered bonnet. Finished in silver blue over a well-kept cabin.\n\nDEMO LISTING — This is placeholder content created for development and design verification. Replace it with a real vehicle (or delete it) from the admin dashboard before launch.",
    highlights: ["5.3-litre V12 engine", "Series 3 final edition", "Silver blue metallic finish", "Low indicated mileage"],
  },
  {
    title: "1988 Porsche 911 Carrera (Demo Listing)",
    brand: "Porsche",
    model: "911 Carrera",
    category: "Sports Cars",
    year: 1988,
    price: "110000000",
    mileage: 74300,
    fuelType: "Petrol",
    transmission: "Manual",
    engineCapacity: "3.2 L",
    condition: "EXCELLENT",
    status: "AVAILABLE",
    isFeatured: false,
    isPublished: true,
    images: [
      { imageUrl: "/images/demo/p911-1.png", altText: "1988 Porsche 911 Carrera in grand prix white with whale tail spoiler" },
    ],
    description:
      "A G-body 911 Carrera 3.2 in grand prix white with the iconic 'whale tail' rear spoiler. The air-cooled flat-six and five-speed manual make this the definitive analogue 911.\n\nDEMO LISTING — This is placeholder content created for development and design verification. Replace it with a real vehicle (or delete it) from the admin dashboard before launch.",
    highlights: ["Air-cooled 3.2 flat-six", "G50 five-speed gearbox", "Whale tail spoiler", "Grand prix white"],
  },
  {
    title: "1970 Chevrolet C10 Pickup (Demo Listing)",
    brand: "Chevrolet",
    model: "C10",
    category: "Trucks & Pickups",
    year: 1970,
    price: "28000000",
    mileage: 134600,
    fuelType: "Petrol",
    transmission: "Automatic",
    engineCapacity: "5.0 L",
    condition: "GOOD",
    status: "SOLD",
    isFeatured: false,
    isPublished: true,
    images: [
      { imageUrl: "/images/demo/c10-1.png", altText: "1970 Chevrolet C10 pickup in turquoise, three-quarter front view" },
    ],
    description:
      "A charming second-generation C10 in period turquoise with automatic transmission. A useful, good-condition example of the classic American pickup.\n\nDEMO LISTING — This is placeholder content created for development and design verification. Replace it with a real vehicle (or delete it) from the admin dashboard before launch.",
    highlights: ["Turquoise factory-style finish", "V8 engine with automatic", "Solid working condition", "Recently sold — kept as an example"],
  },
  {
    title: "1969 BMW 2002 (Demo Listing)",
    brand: "BMW",
    model: "2002",
    category: "Vintage Cars",
    year: 1969,
    price: "32000000",
    mileage: 97600,
    fuelType: "Petrol",
    transmission: "Manual",
    engineCapacity: "2.0 L",
    condition: "GOOD",
    status: "AVAILABLE",
    isFeatured: false,
    isPublished: false,
    images: [
      { imageUrl: "/images/demo/bmw2002-1.png", altText: "1969 BMW 2002 in white, three-quarter front view" },
    ],
    description:
      "The car that started the sporting BMW legend. This 1969 2002 in white is a tidy, honest example with its original four-speed manual.\n\nDEMO LISTING — This is placeholder content created for development and design verification. Replace it with a real vehicle (or delete it) from the admin dashboard before launch.",
    highlights: ["Original four-speed manual", "Neue Klasse heritage", "Tidy, honest condition", "Photography to be updated"],
  },
];

async function main() {
  console.log("Seeding SAWEE CARS database...");

  // 1. Categories
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder },
      create: c,
    });
  }
  console.log(`✓ Categories: ${CATEGORIES.length}`);

  // 2. Brands
  for (const name of BRANDS) {
    const slug = name
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    await prisma.brand.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
  }
  console.log(`✓ Brands: ${BRANDS.length}`);

  // 3. Site settings (real client business info; content fields left null for client approval)
  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      businessName: "SAWEE CARS",
      phone: "+255710853255",
      whatsappNumber: "255710853255",
      instagramUrl: "https://www.instagram.com/sawee_oldcarstz/",
      heroImageUrl: "/images/demo/hero.png",
    },
  });
  console.log("✓ Site settings (business info from client)");

  // 4. Demo vehicles — only when inventory is empty (never overwrite real data)
  const vehicleCount = await prisma.vehicle.count();
  if (vehicleCount > 0) {
    console.log(`• Inventory already contains ${vehicleCount} vehicle(s) — demo vehicles skipped.`);
  } else {
    const brands = await prisma.brand.findMany();
    const categories = await prisma.category.findMany();
    const brandMap = new Map(brands.map((b) => [b.name, b.id]));
    const catMap = new Map(categories.map((c) => [c.name, c.id]));

    for (const [index, v] of DEMO_VEHICLES.entries()) {
      const brandId = brandMap.get(v.brand);
      const categoryId = catMap.get(v.category);
      if (!brandId) throw new Error(`Missing brand: ${v.brand}`);

      await prisma.vehicle.upsert({
        where: {
          slug: `${v.title.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${v.year}`,
        },
        update: {},
        create: {
          title: v.title,
          slug: `${v.title.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${v.year}`,
          brandId,
          categoryId: categoryId ?? null,
          model: v.model,
          year: v.year,
          price: v.price,
          currency: "TZS",
          mileage: v.mileage,
          fuelType: v.fuelType,
          transmission: v.transmission,
          engineCapacity: v.engineCapacity,
          condition: v.condition,
          description: v.description,
          highlights: v.highlights.join("\n"),
          status: v.status,
          isFeatured: v.isFeatured,
          isPublished: v.isPublished,
          createdAt: new Date(Date.now() - index * 36 * 60 * 60 * 1000), // staggered arrival order
          images: {
            create: v.images.map((img, i) => ({
              imageUrl: img.imageUrl,
              altText: img.altText,
              sortOrder: i,
              isPrimary: i === 0,
            })),
          },
        },
      });
    }
    console.log(`✓ Demo vehicles: ${DEMO_VEHICLES.length} (clearly marked, unpublished ones included)`);
  }

  console.log("\nIMPORTANT — DEMO DATA NOTICE");
  console.log("The seeded vehicle listings are placeholders marked with");
  console.log("'(Demo Listing)'. Replace or delete them from Admin > Inventory");
  console.log("before going live. No admin user was created — visit /admin/setup");
  console.log("once to provision the first SUPER_ADMIN account securely.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
