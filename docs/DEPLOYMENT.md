# Production Deployment Guide

This guide deploys **Sawee Vintage & Classic Cars** to production.

## Recommended Architecture

| Concern | Recommendation | Why |
| --- | --- | --- |
| Application hosting | **Vercel** | Native Next.js 16 App Router support; env-var management; automatic HTTPS; CDN edge network |
| Database | **Managed MySQL** (PlanetScale, Amazon RDS, or Aiven) | The Prisma schema is written to be 100% portable to MySQL (see the production note at the top of `prisma/schema.prisma`). A managed service gives you backups, PITR and scaling |
| Image storage | **Cloudinary** | Vehicle photos are user-managed media. Set the three `CLOUDINARY_*` env vars and the storage driver **switches automatically** from local disk to Cloudinary — no code changes |

> ⚠️ **Cloudinary is required on serverless hosts.** When Cloudinary is not configured the app falls back to the **local disk driver** (`UPLOAD_DIR`, served via `/api/files`). Serverless filesystems (including Vercel) are **ephemeral** — any uploaded file would be lost between invocations/deploys. Configure Cloudinary in production, or self-host on a persistent volume if you must keep the local driver.

## Step-by-step Deployment

### 1. Create the repository

```bash
git init
git add .
git commit -m "Initial commit — Sawee dealership site"
git remote add origin git@github.com:<your-org>/sawee-cars.git
git push -u origin main
```

### 2. Switch the database to MySQL (locally, first)

1. In `prisma/schema.prisma` change `provider = "sqlite"` → `provider = "mysql"`.
2. Restore the native type on `Vehicle.price` — the schema has a comment marking the exact spot; change `price Decimal` to:

   ```prisma
   price Decimal @db.Decimal(14, 2)
   ```

3. Point `DATABASE_URL` at your local/dev MySQL and **create the migration files**:

   ```bash
   bun run db:migrate          # prisma migrate dev — creates the SQL migrations locally
   ```

   Commit the generated `prisma/migrations/` folder.

### 3. Provision managed MySQL

1. Create the database/branch in PlanetScale / RDS / Aiven and note the connection string.
2. Copy the connection string in this form:

   ```env
   DATABASE_URL="mysql://<user>:<password>@<host>:3306/<database>?connection_limit=10"
   ```

3. Apply migrations from your machine (or a CI step):

   ```bash
   DATABASE_URL="mysql://..." npx prisma migrate deploy
   ```

4. *(Optional, recommended)* seed master data + default settings on production — categories, brands and the site-settings row are real client data; the 8 demo vehicles are added only if the inventory is empty:

   ```bash
   DATABASE_URL="mysql://..." bun run db:seed
   ```

   Remember: seeded vehicles are **“(Demo Listing)” placeholders** — see the [First-run checklist](../README.md#first-run-checklist).

### 4. Deploy to Vercel

1. Import the repository in Vercel (**Add New → Project**).
2. Set the **environment variables** (Project → Settings → Environment Variables). Set for Production (and Preview if desired):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Managed MySQL connection string |
   | `AUTH_SECRET` | `openssl rand -hex 32` — 32+ characters, **unique per environment** |
   | `NEXT_PUBLIC_SITE_URL` | Final production domain, e.g. `https://www.saweeoldcars.co.tz` |
   | `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
   | `CLOUDINARY_API_KEY` | Your Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
   | `CLOUDINARY_FOLDER` | *(optional)* defaults to `sawee/vehicles` |
   | `UPLOAD_DIR` | *(not needed on Vercel — the local driver is unused once Cloudinary is configured)* |

3. Trigger a build (**Deploy**). The build runs `next build` and produces the standalone server bundle.
4. Verify the deployment succeeds before connecting the domain.

### 5. Point `NEXT_PUBLIC_SITE_URL` at the final domain

Once the custom domain is attached, make sure `NEXT_PUBLIC_SITE_URL` is the **final canonical origin** (including `https://`, no trailing slash). This value is baked into:

- `sitemap.xml` and `robots.txt` (sitemap reference)
- canonical URLs and Open Graph / Twitter metadata
- **pre-filled WhatsApp enquiry links** (each message includes the vehicle page URL)

Changing it later requires a redeploy.

### 6. Post-deploy verification checklist

- [ ] `https://<domain>/` — homepage renders, hero + featured vehicles appear
- [ ] `https://<domain>/sitemap.xml` — contains the static routes plus every **published** vehicle
- [ ] `https://<domain>/robots.txt` — allows `/`, disallows `/admin` and `/api`, references the sitemap
- [ ] Open one **vehicle detail page** — gallery, TZS price, availability badge, and the WhatsApp button opens `wa.me` with the pre-filled message
- [ ] Image uploads work end-to-end (Cloudinary driver active — check **Admin > Inventory → Add vehicle**)
- [ ] **Admin login** works at `https://<domain>/admin/login`, and the dashboard loads with no console errors
- [ ] Logout returns you to the login page and `/admin/dashboard` redirects unauthenticated visitors to `/admin/login?next=…`

### 7. Custom domain + HTTPS

1. Add the domain in Vercel (**Settings → Domains**) and follow the DNS instructions (CNAME / A record at your registrar).
2. Vercel provisions and auto-renews TLS certificates — verify the padlock and that `http://` redirects to `https://`.
3. Set the domain as the primary/production domain.

### 8. Google Search Console

1. Verify ownership of the domain (DNS TXT record is easiest).
2. Submit `https://<domain>/sitemap.xml` under **Sitemaps**.
3. Optionally request indexing of the homepage and key vehicle pages after go-live.

## Database Backup Strategy

- **Managed point-in-time recovery (PITR)** — PlanetScale / RDS / Aiven provide automated backups and PITR. Enable daily backups with an appropriate retention window (e.g. 7–30 days) and verify restores periodically.
- **Periodic logical dumps** — in addition to PITR, take periodic exports:

  ```bash
  mysqldump --single-transaction --routines \
    -h <host> -u <user> -p <database> > sawee-$(date +%F).sql
  ```

  Store dumps off-site (e.g. encrypted in object storage). Run one before every deployment that includes migrations.
- **Media** — images live in Cloudinary, not the database. Deleted assets follow Cloudinary's trash/retention settings; account-level media backups are handled by Cloudinary's plans.
- **Audit log retention** — the `AuditLog` table grows with every admin action. Decide on a retention policy (e.g. keep 12 months) and archive/prune older rows periodically; the table is indexed by `createdAt` so pruning is cheap. Audit logs are the record of last resort for security investigations — keep them at least as long as your security policy requires.

## Security Production Checklist

- [ ] **Strong `AUTH_SECRET`** — 32+ random characters (`openssl rand -hex 32`), unique per environment, never committed to git. The app **throws at startup in production if `AUTH_SECRET` is missing or shorter than 32 characters** — the built-in dev fallback secret is disabled in production by design.
- [ ] **HTTPS enforced** — terminate TLS at the platform (Vercel does this automatically); verify `http://` → `https://` redirect and that the session cookie is sent with `Secure` (automatic when `NODE_ENV=production`).
- [ ] **No default credentials** — create the first SUPER_ADMIN via `/admin/setup` once; the endpoint permanently disables itself afterwards. Never seed users in production.
- [ ] **Rate-limit store** — the built-in limiter is **in-memory** and suits a **single instance**. On horizontally scaled / multi-instance deployments, back `src/lib/auth/rate-limit.ts` with a shared store (e.g. Redis or the database) so limits and brute-force protection are global.
- [ ] **Cloudinary configured** — confirms media persistence on serverless and keeps the API secret server-side only.
- [ ] **Least privilege for staff** — give team members `EDITOR` or `ADMIN` roles, not `SUPER_ADMIN`; review accounts regularly in **Admin > Users**.
- [ ] **Monitor the audit log** — check **Admin > Audit** after go-live and periodically for unexpected `LOGIN_FAILED` bursts.
- [ ] **Demo data removed** — confirm no **“(Demo Listing)”** vehicles remain in inventory.

## Self-hosting Alternative

The build also produces a standalone server (`output: "standalone"` in `next.config.ts`), so the app can self-host on a VPS behind Caddy/Nginx:

```bash
bun run build
NODE_ENV=production bun .next/standalone/server.js
```

On a persistent server the local storage driver can be used without Cloudinary by setting `UPLOAD_DIR` to a durable directory — but Cloudinary remains recommended for performance and reliability.
