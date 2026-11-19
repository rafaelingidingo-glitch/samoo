# Admin Guide — SAWEE CARS

This guide is for dealership staff who manage the website day-to-day. No technical knowledge is required — everything happens in the **Admin Dashboard** at `/admin/dashboard`.

---

## 1. First Setup

Before anyone can log in, the website must be set up **once**:

1. Open **`/admin/setup`** in your browser (e.g. `https://your-website.co.tz/admin/setup`).
2. Enter your **name**, **email**, and a **password** (minimum 10 characters, containing at least one letter and one digit).
3. Submit. This creates the first **Super Admin** account and logs you straight into the dashboard.

**Important**

- This setup page works **only while no user accounts exist**. After the first account is created it permanently refuses to create any more — new staff accounts are created from the dashboard instead (see *Managing Users* below).
- There are **no default or hidden passwords** anywhere in the system. You choose the first password yourself, so keep it safe.
- Your password is stored in the database only as a strong one-way hash — even the developer cannot read it.

---

## 2. Roles and Permissions

There are three roles. Pick the lowest role that fits each person's job.

| Capability | EDITOR | ADMIN | SUPER_ADMIN |
| :--- | :---: | :---: | :---: |
| Add / edit vehicles | ✅ | ✅ | ✅ |
| Upload & reorder vehicle photos | ✅ | ✅ | ✅ |
| Change availability (Available / Reserved / Sold) | ✅ | ✅ | ✅ |
| Publish or unpublish vehicles (make visible on the site) | ❌ | ✅ | ✅ |
| Feature vehicles on the homepage | ❌ | ✅ | ✅ |
| Delete vehicles | ❌ | ✅ | ✅ |
| Media library — delete individual photos | ✅ | ✅ | ✅ |
| Media library — process the failed-cleanup retry queue | ❌ | ✅ | ✅ |
| Create, edit, deactivate staff accounts & reset passwords | ❌ | ❌ | ✅ |
| Edit site settings (business info, hero, about, SEO) | ❌ | ❌ | ✅ |
| View the audit log | ❌ | ❌ | ✅ |

Notes:

- Editors do everything needed to keep inventory information and photos current, but publishing decisions and destructive actions stay with admins.
- Permissions are enforced **on the server for every action** — even if a button were somehow visible in the browser, the server would refuse the operation.
- Super Admins cannot demote or deactivate **themselves**, and the **last active Super Admin** cannot be demoted or deactivated (this prevents locking everyone out). Promote another Super Admin first.

---

## 3. Adding a Vehicle

Go to **Admin > Inventory → Add Vehicle** (or **Inventory → New**).

### Fill in the details

| Field | What it means | Notes |
| --- | --- | --- |
| Title | Shown everywhere as the vehicle name | e.g. “1971 Mercedes-Benz 280SL Pagoda” |
| Brand | Manufacturer | Choose from the list (managed master data) |
| Model | Model name | e.g. “280SL” |
| Category | Showroom grouping | Vintage Cars, Classic Cars, Luxury Cars, SUVs, Sports Cars, Trucks & Pickups — optional |
| Year | Model year | 1900 or later |
| Price | Asking price in **TZS** | Shown formatted on the site (e.g. TZS 85,000,000) |
| Mileage | Kilometres | Optional |
| Fuel type | Petrol / Diesel / Hybrid / Electric | Optional |
| Transmission | Manual / Automatic | Optional |
| Engine capacity | e.g. “2.8 L” or “2800 cc” | Optional, free text |
| Condition | Restored / Excellent / Good / Fair / Project | Optional |
| Description | The main story of the car | At least 10 characters; use paragraphs for readability |
| Highlights | Short selling points | One per line — these appear as a bullet list |

### Add photos

- Formats accepted: **JPEG, PNG, WebP, AVIF**. Anything else is rejected.
- Each file can be **up to 8 MB**.
- Up to **10 photos per vehicle**.
- **Drag and drop the thumbnails to reorder** them. The **first photo is the main image** — it appears on cards, in search results, and first in the gallery.
- Add **alt text** for each photo (a short description of what the picture shows, e.g. “Rear three-quarter view with spare wheel”). Alt text helps visually impaired visitors and search engines.
- If an upload fails, you'll see a toast explaining why — check the file type/size and retry.

### Save

- Use **Save as Draft** to keep working without showing the car on the site.
- Publishing (making it public) requires Admin or Super Admin rights — see the next section.

---

## 4. Publishing, Availability, and Featuring

### Draft vs Published

| State | Who sees it |
| --- | --- |
| **Draft** (unpublished) | Nobody on the public site. Staff can preview it on the vehicle page while logged in (it shows a “staff preview” notice). Drafts never appear in the sitemap. |
| **Published** | Everyone. It appears in the inventory, filters, sitemap, and (if featured) the homepage. |

To publish or unpublish, use the controls in **Admin > Inventory**. This is an ADMIN / SUPER_ADMIN action.

### Availability status

Set this as the car moves through the sales process — Editors can change it too:

| Status | How it appears on the site |
| --- | --- |
| **Available** | Green “Available” badge. Buyers see the normal “Enquire on WhatsApp” button. |
| **Reserved** | A “Reserved” badge. The listing stays online so people can still study the car and enquire. |
| **Sold** | A “Sold” badge. The listing remains online (great for showing the dealership's track record); the enquiry button switches to a “sold” message asking about similar vehicles. |

### Featuring on the homepage

The homepage “Featured” section shows featured vehicles. Toggle **Featured** in the inventory list (ADMIN / SUPER_ADMIN). Feature your best 3–6 cars — the homepage shows up to six.

---

## 5. Deleting a Vehicle

1. In **Admin > Inventory**, find the vehicle and click **Delete**.
2. A confirmation dialog appears — deleting cannot be undone, so double-check the title.
3. All of the vehicle's photos are also removed from storage.

**If photo cleanup fails** (a temporary network or storage-provider error), the affected photos are placed in a **cleanup queue** rather than being lost. Check **Admin > Media** for queued items and retry them from there (Admin/Super Admin).

---

## 6. Media Library

**Admin > Media** is the central place for image housekeeping:

- **Delete individual photos** from storage if an upload went somewhere unexpected or a stray file remains.
- **Cleanup queue** — any photo deletions that previously failed (e.g. when deleting a vehicle) are listed here with their attempt count and last error. Click **retry** to process the queue; successful items are removed from storage and cleared from the list.
- The page also shows which **storage driver is active** (Cloudinary or local).

---

## 7. Site Settings (Super Admin)

**Admin > Settings** holds the dealership's business information in one place. Saving here automatically updates the **site header, footer, contact page, and every WhatsApp link** across the site — no code changes needed.

| Setting | Where it appears |
| --- | --- |
| Business name | Header, footer, page titles, JSON-LD |
| Phone number | Contact page, footer |
| WhatsApp number | Every “Enquire on WhatsApp” button — keep it in international format, e.g. `255710853255` |
| Instagram URL | Footer / contact links |
| Address & business hours | Contact page and footer (leave blank while not approved — blank fields are simply hidden) |
| Logo image | Header/branding |
| Hero image | The large homepage banner |
| About-page copy | Intro, story, mission, vision, commitment sections of the About page |
| SEO defaults | Default meta title & description used across pages that don't specify their own |
| Footer note | Small text at the bottom of every page |

After saving, the public pages refresh automatically with the new content.

---

## 8. Managing Users (Super Admin)

**Admin > Users** lets you create and maintain staff accounts:

- **Create a staff member** — click *Add user*, enter name, email, an initial password (min. 10 characters with a letter and a number), and choose the role (**Editor** or **Admin**; only add more Super Admins when genuinely needed). Share the initial password securely and have them change it later via a reset below.
- **Deactivate** — switches an account off instantly (e.g. a departing staff member). Deactivated users cannot log in; their history in the audit log is preserved. The account can be reactivated at any time.
- **Reset a password** — open the user, set a new password, save. Use this if someone forgets theirs or you suspect a credential leak.
- **Change roles** — promote or demote as responsibilities change.

Protections you'll notice:

- You cannot demote or deactivate **your own** account.
- The **last active Super Admin** cannot be demoted or deactivated — promote another Super Admin first.

---

## 9. Audit Log

**Admin > Audit** (Super Admin only) shows a chronological security trail of what happened and who did it:

- Logins and **failed logins** (with reason: unknown email, inactive account, wrong password)
- First-admin setup
- Vehicle create / update / delete, publish & feature changes
- Photo uploads, media deletions, and cleanup-queue retries
- User management actions and settings changes

Each entry shows the user (or “unknown” for failed logins), the action, the affected record, and a timestamp. Review it periodically — a burst of `LOGIN_FAILED` entries can indicate someone attempting to guess passwords.

---

## 10. How WhatsApp Enquiries Work

Every enquiry button on the site opens **WhatsApp with a message pre-filled for the visitor** — they just press send:

- **On a vehicle page** — “Hello SAWEE CARS. I am interested in the *<vehicle>* listed on your website. Please share more details about its availability.” followed by a **direct link to that vehicle's page**, so you always know which car they mean.
- **On a Sold vehicle** — “I saw that the *<vehicle>* … is sold. Do you have similar vehicles available or expected?” — turning sold listings into future-business leads.
- **General enquiry** (contact page and elsewhere) — a friendly intro message with no vehicle attached.

The messages link to your website's **WhatsApp number** from **Admin > Settings**, so changing the number there updates every button site-wide. Nothing about the enquiry is stored in the website database — the conversation happens entirely in WhatsApp.

---

## Quick Reference

| Task | Where |
| --- | --- |
| Add / edit vehicles, photos | **Admin > Inventory** |
| Publish / feature / delete | **Admin > Inventory** (Admin & Super Admin) |
| Photo cleanup queue | **Admin > Media** |
| Business info, hero, about copy, SEO | **Admin > Settings** (Super Admin) |
| Staff accounts | **Admin > Users** (Super Admin) |
| Security trail | **Admin > Audit** (Super Admin) |
