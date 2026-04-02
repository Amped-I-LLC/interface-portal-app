import { createClient, createServiceClient } from '@/lib/supabase/server'

/* ============================================================
   /api/dev/airtable-connections
   CRUD for the global airtable_connections table.
   All operations require is_dev = true.
   api_key values are never returned in full — the GET response
   masks everything except the last 4 characters.
   ============================================================ */

async function requireDev(supabase, user) {
  const { data: profile } = await supabase
    .from('portal_profiles')
    .select('is_dev')
    .eq('id', user.id)
    .single()
  return profile?.is_dev === true
}

// GET — list all connections (api_key masked)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireDev(supabase, user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('airtable_connections')
    .select('id, app_name, base_id, api_key, notes, created_at')
    .order('app_name')

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const masked = (data ?? []).map(row => ({
    ...row,
    api_key: row.api_key ? `••••••••${row.api_key.slice(-4)}` : '',
  }))

  return Response.json({ connections: masked })
}

// POST — create a new connection
export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireDev(supabase, user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { app_name, base_id, api_key, notes } = await request.json()
  if (!app_name?.trim() || !base_id?.trim() || !api_key?.trim()) {
    return Response.json({ error: 'app_name, base_id, and api_key are required' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('airtable_connections')
    .insert({ app_name: app_name.trim(), base_id: base_id.trim(), api_key: api_key.trim(), notes: notes?.trim() || null })
    .select('id, app_name, base_id, notes, created_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })

  return Response.json({ connection: { ...data, api_key: `••••••••${api_key.trim().slice(-4)}` } })
}

// PATCH — update an existing connection
export async function PATCH(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireDev(supabase, user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id, app_name, base_id, api_key, notes } = await request.json()
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const updates = {}
  if (app_name !== undefined) updates.app_name = app_name.trim()
  if (base_id  !== undefined) updates.base_id  = base_id.trim()
  if (notes    !== undefined) updates.notes    = notes?.trim() || null
  // Only update api_key if a real value was provided (not the masked placeholder)
  if (api_key && !api_key.startsWith('••')) updates.api_key = api_key.trim()

  const admin = createServiceClient()
  const { error } = await admin.from('airtable_connections').update(updates).eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 400 })

  return Response.json({ success: true })
}

// DELETE — remove a connection
export async function DELETE(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireDev(supabase, user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const admin = createServiceClient()
  const { error } = await admin.from('airtable_connections').delete().eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 400 })

  return Response.json({ success: true })
}
