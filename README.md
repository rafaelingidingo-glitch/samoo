# Sawee Vintage & Classic Cars — Website

Production-ready dealership website for **Sawee Vintage & Classic Cars** (Tanzania), specialising in vintage and classic automobiles. The site presents curated inventory with prices in **TZS**, and drives every enquiry through **WhatsApp** deep links with pre-filled, per-vehicle messages.

## Project Overview

**Business goal:** give the dealership a fast, SEO-friendly showroom on the web, where staff can manage inventory and imagery themselves, and where interested buyers are one tap away from a WhatsApp conversation.

**Key features**

- **Public showroom** — homepage with hero + featured vehicles, filterable inventory (search, brand, category, price range, year, transmission, fuel, availability), and rich vehicle detail pages (photo gallery, specs, highlights, related vehicles).
- **TZS pricing & availability states** — every listing shows a formatted TZS price and an `Available / Reserved / Sold` badge.
- **WhatsApp-first enquiries** — general, per-vehicle and sold-vehicle enquiry buttons open `wa.me` with pre-filled messages that include the vehicle name and a direct link.
- **Full admin dashboard** — inventory management, image upload & reordering, media library, site settings, user management, and a security audit log.
- **Role-based access control** — `SUPER_ADMIN`, `ADMIN`, and `EDITOR` roles, re-verified server-side on every request.
- **Secure first-run setup** — the first SUPER_ADMIN account is created once via `/admin/setup`; the endpoint permanently disables itself afterwards. No default or hardcoded passwords exist anywhere.
- **Cloudinary-or-local image storage** — signed server-side uploads to Cloudinary in production, with an automatic local-disk fallback in development.
- **SEO built in** — dynamic `sitemap.xml`, `robots.txt`, canonical URLs, Open Graph/Twitter metadata, and JSON-LD (`Vehicle` product + breadcrumbs) on detail pages.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI runtime | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix primitives) |
| ORM / database | Prisma 6 — **SQLite in development, MySQL for production** |
| Auth | Custom JWT sessions — `bcryptjs` (password hashing) + `jose` (HS256 signing), HttpOnly cookie |
| Image storage | Cloudinary signed uploads, with local-disk fallback (`/uploads` served via `/api/files`) |
| Notifications UX | `sonner` toasts |
| Drag & drop | `dnd-kit` (vehicle photo reordering) |
| Animation | `framer-motion` (homepage reveal effects) |
| Validation | Zod schemas as the single validation boundary (also substitutes enums for SQLite portability) |

## Prerequisites

- **Node.js 20+** or **Bun** (the scripts in this repo assume Bun)
- A local SQLite database file (created automatically by `db:push`)
- *(Optional)* a **Cloudinary** account — only needed for production image hosting; without it the app transparently uses local storage
- *(Production only)* a **MySQL** server (managed MySQL is recommended — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.example .env      # then edit values (see table below)

# 3. Create the database schema
bun run db:push

# 4. Seed master data + clearly-marked demo vehicles
bun run db:seed

# 5. Start the dev server
bun run dev
```

Then:

1. Open <http://localhost:3000> to view the public site.
2. Visit <http://localhost:3000/admin/setup> to create the first administrator (see [First-run checklist](#first-run-checklist)).
3. Log in at <http://localhost:3000/admin/login> to reach the dashboard.

## Environment Variables

Create a `.env` file in the project root. All variables (with comments) are listed in [.env.example](.env.example).

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Prisma connection string. **SQLite (dev):** `file:/home/z/my-project/db/custom.db` — **MySQL (prod):** `mysql://user:password@host:3306/dbname` |
| `AUTH_SECRET` | ✅ in production | Secret used to sign session JWTs. Must be **32+ characters**. Generate with `openssl rand -hex 32`. In development a fallback dev-only secret is used so the sandbox boots without setup; in production a missing/weak secret **throws** at startup. |
| `NEXT_PUBLIC_SITE_URL` | ✅ in production | Canonical site origin, e.g. `https://www.saweeoldcars.co.tz`. Used for sitemap, robots, canonical URLs, Open Graph and WhatsApp message links. Defaults to `http://localhost:3000`. |
| `CLOUDINARY_CLOUD_NAME` | ⬜ optional | Cloudinary account name. When **all three** `CLOUDINARY_*` credentials are absent, the local storage driver is used automatically. |
| `CLOUDINARY_API_KEY` | ⬜ optional | Cloudinary API key (paired with the secret for signed uploads). |
| `CLOUDINARY_API_SECRET` | ⬜ optional | Cloudinary API secret — **server-side only**, never exposed to the browser. |
| `CLOUDINARY_FOLDER` | ⬜ optional | Cloudinary folder for vehicle images. Defaults to `sawee/vehicles`. |
| `UPLOAD_DIR` | ⬜ optional | Absolute directory for the local storage driver. Defaults to `<project>/uploads`. Uploaded files are stored under `vehicles/` inside this directory and served through `/api/files/...`. |

> **Storage driver behaviour:** `uploadImage()` checks the three Cloudinary credentials at runtime. If configured → signed Cloudinary upload; if not → files are written to `UPLOAD_DIR` and served via `/api/files/[...key]`. The admin dashboard shows which driver is active.

## Database

### Development — SQLite

The schema ships with `provider = "sqlite"` and is fully portable. Enum-like values (roles, statuses, conditions) are stored as plain strings and validated strictly with Zod, because SQLite does not support Prisma enums.

| Script | What it does |
| --- | --- |
| `bun run db:push` | Push the Prisma schema to the database (no migration history — ideal for dev iteration) |
| `bun run db:generate` | (Re)generate the Prisma Client |
| `bun run db:seed` | Seed categories, brands, default site settings and the marked demo vehicles |
| `bun run db:migrate` | `prisma migrate dev` — create/apply a migration (used once on MySQL) |
| `bun run db:reset` | `prisma migrate reset` — drop & recreate the database, re-apply migrations & seed |

### Switching to MySQL for production

1. In `prisma/schema.prisma`, change the datasource provider:

   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```

2. Set `DATABASE_URL` to a MySQL connection string:

   ```env
   DATABASE_URL="mysql://user:password@host:3306/sawee?connection_limit=10"
   ```

3. Restore the native column type on `Vehicle.price`. The schema file contains a comment marking the exact spot (`price Decimal // MySQL: Decimal @db.Decimal(14, 2)`); change it to:

   ```prisma
   price Decimal @db.Decimal(14, 2)
   ```

   *(Native type attributes are not supported on SQLite, which is why it is commented out for development.)*

4. Create and apply migrations:

   ```bash
   bun run db:migrate          # locally: creates the migration files against MySQL
   npx prisma migrate deploy   # on the production server: applies them
   ```

## First-run Checklist

1. **Run the seed** (`bun run db:seed`). It creates 6 categories, 8 brands, the site-settings row with the real client business info, and **8 placeholder vehicles**. It never overwrites existing inventory and **creates no admin user**.
2. **Create the first SUPER_ADMIN** at `/admin/setup`. This page works **only while the users table is empty** and permanently disables itself once one account exists — there are no default credentials or hardcoded passwords anywhere in the codebase. Password requirements: minimum 10 characters, at least one letter and one digit.
3. **Clear the demo inventory before launch.** The seeded vehicles are placeholders — delete (or unpublish) the **8 vehicles titled with “(Demo Listing)”** from **Admin > Inventory**.
4. **Configure real settings** in **Admin > Settings**: business name, phone, WhatsApp number, Instagram, address, business hours, hero image, about-page copy, and SEO defaults.

## Security Summary

- **Sessions** — stateless JWT (HS256, signed with `AUTH_SECRET`) stored in an **HttpOnly, SameSite=Lax** cookie (`sawee_session`), `Secure` in production, **8-hour expiry**.
- **Password hashing** — bcrypt with cost factor **12**.
- **Rate limiting** — in-memory sliding window: login throttled per IP (20/hour) and per IP+email (5 per 15 min); first-admin setup throttled (10/hour per IP). Generic error responses prevent account enumeration.
- **Defence in depth on auth** — the edge middleware (`src/proxy.ts`) only validates the JWT signature for `/admin/dashboard/*`; **every admin page and API route independently re-reads the user from the database** and re-checks `isActive` and `role`. UI-level hiding is never treated as access control.
- **RBAC** — `SUPER_ADMIN` / `ADMIN` / `EDITOR`, enforced per route server-side (`requireUser([...])`, `canPublish`, `canFeature`, `canManageUsers`, `canManageSettings`).
- **Audit log** — security-relevant events (logins, failed logins, setup, vehicle/media/user/settings changes) are recorded in the `AuditLog` table and viewable at **Admin > Audit**.
- **CSRF protection** — all cookie-authenticated mutations verify the `Origin` header against the request host, combined with `SameSite=Lax` cookies.
- **Upload validation** — MIME allow-list (JPEG, PNG, WebP, AVIF), **8 MB per file**, **20 images per vehicle**, empty-file rejection; local storage keys are sanitised against path traversal.
- **Security headers** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/microphone/geolocation disabled), and `X-Powered-By` removed.
- **Error hygiene** — API errors never leak stack traces or database internals.

## Project Structure (abbreviated)

```
├── prisma/
│   ├── schema.prisma          # Data model (User, Brand, Category, Vehicle,
│   │                          #  VehicleImage, SiteSetting, AuditLog, PendingMediaDeletion)
│   └── seed.ts                # Categories, brands, settings + marked demo vehicles
├── db/custom.db               # SQLite database (dev)
├── public/                    # Static assets incl. /images/demo
├── docs/
│   ├── DEPLOYMENT.md          # Production deployment guide
│   └── ADMIN_GUIDE.md         # Non-technical admin user guide
├── src/
│   ├── proxy.ts               # Edge middleware (JWT pre-check for /admin/dashboard)
│   ├── app/
│   │   ├── (public)/          # Home, /inventory, /inventory/[slug], /about, /contact
│   │   ├── admin/             # /admin/login, /admin/setup, /admin/dashboard/*
│   │   ├── api/               # Public, auth and /api/admin route handlers
│   │   ├── sitemap.ts         # Dynamic sitemap (published vehicles)
│   │   └── robots.ts          # robots.txt (disallows /admin and /api)
│   ├── components/            # ui/ (shadcn), layout/, home/, vehicles/, admin/, inventory/, seo/
│   └── lib/
│       ├── auth/              # session, guards, rate-limit, password
│       ├── cloudinary/        # Storage abstraction (Cloudinary + local fallback)
│       ├── services/          # Vehicle & media-cleanup services
│       ├── validations/       # Zod schemas (roles, statuses, limits)
│       ├── settings.ts        # SiteSettings singleton service
│       ├── whatsapp.ts        # wa.me deep-link builders
│       ├── api.ts             # Error handling + CSRF origin check helpers
│       └── env.ts             # Central environment access
└── uploads/                   # Local storage driver target (created on demand)
```

## Demo Data Policy

Seeded vehicle listings are **clearly marked placeholders**: every demo title contains **“(Demo Listing)”**, and each description states that it is demo content that must be replaced by the client. They exist purely for development and design verification.

> ⚠️ **Demo listings must not be presented as real inventory.** Delete them from **Admin > Inventory** before the site goes live. The seed is non-destructive — it only adds demo vehicles when the inventory table is empty, so re-seeding can never overwrite real data.

## Further Documentation

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — production deployment (Vercel + MySQL + Cloudinary), backups, security checklist.
- [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) — day-to-day admin tasks for non-technical staff.
