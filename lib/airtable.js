/* ============================================================
   Airtable Client Helper
   Calls the server-side /api/airtable route — never touches
   Airtable or the API key directly from the browser.

   Usage:
     import { fetchAirtable } from '@/lib/airtable'

     const records = await fetchAirtable({
       app:   'my-app',        // matches app_name in airtable_keys table
       table: 'Projects',      // Airtable table name
       view:  'Grid view',     // optional: Airtable view name
     })
   ============================================================ */
export async function fetchAirtable({ app, table, view } = {}) {
  if (!app || !table) {
    throw new Error('fetchAirtable requires { app, table }')
  }

  const params = new URLSearchParams({ app, table })
  if (view) params.set('view', view)

  const res = await fetch(`/api/airtable?${params.toString()}`)

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Airtable fetch failed (${res.status})`)
  }

  return res.json()
}
