# Standard Operating Procedure
## Custom Interface Development
### Using Next.js, Supabase, Airtable & Vercel

| | |
|---|---|
| **Document Version** | 1.2 |
| **Status** | Draft for Review |
| **Audience** | Internal Development Team |
| **Classification** | Confidential — Internal Use Only |
| **Stack** | Next.js + Supabase + Airtable + Vercel + GitHub |

**Change Summary:**
- v1.2: Rewrote Section 4 for template-based flow with naming conventions and branch rules. Added UI Component Library (Section 5a), Design System Rules (Section 5b), Claude Code Workflow (Section 14), and Per-Interface SOP requirement (Section 15). Updated Section 6 with service role security pattern. Updated security checklist and recommendations.
- v1.1: Updated data flow, write strategy, RLS guidance, added App Portal section with UI mockup.

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Architecture Overview](#2-architecture-overview)
3. [Prerequisites](#3-prerequisites)
4. [Starting a New Project — Step by Step](#4-starting-a-new-project--step-by-step)
5. [Implementing Supabase Authentication](#5-implementing-supabase-authentication)
5a. [UI Component Library](#5a-ui-component-library)
5b. [Design System Rules](#5b-design-system-rules)
6. [Connecting to Airtable](#6-connecting-to-airtable)
7. [The Internal App Portal](#7-the-internal-app-portal)
8. [GitHub Repository Standards](#8-github-repository-standards)
9. [Deploying to Vercel](#9-deploying-to-vercel)
10. [Security Checklist](#10-security-checklist)
11. [Intranet vs. Internet Interfaces](#11-intranet-vs-internet-interfaces)
12. [Quick Reference — Common Commands](#12-quick-reference--common-commands)
13. [Recommended Future Improvements](#13-recommended-future-improvements)
14. [Claude Code Workflow (CLAUDE.md)](#14-claude-code-workflow-claudemd)
15. [Per-Interface SOP Requirement](#15-per-interface-sop-requirement)

---

## 1. Purpose & Scope

This SOP defines the standard process for building, securing, and deploying custom internal interfaces for company stakeholders. It covers the complete development lifecycle from project setup to production deployment using a consistent, scalable, and secure technology stack.

**This document applies to:**
- All internal dashboard and interface development
- Pages that access company data from Supabase or Airtable
- Any interface that requires user authentication and access control
- Both intranet (internal) and internet-facing (external) web applications

---

## 2. Architecture Overview

| Layer | Technology | Role |
|---|---|---|
| Frontend / UI | Next.js (React) | Custom interface pages, components, routing |
| Authentication | Supabase Auth | User login, session management, route protection |
| Primary Backend | Supabase (PostgreSQL) | Source of truth for all company data |
| Secondary Data Layer | Airtable | Operational data, forms, views — fed by Supabase |
| Deployment / Hosting | Vercel | CI/CD pipeline, live hosting, environment management |
| Source Control | GitHub (Org Repo) | Code governance, version control, deployment trigger |
| App Portal | Next.js on Vercel | Central hub linking all deployed internal interfaces |

### 2.1 Data Flow

1. User visits a protected page on a custom interface or the App Portal.
2. Next.js middleware checks for a valid Supabase Auth session. If none, redirects to login.
3. After login, Supabase Auth issues a session token stored securely in the browser.
4. The interface fetches data from Supabase (primary source) or Airtable via a server-side API route (secondary).
5. Data is displayed in the custom UI.
6. Write operations follow the data write strategy defined in Section 2.2 below.

### 2.2 Data Write Strategy

> **Goal:** Supabase is the single source of truth for all data. Airtable is a downstream operational layer. All migration effort should move toward this end state.

| Scenario | Write Target | Notes |
|---|---|---|
| New apps built under this SOP | Supabase only | All new development must write exclusively to Supabase. Airtable reflects this data via sync or automation. |
| Existing apps with Airtable-native data | Airtable (for now) | Permitted as temporary state. Must sync back to Supabase via Airtable automation or webhook. Flag as technical debt. |
| Editable fields not yet in Supabase | Airtable with sync-back | Write to Airtable and trigger a sync to Supabase within the same operation. Airtable must never hold data Supabase does not know about. |
| Data only meaningful in Airtable (linked records, formulas) | Airtable | Treat as a derived/operational layer, not source of truth. Do not replicate this pattern for new data. |

### 2.3 Insights & Recommendations on Current Stack

| Area | Current Approach | Recommendation |
|---|---|---|
| Frontend | Static HTML pages in GitHub | Migrate to Next.js for component reuse, maintainability, and scalability |
| Auth | Supabase Auth via script tags | Use Supabase SSR helpers in Next.js for secure server-side session handling |
| Airtable Role | Both data source and interface | Keep Airtable as data layer only; build all interfaces in Next.js |
| API Key Security | Airtable API key fetched from Supabase table at runtime | Good pattern. Keep keys in Supabase table protected by RLS. All Airtable calls go through server-side Next.js API routes. |
| Hosting | GitHub Pages / GoDaddy | Use Vercel for all custom interfaces; keep GoDaddy only for the public website |
| Deployment | Manual or FTP | Git push to GitHub triggers auto-deploy on Vercel |
| Code Governance | Personal or unstructured repos | All interface code must live in the company GitHub Org under a dedicated repo |

---

## 3. Prerequisites

### 3.1 Accounts & Access Required

| Tool | Access Needed | Who Sets This Up |
|---|---|---|
| GitHub | Member of company GitHub Org | Org Admin |
| Vercel | Member of company Vercel Team (linked to GitHub Org) | Org Admin |
| Supabase | Access to company Supabase project | Supabase Project Owner |
| Airtable | Access to relevant Airtable bases | Airtable Admin |
| Node.js | v18+ installed locally | Developer (self-setup) |
| VS Code | Installed locally | Developer (self-setup) |

### 3.2 Local Machine Setup

Verify your environment before starting:

```bash
node --version   # Should return v18 or higher
npm --version    # Should return v8 or higher
git --version    # Should return 2.x or higher
```

---

## 4. Starting a New Project — Step by Step

### 4.1 Naming Convention

All interface repos follow this naming convention:

| Project Type | Repo Name | Example |
|---|---|---|
| Interface | `interface-<name>` | `interface-sales-dashboard` |
| App Portal | `portal-app` | `portal-app` |
| Shared components | `ui-components` | `ui-components` |

The same name is used for the repo, the Vercel project, and the `app_name` in the `airtable_keys` table.

### 4.2 Create the Repo (Manual)

This process does **not** auto-create repos. The developer creates it manually:

1. Go to [github.com/Amped-I-LLC](https://github.com/Amped-I-LLC).
2. Find the `amped-i-custom-interface-development` template repo.
3. Click **"Use this template"** → **"Create a new repository"**.
4. Name it `interface-<your-interface-name>` (e.g. `interface-sales-dashboard`).
5. Set visibility to **Private**.

### 4.3 Clone and Set Up Locally

```bash
git clone https://github.com/Amped-I-LLC/interface-<name>.git
cd interface-<name>
npm install
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, and service role key
```

### 4.4 Create a Working Branch Immediately

**`main` is always protected.** Never work directly on `main`. Create a branch immediately:

```bash
git checkout -b develop
```

All development happens on `develop` or `feature/<name>` branches. Merging to `main` requires a pull request and review.

### 4.5 Stamp the New Project

Before writing any feature code, update these items:

| What | File | Change To |
|---|---|---|
| App display name | `components/layout/Sidebar.jsx` — logo block | Your interface name (e.g. "Sales Dashboard") |
| Nav items | `components/layout/Sidebar.jsx` — `NAV_ITEMS` array | Your pages and routes |
| Browser tab title | `app/layout.jsx` — `metadata.title` | Your interface name |
| Supabase credentials | `.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Vercel env vars | Vercel project settings | Same three values as `.env.local` |

### 4.6 Add Pages

Every new page goes in `app/(protected)/[page-name]/page.jsx` and gets a corresponding entry in the `NAV_ITEMS` array in `Sidebar.jsx`.

Each page must call `usePageTitle()` at the top to set the Topbar title:

```jsx
'use client'
import { usePageTitle } from '@/lib/page-context'

export default function MyPage() {
  usePageTitle('Page Title', 'Optional subtitle')
  // page content
}
```

### 4.7 Standard Folder Structure

| Folder / File | Purpose |
|---|---|
| `app/(auth)/login/page.jsx` | Login page (public) |
| `app/(protected)/` | All gated pages — middleware enforces auth |
| `app/(protected)/[page-name]/page.jsx` | Each page follows this pattern |
| `app/api/` | Server-side API routes (keeps API keys and service role hidden from browser) |
| `app/api/airtable/route.js` | Airtable proxy — uses service role to read keys, validates session first |
| `app/globals.css` | Design system — all CSS variables live here |
| `app/layout.jsx` | Root layout — metadata, fonts |
| `components/layout/` | Sidebar and Topbar — shared across all protected pages |
| `components/ui/` | Reusable UI components (see Section 5a) |
| `lib/supabase/client.js` | Supabase browser client (for Client Components) |
| `lib/supabase/server.js` | Supabase server client (for Server Components and API routes) |
| `lib/airtable.js` | Airtable fetch helper — calls `/api/airtable` |
| `lib/page-context.js` | `usePageTitle()` hook for per-page Topbar titles |
| `CLAUDE.md` | Rules file for Claude Code sessions (see Section 14) |
| `docs/` | SOP, Preferences, and per-interface documentation |
| `.env.local` | Environment variables — **NEVER commit this file** |

### 4.8 Create the Per-Interface SOP

Every new interface **must** have its own SOP document at `docs/SOP_<InterfaceName>.md`. See [Section 15](#15-per-interface-sop-requirement) for what this must contain. This is separate from the template SOP and does not push back to the template repo.

---

## 5. Implementing Supabase Authentication

Every interface **must** be protected by Supabase Auth. All pages that display company data must redirect unauthenticated users to the login page. The template handles this automatically via `middleware.js`.

### 5.1 How It Works in the Template

Auth is enforced at the middleware layer — before any page renders:

```
middleware.js → checks Supabase session → redirects to /login if none
```

The `app/(auth)/` route group is public. The `app/(protected)/` route group requires a valid session.

### 5.2 Supabase Client Files

**Browser client** (`lib/supabase/client.js`) — use in Client Components:

```js
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
```

**Server client** (`lib/supabase/server.js`) — use in Server Components and API routes:

```js
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: ... } }
  )
}
```

### 5.3 Login Flow

The login page at `app/(auth)/login/page.jsx` uses email + password auth and redirects to the original destination after login (via `?redirectTo` query param):

```js
const { error } = await supabase.auth.signInWithPassword({ email, password })
if (!error) router.push(params.get('redirectTo') || '/')
```

### 5.4 Logout

The Topbar component handles logout:

```js
await supabase.auth.signOut()
router.push('/login')
router.refresh()
```

### 5.5 Adding Public Routes

If you need additional public routes (e.g. a public status page), add them to the `PUBLIC_ROUTES` array in `middleware.js`:

```js
const PUBLIC_ROUTES = ['/login', '/status']
```

---

## 5a. UI Component Library

The template ships with a set of reusable UI components in `components/ui/`. Always use these before building custom equivalents.

| Component | Import Path | Key Props |
|---|---|---|
| `Button` | `@/components/ui/Button` | `variant` (primary / secondary / danger), `size` (sm / md / lg), `disabled`, `onClick` |
| `Badge` | `@/components/ui/Badge` | `variant` (success / warning / danger / info / neutral) |
| `Card` | `@/components/ui/Card` | `title`, `action` (ReactNode for the header right slot) |
| `StatCard` | `@/components/ui/StatCard` | `label`, `value`, `trend`, `trendUp` (boolean) |
| `DataTable` | `@/components/ui/DataTable` | `columns` (array), `data` (array), `pageSize` |
| `EmptyState` | `@/components/ui/EmptyState` | `icon`, `title`, `message`, `action` (ReactNode) |
| `LoadingSkeleton` | `@/components/ui/LoadingSkeleton` | `lines`, `height`, `card` (boolean) |

### DataTable columns format

```js
const columns = [
  { key: 'name',   label: 'Name',   sortable: true },
  { key: 'status', label: 'Status', render: (val) => <Badge variant="success">{val}</Badge> },
]
```

### Standard page data pattern

Every data page follows the same three-state pattern:

```jsx
{loading ? <LoadingSkeleton lines={5} /> :
 error   ? <EmptyState icon="⚠️" title="Error" message={error} /> :
           <DataTable columns={columns} data={data} />}
```

This ensures every page handles loading, error, and empty states consistently without custom one-off implementations.

---

## 5b. Design System Rules

All visual styling comes from CSS variables in `app/globals.css`. **Never hardcode hex values, pixel values for colors, or font names directly in components.**

### Color variables

```css
/* Brand */
--color-primary          /* #3b6ef6 — buttons, active states */
--color-primary-hover    /* darker blue on hover */
--color-primary-light    /* very light blue — highlights */

/* Sidebar */
--color-sidebar-bg       --color-sidebar-text
--color-sidebar-active   --color-sidebar-active-text
--color-sidebar-label    --color-sidebar-hover
--color-sidebar-border

/* Page */
--color-bg-page          /* page background */
--color-bg-card          /* card/panel background */
--color-bg-input         /* input field background */

/* Text */
--color-text-primary     /* headings, strong text */
--color-text-secondary   /* body text */
--color-text-muted       /* hints, placeholders */

/* Borders */
--color-border           --color-border-focus

/* Status */
--color-success / --color-success-light
--color-warning / --color-warning-light
--color-danger  / --color-danger-light
--color-info    / --color-info-light
```

### Layout, spacing, radius, and shadow variables

```css
--sidebar-width: 240px    --topbar-height: 56px
--space-1: 4px  --space-2: 8px   --space-3: 12px  --space-4: 16px
--space-5: 20px --space-6: 24px  --space-8: 32px
--radius-sm: 4px  --radius-md: 8px  --radius-lg: 12px
--radius-xl: 16px --radius-full: 9999px
--shadow-sm  --shadow-md  --shadow-lg
```

### CSS utility classes

Use these in `className` props rather than writing one-off inline styles:

```
.card  .card-header
.btn   .btn-primary  .btn-secondary  .btn-danger  .btn-sm  .btn-lg
.badge .badge-success .badge-warning .badge-danger .badge-info .badge-neutral
.input .select .textarea .input-label .form-group
.table-wrapper
.page-header  .page-content
.grid-2  .grid-3  .grid-4
.skeleton  .section-label  .divider
.text-muted  .text-primary  .text-brand  .text-sm  .text-xs
```

### What this means in practice

- Do not write `color: #3b6ef6` — use `color: var(--color-primary)`
- Do not write `padding: 16px` — use `padding: var(--space-4)`
- Do not write `border-radius: 8px` — use `border-radius: var(--radius-md)`
- All new interfaces built from this template automatically inherit any future brand updates made to `globals.css`

---

## 6. Connecting to Airtable

Airtable API keys are stored in a dedicated Supabase table called `airtable_keys`. The table has **no RLS read policy for authenticated users** — only the Supabase service role can read it, and only the server-side API route uses that service role. Keys are **never** stored in environment files, **never** exposed to the browser, and **never** visible in developer tools.

### 6.1 Create the `airtable_keys` Table

Run this in the Supabase SQL editor:

```sql
create table airtable_keys (
  id           uuid primary key default gen_random_uuid(),
  app_name     text not null,
  base_id      text not null,
  api_key      text not null,
  created_at   timestamptz default now()
);

-- Enable RLS
alter table airtable_keys enable row level security;

-- NO read policy for authenticated users.
-- Only the service role can read this table.
-- The server-side Airtable API route uses the service role key
-- (SUPABASE_SERVICE_ROLE_KEY) to read credentials after first
-- validating the user's session.

-- No insert/update/delete policy = only service role can write (admin)
```

> **Why no authenticated read policy?** If authenticated users could read this table, a logged-in user could open the browser console, call `supabase.from('airtable_keys').select('*')`, and retrieve every API key for every interface. By restricting to service role only, the only way to reach Airtable data is through the server-side route — which validates the session first and never returns the key to the browser.

### 6.2 Table Structure

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `app_name` | text | Must match the repo name, e.g. `interface-sales-dashboard` |
| `base_id` | text | Airtable Base ID |
| `api_key` | text | Airtable API key — **only readable by service role** |
| `created_at` | timestamp | Auto-generated |

### 6.3 Server-Side Airtable Route — Security Model

The `app/api/airtable/route.js` route follows a three-step security pattern:

```
Step 1: Validate user session (anon key + cookies → getUser())
Step 2: Read airtable_keys using service role (server-only key)
Step 3: Call Airtable API server-side, return only records
```

```js
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request) {
  // Step 1 — Validate the user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2 — Read airtable_keys using service role (bypasses RLS)
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // server-only, no NEXT_PUBLIC_
  )
  const { data: keyRow } = await admin
    .from('airtable_keys')
    .select('api_key, base_id')
    .eq('app_name', 'interface-your-app')
    .single()

  // Step 3 — Call Airtable, return only records
  const res = await fetch(
    `https://api.airtable.com/v0/${keyRow.base_id}/TableName`,
    { headers: { Authorization: `Bearer ${keyRow.api_key}` } }
  )
  const data = await res.json()
  return Response.json(data.records)
}
```

### 6.4 Service Role Key Safeguards

The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS. These rules are mandatory:

| Rule | Why |
|---|---|
| **Never** prefix with `NEXT_PUBLIC_` | Keeps it out of the browser JS bundle entirely |
| **Never** log it — not even in server routes | Prevents exposure in Vercel runtime logs |
| **Never** import it in `'use client'` components | It is physically unavailable there anyway, but the rule prevents accidents |
| **Never** commit the value to GitHub | Lives only in `.env.local` and Vercel env vars |
| **Always** validate the user session first | The service role call only happens after `getUser()` succeeds |
| **Only** use in `app/api/` server routes | No other file type should reference it |

> The Airtable API key is fetched by the service role on the server, used for the Airtable call, and never returned to the browser. The service role key itself is server-only and never reaches the browser. **This is the required pattern for all Airtable integrations.**

---

## 7. The Internal App Portal

The App Portal is a dedicated Next.js application deployed on Vercel that serves as the central hub for all internal interfaces. Staff log in once and see every tool available to them based on their role.

**Repo name:** `portal-app` | **URL:** `portal.amped-i.com`

### 7.1 Why a Dedicated Portal

| Option | Verdict | Reason |
|---|---|---|
| Dedicated Next.js app on Vercel (`portal.amped-i.com`) | **Recommended** | Full control, role-based logic, Supabase Auth, scalable, easy to extend |
| GoDaddy intranet site | Not recommended | No access yet, unclear stack, cannot support dynamic auth or role logic |
| Embedded in an existing app | Not recommended | Wrong responsibility, does not scale as app count grows |

### 7.2 Portal Data Model

Two tables in Supabase govern the portal:

**`app_registry` table:**

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `app_name` | text | Display name shown on the card |
| `app_url` | text | Full URL of the deployed Vercel app |
| `description` | text | Short description shown on the card |
| `icon` | text | Emoji or icon identifier |
| `status` | text | `live` \| `maintenance` \| `coming_soon` |
| `is_new` | boolean | Shows a "New" badge on the card if true |

**`user_app_access` table:**

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | References `auth.users` |
| `app_id` | uuid | References `app_registry.id` |
| `granted_at` | timestamp | When access was granted |

### 7.3 How the Portal Works

1. Staff navigate to `portal.amped-i.com` and log in with Supabase Auth.
2. The portal queries `user_app_access` for the logged-in user and fetches only their permitted apps from `app_registry`.
3. The user sees a personalized grid of app cards showing name, description, status badge, and a link.
4. Clicking a card opens the individual app in a new tab. That app independently validates the Supabase session.
5. Admins manage access by inserting or deleting rows in `user_app_access` — no code deployment required.

### 7.4 Scalability

| Action | How |
|---|---|
| Add a new app | Deploy to Vercel, add one row to `app_registry` |
| Give a user access | Add one row to `user_app_access` |
| Revoke access | Delete that row |
| Add announcements | Add a separate Supabase table, render on portal home |

The portal UI **never needs code changes** — it reads dynamically from Supabase.

### 7.5 Portal vs. GoDaddy Intranet

Once `portal.amped-i.com` is live, it becomes the effective intranet for all internal tools. The GoDaddy public website (`www.amped-i.com`) remains unchanged and serves external visitors only.

---

## 8. GitHub Repository Standards

### 8.1 Repository Location

All custom interface projects **must** be stored in the company GitHub Organization (`Amped-I-LLC`), not personal accounts.

### 8.2 Naming Convention

| Project Type | Repo Name Format | Example |
|---|---|---|
| Interface template | `amped-i-custom-interface-development` | *(this repo)* |
| App Portal | `portal-app` | `portal-app` |
| Individual interface | `interface-[name]` | `interface-sales-dashboard` |
| Shared component library | `ui-components` | `ui-components` |

### 8.3 Branching Strategy

| Branch | Purpose | Deploys To |
|---|---|---|
| `main` | Production-ready code only | Live Vercel URL |
| `develop` | Integration branch for testing | Vercel Preview URL |
| `feature/[name]` | Individual feature development | Vercel Preview URL |

### 8.4 Required `.gitignore` Entries

```
.env.local
.env*.local
node_modules/
.next/
```

---

## 9. Deploying to Vercel

### 9.1 One-Time Project Setup

1. Log in to [vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New Project**.
3. Select the GitHub Org (`Amped-I-LLC`) and choose your repository.
4. Vercel will auto-detect Next.js — no build configuration needed.
5. Before clicking Deploy, go to **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **Deploy**. Your app will be live at `[project-name].vercel.app` within ~60 seconds.

### 9.2 Ongoing Deployments

- **Push to `main`** → automatically deploys to production
- **Push to any other branch** → creates a preview deployment with a unique URL
- **To roll back:** Vercel Dashboard → Deployments → find last good deploy → Promote to Production

### 9.3 Custom Subdomains

| App | Suggested Domain |
|---|---|
| App Portal | `portal.amped-i.com` |
| Individual interface | `app-[name].amped-i.com` |
| Public website | `www.amped-i.com` (GoDaddy, unchanged) |

---

## 10. Security Checklist

Before any deployment to production, verify all items:

| # | Security Requirement | How to Verify |
|---|---|---|
| 1 | `.env.local` is in `.gitignore` and NOT committed to GitHub | Run `git status` — `.env.local` should not appear |
| 2 | Airtable API keys are stored in Supabase `airtable_keys` table with RLS enabled | Check Supabase table editor — RLS toggle must be ON |
| 3 | Airtable API keys are only read inside server-side API routes (`app/api/`) | Search codebase — keys must not appear in any page or component file |
| 4 | All pages are protected by Supabase Auth middleware | Test: open a protected URL in incognito — should redirect to `/login` |
| 5 | Supabase anon key is used (not `service_role` key) in the frontend | Verify in Supabase dashboard — `service_role` key must NEVER be in frontend code |
| 6 | Repository is Private in the GitHub Org | Check GitHub repo settings → Visibility |
| 7 | Vercel project is linked to the GitHub Org, not a personal account | Check Vercel project → Git Connection |
| 8 | No sensitive data is logged to the browser console | Open DevTools → Console on the live site and verify |

---

## 11. Intranet vs. Internet Interfaces

| Property | Internal Interfaces (Vercel) | Public Website (GoDaddy) |
|---|---|---|
| Purpose | Dashboards and tools for staff | Public-facing company website |
| Authentication | Required — Supabase Auth on all pages | Not required |
| Built With | Next.js per this SOP | Existing GoDaddy setup |
| Domain | `portal.amped-i.com` and subdomains | `www.amped-i.com` |
| Sensitive Data | Yes — full security checklist required | No — public info only |
| Deployment | Vercel via GitHub push | GoDaddy (unchanged) |

---

## 12. Quick Reference — Common Commands

| Task | Command |
|---|---|
| Start a new interface | GitHub → `amped-i-custom-interface-development` → Use this template → Create new repository |
| Clone new interface repo | `git clone https://github.com/Amped-I-LLC/interface-<name>.git` |
| Create working branch | `git checkout -b develop` |
| Install dependencies | `npm install` |
| Run locally | `npm run dev` then open `http://localhost:3000` |
| Install Supabase SDK (if needed) | `npm install @supabase/supabase-js @supabase/ssr` |
| Push to GitHub (triggers deploy) | `git add . && git commit -m 'message' && git push` |
| Roll back production | Vercel Dashboard → Deployments → Promote to Production |
| View live logs | Vercel Dashboard → Project → Runtime Logs |

---

## 13. Recommended Future Improvements

### 13.1 Infrastructure Setup

| Item | Status | Notes |
|---|---|---|
| Domain confirmation — `amped-i.com` and subdomains | **Not blocking** | Interfaces deploy to `*.vercel.app` URLs until a custom domain is confirmed. Switching is a 2-step DNS change in Vercel — no redeployment or code changes needed. Do this before sharing URLs with end users. |
| Vercel team setup under `Amped-I-LLC` org | **Done** | Team created, connected to `Amped-I-LLC` GitHub org. Upgrade to Pro plan required before deploying private repos. |

### 13.2 Security

| Item | Status | Notes |
|---|---|---|
| `airtable_keys` RLS — service role only | **Resolved** | No authenticated read policy. Server route uses `SUPABASE_SERVICE_ROLE_KEY` after validating the user session. See Section 6. |
| RLS on `user_app_access` and `app_registry` | **Deferred to portal build** | This is a `portal-app` concern. Admin users see all apps; regular users see only their assigned apps. Implement when building the portal. |
| Vercel preview URL access control | **Resolved — no action needed** | Preview URLs are randomly generated, not indexed, and data is behind Supabase Auth. With a small team, no risk as long as URLs are not shared publicly. |

### 13.3 Feature Improvements

| Priority | Improvement | Benefit |
|---|---|---|
| Implemented | Supabase RLS on `airtable_keys` table | Only authenticated users can read keys. Service role required to write. |
| Implemented | RLS policies per sensitive table | Each restricted table has its own policy. Users only access permitted rows. |
| Implemented | `main` branch protection | Enforced from day one on all repos. PR + review required to merge. |
| High | Supabase Realtime on portal | App cards update live when new apps are added or access is granted. |
| High | Extend RLS to `user_app_access` and `app_registry` | See security section above. |
| Medium | Dark mode support | Light mode only currently. Add dark mode as a CSS variable layer in `globals.css`. |
| Medium | Multi-Supabase project support | Currently one shared Supabase project for all interfaces. Add per-interface project config when scale requires it. |
| Medium | Airtable write support | Currently Airtable is read-only display. Add write-back with sync to Supabase when operationally needed. |
| Medium | Role-based access control (RBAC) via Supabase user metadata | Assign roles (admin, viewer, editor) and use them in RLS policies. |
| Medium | Airtable-to-Supabase sync automation | Ensure all Airtable-native writes sync back to Supabase automatically. |
| Medium | Logo management UI | Currently logos are fetched from Supabase Storage. Add an admin UI for uploading and managing them. |
| Medium | Admin UI for `user_app_access` | Currently managed directly in Supabase. A portal admin panel would make access management easier. |
| Low | TypeScript migration | Stronger code quality and fewer runtime bugs as codebase grows. |

---

## 14. Claude Code Workflow (CLAUDE.md)

Every interface repo stamped from this template includes a `CLAUDE.md` file in the root. Claude Code reads this file automatically at the start of every session. It is the authoritative guide for how Claude should build in this system — covering naming conventions, file structure, the design system, auth patterns, data layer rules, and output standards.

### 14.1 What CLAUDE.md Does

`CLAUDE.md` is not documentation for humans — it is a live instruction set for Claude Code sessions. It ensures that every Claude-assisted build follows the same rules, regardless of which developer is driving the session. It covers:

- What the template is and how it works
- How to start a new project (naming, branching, stamping)
- File structure rules — where new files go and what never to create
- Design system rules — CSS variables only, no hardcoded values
- Available UI components and their props
- Auth and security rules — where to use which Supabase client
- Data layer rules — Supabase for writes, Airtable read-only via server route
- Page title pattern (`usePageTitle()`)
- Standard page template to use as a starting point
- Output rules — complete files, real table names, no placeholder data

### 14.2 What CLAUDE.md Does Not Do

- It does not contain project-specific details (table names, schema, business rules). Those are fed during the session.
- It does not create repos, push code, or manage deployments. Those are human steps.
- It is not modified per project. Each interface repo carries an identical copy of `CLAUDE.md`.

### 14.3 How to Use It in a Session

When starting a Claude Code session on an interface repo:

1. Claude automatically loads `CLAUDE.md` from the repo root.
2. Feed it the per-interface SOP (`docs/SOP_<InterfaceName>.md`) at the start of the session — this gives Claude the project-specific context it needs.
3. Ask Claude to build a page, component, or data hook. Claude will follow the rules in `CLAUDE.md` without being reminded.
4. If Claude proposes something that conflicts with `CLAUDE.md`, quote the relevant rule back to it.

### 14.4 Keeping CLAUDE.md Current

When the template evolves (new components, new patterns, updated rules), `CLAUDE.md` must be updated in the template repo. Interfaces already stamped will not automatically receive the update — they carry the version of `CLAUDE.md` from when they were stamped. If a rule change is critical, manually update `CLAUDE.md` in existing interface repos.

---

## 15. Per-Interface SOP Requirement

Every interface built from this template **must** have its own SOP document. This document is separate from this template SOP and does not push back to the template repo.

### 15.1 File Location and Name

```
docs/SOP_<InterfaceName>.md
```

Examples:
- `docs/SOP_SalesDashboard.md`
- `docs/SOP_HRPortal.md`
- `docs/SOP_FinanceTracker.md`

### 15.2 Required Contents

| Section | What It Covers |
|---|---|
| Purpose and audience | What the interface does and who uses it |
| Supabase tables | Every table the interface reads from or writes to, with relevant columns |
| Airtable sources | Every Airtable base and table the interface displays data from |
| Pages | What each page does, what data it shows, and what the user can do |
| Business rules | Any logic specific to this interface (filters, calculations, access rules) |
| Known limitations | Anything deferred, not yet implemented, or intentionally excluded |

### 15.3 Why This Matters

The per-interface SOP serves three purposes:

1. **Session context for Claude.** Feed it at the start of every Claude Code session so Claude has real table names, column names, and page requirements — not guesses.
2. **Onboarding.** A new developer can read the SOP and understand what the interface does without reading every line of code.
3. **Audit trail.** Documents the data sources and business logic behind each interface for operational and compliance purposes.

### 15.4 When to Create It

Create the per-interface SOP before writing any feature code — ideally as the first file in the repo after stamping the template. It forces you to answer the data questions (what tables, what columns, what does the user do) before building, which prevents rework.

---

*— End of Document —*

*Document Version 1.2 | Confidential — Internal Use Only*
