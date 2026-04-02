import { createClient, createServiceClient } from '@/lib/supabase/server'

/* ============================================================
   /api/dev/airtable-connections
   CRUD for the global airtable_connections table.
   Schema: id, app, name, token, base_id, notes, created_at
   All operations require is_dev = true.
   token values are never returned in full — masked to last 4 chars.
   ============================================================ */

async function requireDev(supabase, user) {
  const { data: profile } = await supabase
    .from('portal_profiles')
    .select('is_dev')
    .eq('id', user.id)
    .single()
  return profile?.is_dev === true
}

// GET — list all connections (token masked)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireDev(supabase, user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('airtable_connections')
    .select('id, app, name, token, base_id, notes, created_at')
    .order('app')

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const masked = (data ?? []).map(row => ({
    ...row,
    token: row.token ? `••••••••${row.token.slice(-4)}` : '',
  }))

  return Response.json({ connections: masked })
}

// POST — create a new connection
export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireDev(supabase, user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { app, name, token, base_id, notes } = await request.json()
  if (!app?.trim() || !token?.trim() || !base_id?.trim()) {
    return Response.json({ error: 'app, token, and base_id are required' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('airtable_connections')
    .insert({
      app:     app.trim(),
      name:    name?.trim() || null,
      token:   token.trim(),
      base_id: base_id.trim(),
      notes:   notes?.trim() || null,
    })
    .select('id, app, name, base_id, notes, created_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })

  return Response.json({ connection: { ...data, token: `••••••••${token.trim().slice(-4)}` } })
}

// PATCH — update an existing connection
export async function PATCH(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireDev(supabase, user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id, app, name, token, base_id, notes } = await request.json()
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const updates = {}
  if (app     !== undefined) updates.app     = app.trim()
  if (name    !== undefined) updates.name    = name?.trim() || null
  if (base_id !== undefined) updates.base_id = base_id.trim()
  if (notes   !== undefined) updates.notes   = notes?.trim() || null
  // Only update token if a real value was provided (not the masked placeholder)
  if (token && !token.startsWith('••')) updates.token = token.trim()

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
