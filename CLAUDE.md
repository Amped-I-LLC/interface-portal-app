# Amped I — Interface Template Rules
## Context document for Claude Code sessions

This file is loaded automatically by Claude Code when working in any repo stamped from this template.
It is the authoritative guide for how to build interfaces in this system.
Do not modify this file per project — feed project-specific details (table names, schema, etc.) during the session.

---

## 1. What This Template Is

This is the Amped I custom interface template. Every internal interface built at Amped I starts from this template. It provides:

- A consistent design system (CSS variables, no hardcoded colors)
- Supabase Auth with protected routes out of the box
- A sidebar + topbar layout shell
- A reusable UI component library
- A server-side Airtable integration pattern
- This `CLAUDE.md` as a knowledge base for Claude Code sessions

When working in a repo stamped from this template, follow every rule in this file.

---

## 2. Starting a New Interface — The Process

### Repo creation (manual — Claude does not create repos)
1. Go to `github.com/Amped-I-LLC`
2. Create a new **private** repository named `interface-<interface-name>`
   - Examples: `interface-sales-dashboard`, `interface-hr-portal`, `interface-finance-tracker`
3. Clone the new repo locally
4. Pull the template into it:
   ```bash
   git remote add template https://github.com/Amped-I-LLC/amped-i-custom-interface-development.git
   git fetch template
   git merge template/main --allow-unrelated-histories
   git remote remove template
   ```
5. Immediately create a working branch — **never work directly on `main`**:
   ```bash
   git checkout -b develop
   ```

### Stamp the new project (5 things to change)
| What | File | Change to |
|---|---|---|
| App display name | `components/layout/Sidebar.jsx` — logo block | Interface display name |
| Nav items | `components/layout/Sidebar.jsx` — `NAV_ITEMS` | Your pages and routes |
| Browser tab title | `app/layout.jsx` — `metadata.title` | Interface name |
| Supabase credentials | `.env.local` | Your project values |
| Vercel env vars | Vercel project settings | Same as `.env.local` |

### Branch rules
- `main` is always protected — require PR + review before merging
- All development happens on `develop` or `feature/<name>` branches
- Never commit directly to `main`

---

## 3. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Interface repo | `interface-<name>` | `interface-sales-dashboard` |
| Portal repo | `portal-app` | `portal-app` |
| `airtable_keys.app_name` | Same as repo name | `interface-sales-dashboard` |
| New page route | `app/(protected)/<page-name>/page.jsx` | `app/(protected)/contacts/page.jsx` |
| New component | `components/ui/<ComponentName>.jsx` | `components/ui/ContactCard.jsx` |
| New API route | `app/api/<route-name>/route.js` | `app/api/airtable/route.js` |

---

## 4. Before Writing Any Code — Ask About the Data

**Every interface is bespoke. Never assume or use placeholder table names.**

Before building any page or component that touches data, ask:
- What Supabase table does this page read from?
- What columns are relevant for this view?
- Is there an Airtable source for any of this data?
- What does the user need to do with this data — view only, or edit?

This is a quality assurance step. Each interface should have its own SOP document (separate from this template SOP) that defines what that interface does, what tables it uses, and what each page displays. If that SOP exists, ask for it at the start of the session.

---

## 5. Project Stack

- **Framework:** Next.js 14+ with App Router (no Pages Router)
- **Language:** JavaScript (no TypeScript)
- **Styling:** CSS variables from `app/globals.css` only
- **Auth:** Supabase Auth via `@supabase/ssr`
- **Primary data:** Supabase (PostgreSQL) — single shared project currently
- **Secondary data:** Airtable — server-side, read-only display only
- **Deployment:** Vercel — one project per interface repo

---

## 6. File Structure Rules

| New thing | Where it goes | Also do |
|---|---|---|
| New page | `app/(protected)/<page-name>/page.jsx` | Add to `NAV_ITEMS` in `Sidebar.jsx` |
| New API route | `app/api/<route-name>/route.js` | Server-side only |
| New UI component | `components/ui/<ComponentName>.jsx` | Use CSS variables only |
| New data helper | `lib/<helper>.js` | |
| New layout component | `components/layout/<Name>.jsx` | |

**Never:**
- Create a `pages/` directory — App Router only
- Add `.ts` or `.tsx` files
- Create files outside the structure above without explicit instruction

---

## 7. Design System Rules

All colors, spacing, typography, and radius values come from CSS variables in `app/globals.css`. **Never hardcode hex values, pixel values for colors, or font names directly in components.**

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

### Layout, spacing, radius, shadow variables
```css
--sidebar-width: 240px    --topbar-height: 56px
--space-1: 4px  --space-2: 8px   --space-3: 12px  --space-4: 16px
--space-5: 20px --space-6: 24px  --space-8: 32px
--radius-sm: 4px  --radius-md: 8px  --radius-lg: 12px
--radius-xl: 16px --radius-full: 9999px
--shadow-sm  --shadow-md  --shadow-lg
```

### CSS utility classes (use in `className` props)
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

---

## 8. Available UI Components

Always use these before building custom equivalents.

| Component | Import | Key props |
|---|---|---|
| `Button` | `@/components/ui/Button` | `variant` (primary/secondary/danger), `size` (sm/md/lg), `disabled`, `onClick` |
| `Badge` | `@/components/ui/Badge` | `variant` (success/warning/danger/info/neutral) |
| `Card` | `@/components/ui/Card` | `title`, `action` (ReactNode for header right slot) |
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

---

## 9. Auth & Security Rules

- `middleware.js` protects all routes not in `PUBLIC_ROUTES` — do not add auth checks in page components
- Use `@/lib/supabase/client` in Client Components (`'use client'`)
- Use `@/lib/supabase/server` in Server Components and API routes

### Service Role Key Rules
The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies. It is used only in `app/api/airtable/route.js` to read the `airtable_keys` table. Strict rules:
- **Never** prefix with `NEXT_PUBLIC_` — this keeps it out of the browser JS bundle
- **Never** import or reference it in any `'use client'` component
- **Never** log it with `console.log` or any logging — not even in server routes
- **Never** commit the actual value — it lives in `.env.local` and Vercel env vars only
- **Only** use it in `app/api/` server routes, and only when the user session is validated first

### Airtable Keys Security Model
The `airtable_keys` table has **no RLS read policy** for authenticated users. Users cannot query it from the browser. Only the service role can read it, and only the server-side Airtable route uses the service role — after first validating the user is authenticated via their session.

---

## 10. Data Layer Rules

### Supabase (primary — all writes go here)
```js
// Client Component
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
const { data, error } = await supabase.from('table_name').select('*')

// Server Component or API route
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```

### Airtable (secondary — read-only display only)
```js
import { fetchAirtable } from '@/lib/airtable'
const records = await fetchAirtable({ app: 'interface-<name>', table: 'TableName' })
```

### Rules
- **All writes go to Supabase only** — never write to Airtable from an interface
- Airtable is for displaying operational data that lives there — read-only
- All Airtable reads go through `/api/airtable/route.js` — never call Airtable directly from a component
- Airtable API keys live in the Supabase `airtable_keys` table — never in `.env` or any client file
- The `app` param in `fetchAirtable()` must match `airtable_keys.app_name`, which matches the repo name (`interface-<name>`)

### Logo pattern
The app logo/branding is fetched from a Supabase storage table at runtime — it is not hardcoded. When implementing logo display, read it from Supabase rather than embedding a static file.

---

## 11. Page Title Pattern

Every page sets its Topbar title via the `usePageTitle` hook:

```js
'use client'
import { usePageTitle } from '@/lib/page-context'

export default function MyPage() {
  usePageTitle('Page Title', 'Optional subtitle')
  // ...
}
```

---

## 12. Standard Page Template

Use this as the starting structure for every new page:

```jsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePageTitle } from '@/lib/page-context'
import Card from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'

// ASK: What is the actual Supabase table name for this page?
// ASK: What columns are needed?
// ASK: Is there an Airtable source for any of this data?

const TABLE_NAME = 'your_actual_table' // replace after confirming with dev

const columns = [
  // Define after confirming column names with dev
]

export default function PageName() {
  usePageTitle('Page Title', 'Subtitle')

  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from(TABLE_NAME)
      .select('*')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setData(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <div className="page-header">
        <h1>Page Title</h1>
        <p>Page description.</p>
      </div>
      <div className="page-content">
        <Card title="Data">
          {loading ? <LoadingSkeleton lines={5} /> :
           error   ? <EmptyState icon="⚠️" title="Error" message={error} /> :
                     <DataTable columns={columns} data={data} />}
        </Card>
      </div>
    </div>
  )
}
```

---

## 13. Per-Interface SOP

Every interface built from this template must have its own SOP document inside its repo at `docs/SOP_<InterfaceName>.md`. That document covers:

- What the interface does and who uses it
- What Supabase tables it reads from and writes to
- What Airtable sources it displays
- What each page does
- Any business rules specific to that interface

This per-interface SOP is separate from this template SOP and does not affect the template repo.

---

## 14. Output Rules for Generated Files

When generating a new page or component:
1. Output the complete file — no partial snippets
2. State the exact file path
3. State the `NAV_ITEMS` entry to add to `Sidebar.jsx`
4. Note any new Supabase tables or columns required
5. Never use placeholder table names — always confirm real names first
6. Never output hardcoded test data — use loading/empty states

---

*This file is read automatically by Claude Code from the repo root. Do not modify it per project — feed project-specific details during the session.*
