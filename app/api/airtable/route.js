import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/* ============================================================
   Airtable API Route — Secured with Service Role

   Security model:
   1. Validates the user is authenticated (anon key + session)
   2. Reads airtable_keys using service role (bypasses RLS)
   3. Calls Airtable server-side — key never reaches browser
   4. Returns only records to the browser

   The airtable_keys table has NO RLS read policy for
   authenticated users — only the service role can read it.
   This prevents users from querying keys directly via the
   browser Supabase client.

   SUPABASE_SERVICE_ROLE_KEY is server-only (no NEXT_PUBLIC_).
   It is physically excluded from the browser JS bundle.

   Query params:
     app   — matches airtable_keys.app_name (e.g. 'interface-sales-dashboard')
     table — the Airtable table name to query
     view  — (optional) Airtable view name

   Example call from the browser:
     const res = await fetch('/api/airtable?app=interface-sales-dashboard&table=Projects')
     const records = await res.json()
   ============================================================ */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const appName   = searchParams.get('app')
  const tableName = searchParams.get('table')
  const viewName  = searchParams.get('view')

  if (!appName || !tableName) {
    return Response.json({ error: 'Missing required params: app, table' }, { status: 400 })
  }

  /* --- Step 1: Validate the user is authenticated --- */
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  /* --- Step 2: Read airtable_keys using service role --- */
  /* Service role key is server-only — never prefixed with NEXT_PUBLIC_ */
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: keyRow, error: keyError } = await admin
    .from('airtable_keys')
    .select('api_key, base_id')
    .eq('app_name', appName)
    .single()

  if (keyError || !keyRow) {
    return Response.json({ error: 'Airtable credentials not found' }, { status: 404 })
  }

  /* --- Step 3: Call Airtable — key never leaves the server --- */
  const url = new URL(`https://api.airtable.com/v0/${keyRow.base_id}/${encodeURIComponent(tableName)}`)
  if (viewName) url.searchParams.set('view', viewName)

  const airtableRes = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${keyRow.api_key}` },
    next: { revalidate: 60 },
  })

  if (!airtableRes.ok) {
    return Response.json({ error: 'Airtable request failed' }, { status: airtableRes.status })
  }

  const data = await airtableRes.json()
  return Response.json(data.records ?? [])
}
