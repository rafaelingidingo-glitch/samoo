# Production Deployment Guide

This guide deploys **SAWEE CARS** to production on **Vercel + Neon PostgreSQL**.

## Architecture

| Concern | Service | Why |
| --- | --- | --- |
| Application hosting | **Vercel** | Native Next.js 16 App Router support; env-var management; automatic HTTPS; CDN edge network |
| Database | **Neon PostgreSQL** (serverless Postgres) | The Prisma schema targets PostgreSQL (`provider = "postgresql"`). Neon provides branching, autoscaling and point-in-time restore |
| Image storage | **Cloudinary** | Vehicle photos are user-managed media. Set the three `CLOUDINARY_*` env vars and the storage driver **switches automatically** from local disk to Cloudinary — no code changes |

> ⚠️ **Cloudinary is required on Vercel.** When Cloudinary is not configured the app falls back to the **local disk driver** (`UPLOAD_DIR`, served via `/api/files`). Serverless filesystems (including Vercel) are **ephemeral** — any uploaded file would be lost between invocations/deploys. Configure Cloudinary in production, or self-host on a persistent volume if you must keep the local driver.

> 💡 **Prisma client generation** — the project defines `"postinstall": "prisma generate"`, so Vercel generates the Prisma client automatically during dependency installation. No extra build-step configuration is needed.

## Step-by-step Deployment

### 1. Create the repository

```bash
git init
git add .
git commit -m "Initial commit — SAWEE CARS dealership site"
git remote add origin git@github.com:<your-org>/sawee-cars.git
git push -u origin main
```

### 2. Provision Neon PostgreSQL

1. Sign in at [neon.tech](https://neon.tech) and create a project (or use the existing `neondb` project).
2. Copy the **pooled connection string** (host contains `-pooler.`). It looks like:

   ```env
   DATABASE_URL="postgresql://<user>:<password>@ep-xxxx-pooler.<region>.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=10"
   ```

3. Ensure the schema exists in the database. From your machine (with the pooled URL in `.env`):

   ```bash
   bun run db:push          # prisma db push — creates/updates all tables
   bun run db:seed          # categories, brands, site settings (+ demo vehicles if inventory is empty)
   ```

   Seeded vehicles are **“(Demo Listing)” placeholders** — delete them from Admin > Inventory before launch (see the [First-run checklist](../README.md#first-run-checklist)).

### 3. Deploy to Vercel

1. Import the repository in Vercel (**Add New → Project**).
2. Set the **environment variables** (Project → Settings → Environment Variables). Set for Production (and Preview if desired):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon **pooled** connection string (with `sslmode=require&pgbouncer=true&connection_limit=10`) |
   | `AUTH_SECRET` | `openssl rand -hex 32` — 32+ characters, **unique per environment** |
   | `NEXT_PUBLIC_SITE_URL` | Final production domain, e.g. `https://www.saweecars.co.tz` |
   | `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
   | `CLOUDINARY_API_KEY` | Your Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
   | `CLOUDINARY_FOLDER` | *(optional)* defaults to `saweecars/vehicles` |

3. Trigger a build (**Deploy**). Vercel runs the `vercel-build` script (`next build`), and `postinstall` generates the Prisma client automatically.
4. Verify the deployment succeeds before connecting the domain.

### 4. Point `NEXT_PUBLIC_SITE_URL` at the final domain

Once the custom domain is attached, make sure `NEXT_PUBLIC_SITE_URL` is the **final canonical origin** (including `https://`, no trailing slash). This value is baked into:

- `sitemap.xml` and `robots.txt` (sitemap reference)
- canonical URLs and Open Graph / Twitter metadata
- **pre-filled WhatsApp enquiry links** (each message includes the vehicle page URL)

Changing it later requires a redeploy.

### 5. Post-deploy verification checklist

- [ ] `https://<domain>/` — homepage renders, hero + featured vehicles appear
- [ ] `https://<domain>/sitemap.xml` — contains the static routes plus every **published** vehicle
- [ ] `https://<domain>/robots.txt` — allows `/`, disallows `/admin` and `/api`, references the sitemap
- [ ] Open one **vehicle detail page** — gallery, TZS price, availability badge, and the WhatsApp button opens `wa.me` with the pre-filled message
- [ ] Image uploads work end-to-end (Cloudinary driver active — check **Admin > Inventory → Add vehicle**, up to **10 images per vehicle**)
- [ ] **Admin login** works at `https://<domain>/admin/login`, and the dashboard loads with no console errors
- [ ] Logout returns you to the login page and `/admin/dashboard` redirects unauthenticated visitors to `/admin/login?next=…`

### 6. Custom domain + HTTPS

1. Add the domain in Vercel (**Settings → Domains**) and follow the DNS instructions (CNAME / A record at your registrar).
2. Vercel provisions and auto-renews TLS certificates — verify the padlock and that `http://` redirects to `https://`.
3. Set the domain as the primary/production domain.

### 7. Google Search Console

1. Verify ownership of the domain (DNS TXT record is easiest).
2. Submit `https://<domain>/sitemap.xml` under **Sitemaps**.
3. Optionally request indexing of the homepage and key vehicle pages after go-live.

## Database Backup Strategy

- **Neon point-in-time restore (PITR)** — Neon keeps a full history (duration depends on plan; enable the longer history/retention on paid plans). Restore by branch or timestamp from the Neon console.
- **Periodic logical dumps** — in addition to PITR, take periodic exports:

  ```bash
  pg_dump --no-owner --no-privileges \
    "<DATABASE_URL>" > saweecars-$(date +%F).sql
  ```

  Store dumps off-site (e.g. encrypted in object storage). Run one before every schema change or major data import.
- **Media** — images live in Cloudinary, not the database. Deleted assets follow Cloudinary's trash/retention settings; account-level media backups are handled by Cloudinary's plans.
- **Audit log retention** — the `AuditLog` table grows with every admin action. Decide on a retention policy (e.g. keep 12 months) and archive/prune older rows periodically; the table is indexed by `createdAt` so pruning is cheap. Audit logs are the record of last resort for security investigations — keep them at least as long as your security policy requires.

## Security Production Checklist

- [ ] **Strong `AUTH_SECRET`** — 32+ random characters (`openssl rand -hex 32`), unique per environment, never committed to git. The app **throws at startup in production if `AUTH_SECRET` is missing or shorter than 32 characters** — the built-in dev fallback secret is disabled in production by design.
- [ ] **HTTPS enforced** — terminate TLS at the platform (Vercel does this automatically); verify `http://` → `https://` redirect and that the session cookie is sent with `Secure` (automatic when `NODE_ENV=production`).
- [ ] **No default credentials** — create the first SUPER_ADMIN via `/admin/setup` once; the endpoint permanently disables itself afterwards. Never seed users in production.
- [ ] **Rotate database credentials** — if the Neon password was ever shared (e.g. in chat), rotate it in the Neon console and update `DATABASE_URL` on Vercel + locally.
- [ ] **Rate-limit store** — the built-in limiter is **in-memory** and suits a **single instance**. On horizontally scaled / multi-instance deployments, back `src/lib/auth/rate-limit.ts` with a shared store (e.g. Redis or the database) so limits and brute-force protection are global.
- [ ] **Cloudinary configured** — confirms media persistence on serverless and keeps the API secret server-side only.
- [ ] **Least privilege for staff** — give team members `EDITOR` or `ADMIN` roles, not `SUPER_ADMIN`; review accounts regularly in **Admin > Users**.
- [ ] **Monitor the audit log** — check **Admin > Audit** after go-live and periodically for unexpected `LOGIN_FAILED` bursts.
- [ ] **Demo data removed** — confirm no **“(Demo Listing)”** vehicles remain in inventory.

## Self-hosting Alternative

The sandbox build also produces a standalone server (`output: "standalone"` outside Vercel), so the app can self-host on a VPS behind Caddy/Nginx:

```bash
bun run build
NODE_ENV=production DATABASE_URL="postgresql://..." bun .next/standalone/server.js
```

On a persistent server the local storage driver can be used without Cloudinary by setting `UPLOAD_DIR` to a durable directory — but Cloudinary remains recommended for performance and reliability.
