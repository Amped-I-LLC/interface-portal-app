# Amped I — Interface Template

A reusable Next.js starter template for building internal interfaces at Amped I.
Includes Supabase Auth, the Amped I design system, sidebar + topbar layout, and
a server-side Airtable integration pattern.

---

## Starting a New Interface from This Template

1. On GitHub, click **"Use this template"** → **"Create a new repository"**
2. Name it `interface-[your-interface-name]` under the Amped I GitHub Org
3. Clone the new repo locally:
   ```bash
   git clone https://github.com/amped-i/interface-[name].git
   cd interface-[name]
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Fill in your Supabase URL and anon key
   ```
6. Run locally:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

---

## Customizing for Your Interface

| What to change | Where |
|---|---|
| App name | `components/layout/Sidebar.jsx` → logo section, `app/layout.jsx` → metadata |
| Nav items | `components/layout/Sidebar.jsx` → NAV_ITEMS array |
| Brand colors | `app/globals.css` → `:root` variables |
| Home page content | `app/(protected)/page.jsx` |
| Add a new page | Create `app/(protected)/[page-name]/page.jsx` + add to NAV_ITEMS |

---

## Folder Structure

```
app/
  (auth)/login/       ← public login page
  (protected)/        ← all pages here are auth-gated
    layout.jsx        ← sidebar + topbar wrapper
    page.jsx          ← home/dashboard
  api/airtable/       ← server-side Airtable API routes
  globals.css         ← design system
  layout.jsx          ← root layout

components/
  layout/
    Sidebar.jsx
    Topbar.jsx
  ui/                 ← reusable UI components
  ai/                 ← Claude AI dev layer

lib/
  supabase/
    client.js         ← browser Supabase client
    server.js         ← server Supabase client
  airtable.js         ← Airtable fetch helper

middleware.js         ← route protection
```

---

## Deploying to Vercel

1. Push to GitHub (to the Amped I org repo)
2. Go to vercel.com → Add New Project → select the repo
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — live in ~60 seconds
5. Add a custom domain in Vercel settings (e.g. `interface-name.amped-i.com`)

See the full SOP for detailed instructions.

---

## Security Checklist Before Going Live

- [ ] `.env.local` is in `.gitignore` and not committed
- [ ] Airtable keys are in Supabase `airtable_keys` table with RLS enabled
- [ ] All pages redirect to `/login` when unauthenticated (test in incognito)
- [ ] Repo is private in the GitHub Org
- [ ] Vercel project is linked to the Org, not a personal account
