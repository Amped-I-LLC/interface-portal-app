# Amped I — Project Preferences & Decisions Log
## Running record of confirmed decisions, pending items, and deferred discussions

Last updated: 2026-04-01

---

## Design System

| Decision | Status | Notes |
|---|---|---|
| Font: Inter | Confirmed for now | Revisit when brand guidelines are formalized |
| Colors: navy `#1e2d4d` + blue `#3b6ef6` | Confirmed for now | Revisit when brand guidelines are formalized |
| Light mode only | Confirmed | Dark mode logged as future improvement in SOP |
| Logo served from Supabase Storage table | Confirmed | Interfaces fetch logo file from a Supabase table at runtime — not hardcoded |

---

## Data & Supabase

| Decision | Status | Notes |
|---|---|---|
| One shared Supabase project for all interfaces | Confirmed for now | Multi-project support logged as future improvement in SOP |
| Airtable = read-only display only | Confirmed | No writes to Airtable from interfaces. Airtable write support logged as future improvement |
| `airtable_keys.app_name` naming convention | Confirmed | Must match `interface-<interface-name>` (same as repo name) |
| Claude asks about tables per component before building | Confirmed | Devs must not defer to default/placeholder table names. Each interface is bespoke |
| Each new interface requires its own interface-specific SOP | Confirmed | See Process section below |

---

## Security

| Decision | Status | Notes |
|---|---|---|
| `airtable_keys` RLS — service role only, no authenticated read | **Resolved** | Removed authenticated read policy. Server route uses `SUPABASE_SERVICE_ROLE_KEY` to read keys after validating user session. Users cannot query the table from the browser. |
| `user_app_access` + `app_registry` RLS | **Deferred to portal build** | This is a portal-app concern, not a template concern. Discuss and implement when building `portal-app`. Only admin users see the full list; authenticated users see only their assigned apps. |
| Vercel preview URL protection | **Resolved — no action needed** | Preview URLs are randomly generated, not indexed, not discoverable. Data is behind Supabase Auth regardless. With a small dev team, no sharing = no risk. |

---

## Deployment & Infrastructure

| Decision | Status | Notes |
|---|---|---|
| Domain: `amped-i.com` and subdomains | **Pending confirmation** | Logged as crucial pending item in SOP |
| Vercel team under `Amped-I-LLC` org | **Pending confirmation** | Logged as crucial pending item in SOP |
| One Supabase project currently | Confirmed | Same as data section — multi-project is future |
| Each interface = own Vercel project = own subdomain | Confirmed | `app-<name>.amped-i.com` pattern |

---

## Process

| Decision | Status | Notes |
|---|---|---|
| Repo creation is manual | Confirmed | Dev creates repo on GitHub under `Amped-I-LLC`, pulls template, works from there. This process does NOT auto-create repos. |
| Repo naming convention | Confirmed | `interface-<interface-name>` for interfaces, `portal-app` for the portal |
| `airtable_keys.app_name` convention | Confirmed | Must match repo name: `interface-<interface-name>` |
| `main` branch always protected | Confirmed | Require PR + review before merging to main |
| Always branch off `main` for new work | Confirmed | Never work directly on `main`. Create a branch immediately after cloning the template |
| Template SOP is maintained by Amped I | Confirmed | Changes to the template SOP are pushed to this repo only |
| Per-interface SOP is separate | Confirmed | Each new interface project has its own SOP documenting what that interface does. Changes there do NOT push back to the template |
| Template is standalone | Confirmed | Edits made in new interface projects do not affect the template repo |
| `CLAUDE.md` is a starting point | Confirmed | No need to modify per project. Feed specifics (table names, schema, etc.) to Claude Code during the session as needed |

---

## The App Portal

| Decision | Status | Notes |
|---|---|---|
| Portal work status | Not started | Will be the first real test of the template. Repo: `portal-app` |
| Portal mockup | Available | Feed the mockup directly to Claude Code when starting portal work |
| App statuses | Confirmed | `live`, `maintenance`, `coming_soon` |
| Access management | Confirmed | Admins manage `user_app_access` and `app_registry` directly in Supabase — no admin UI needed initially |

---

## GitHub / Commits

| Decision | Status | Notes |
|---|---|---|
| Commit authorship | Confirmed | Commits are by whichever dev worked on the build — no shared bot account |
| Branch protection on `main` | Confirmed | Always enforced from day one on every repo |

---

## Future Improvements Log
*(Items confirmed for future but not current scope)*

- [ ] Dark mode support
- [ ] Multi-Supabase project support per interface
- [ ] Airtable write support (with sync-back to Supabase)
- [ ] Domain confirmation and DNS setup — `amped-i.com` (**crucial, pending**)
- [ ] Vercel team setup under `Amped-I-LLC` (**crucial, pending**)
- [ ] RLS scoping on `airtable_keys` per app (security — deferred)
- [ ] RLS on `user_app_access` and `app_registry` (security — deferred)
- [ ] Vercel preview URL protection (security — deferred)
- [ ] Admin UI for managing `user_app_access` (portal — future)
- [ ] Logo management UI (currently Supabase Storage direct)

---

## Open / Deferred Items
*(Needs a dedicated discussion before implementing)*

- Security model for `airtable_keys` RLS — should it be scoped per app or per user?
- Security model for `user_app_access` + `app_registry` RLS
- Vercel preview URL access control policy
