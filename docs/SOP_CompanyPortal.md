# SOP — Amped I Company Portal
## Standard Operating Procedure

**Repo:** `interface-portal-app`
**URL (prod):** TBD — update after Vercel deploy
**Last updated:** 2026-04-02

---

## 1. What This Interface Does

The Amped I Company Portal is the internal employee hub. It gives every Amped I team member a single place to access the internal apps and tools they are authorized to use. Admins manage which apps exist and who has access to what.

---

## 2. Who Uses It

| Role | What they see |
|---|---|
| **Employee** | Employee Hub (their assigned apps only), Announcements |
| **Admin** | Everything above + ADMIN section (Apps, Access, Announcements mgmt) |

---

## 3. Supabase Project

**URL:** `https://jjsxofoytsapudxeqttk.supabase.co`
**Project:** Shared Amped I Supabase project

---

## 4. Database Tables

All tables are prefixed `portal_` to distinguish them from other interfaces on the same Supabase project.

### `portal_profiles`
Stores user display info and admin status. One row per auth user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Matches `auth.users.id` |
| `full_name` | text | Display name (nullable — falls back to email prefix) |
| `email` | text | Copied from `auth.users` on signup via trigger |
| `is_admin` | boolean | Grants full access to all apps + admin panel |
| `created_at` | timestamptz | |

**Trigger:** `on_auth_user_created` — auto-creates a profile row when a new user signs up.

### `portal_apps`
Master list of all company apps/interfaces.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | Display name |
| `description` | text | Short blurb shown on card |
| `url` | text | Full URL — opens in new tab |
| `logo_url` | text | Public URL from Supabase Storage `app-logos` bucket |
| `status` | text | `live`, `new`, `maintenance`, `coming_soon` |
| `status_note` | text | Shown instead of URL when status = `maintenance` |
| `sort_order` | int | Controls card display order |
| `is_active` | boolean | Inactive apps are hidden from all users |
| `created_at` | timestamptz | |

### `portal_user_app_access`
Maps which users have access to which apps.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | References `auth.users.id` |
| `app_id` | uuid | References `portal_apps.id` |
| `granted_at` | timestamptz | |
| `granted_by` | uuid | References `auth.users.id` (nullable) |

**Note:** Admin users (`is_admin = true`) bypass this table — they see all active apps automatically. Rows in this table only matter for non-admin users.

### `portal_announcements`
Company-wide announcements shown on the Employee Hub and Announcements page.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `message` | text | The announcement text |
| `is_active` | boolean | Inactive announcements are hidden |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz | Nullable — if set, auto-hides after this date |

---

## 5. Supabase Storage

**Bucket:** `app-logos` (public)
Used to store logo images for `portal_apps`. The public URL is stored in `portal_apps.logo_url`.

To upload a logo: Supabase Dashboard → Storage → app-logos → Upload file → copy the public URL → paste into `portal_apps.logo_url` via the Admin Apps page.

---

## 6. Pages

### `/` — Employee Hub
- Shows a time-based greeting with the user's first name
- Shows app count and last login time
- Shows active announcements as banners
- Shows app cards for every app the user has access to
- Admins see all active apps; regular users see only their assigned apps

### `/announcements` — Announcements
- Read-only list of all active, non-expired announcements
- Sorted newest first

### `/admin/apps` — Admin: Apps
- Add new apps to the portal
- Edit app name, description, URL, status, status note, sort order
- Activate or deactivate apps
- **Access:** Admins only

### `/admin/access` — Admin: Access Management
- **By User tab:** View all users, expand a user to toggle admin status and assign/remove app access
- **By App tab:** View all apps, expand an app to assign/remove user access
- **Access:** Admins only

### `/admin/announcements` — Admin: Announcements
- Post new announcements with optional expiry date
- Activate, deactivate, or delete existing announcements
- **Access:** Admins only

---

## 7. Access Control Rules

- All routes except `/login` require authentication (enforced by `middleware.js`)
- Admin pages use `useAdminGuard()` hook — non-admins are silently redirected to `/`
- Admin sidebar section is hidden from non-admin users
- RLS policies on all tables — users can only read/write what they're authorized for
- The `is_admin()` Supabase function (security definer) is used in RLS policies to avoid recursion

---

## 8. How to Add a New Employee

1. Go to **Supabase Dashboard → Authentication → Users → Add user**
2. Enter their email and a temporary password
3. Their `portal_profiles` row is created automatically by the trigger
4. Go to **Admin → Access** in the portal and assign the apps they need

---

## 9. How to Add a New App

1. Go to **Admin → Apps** in the portal
2. Click **+ Add App**
3. Fill in name, description, URL, status, and sort order
4. Optionally upload a logo (see Section 5)
5. The app is immediately visible to admins; assign access to users via **Admin → Access**

---

## 10. Environment Variables

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` + Vercel | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` + Vercel | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` + Vercel | Server-only — never expose client-side |

---

## 11. Deployment

- **Platform:** Vercel
- **Branch:** `main` is production
- All development happens on `develop` or `feature/<name>` branches
- Never commit directly to `main`
