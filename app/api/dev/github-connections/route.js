import { createClient, createServiceClient } from '@/lib/supabase/server'

/* ============================================================
   /api/dev/github-connections
   CRUD for the global github_connections table.
   All operations require is_dev = true.
   token values are never returned in full — the GET response
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

// GET — list all connections (token masked)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireDev(supabase, user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('github_connections')
    .select('id, label, token, notes, created_at')
    .order('created_at', { ascending: false })

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

  const { label, token, notes } = await request.json()
  if (!token?.trim()) {
    return Response.json({ error: 'token is required' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('github_connections')
    .insert({ label: label?.trim() || null, token: token.trim(), notes: notes?.trim() || null })
    .select('id, label, notes, created_at')
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

  const { id, label, token, notes } = await request.json()
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const updates = {}
  if (label !== undefined) updates.label = label?.trim() || null
  if (notes !== undefined) updates.notes = notes?.trim() || null
  if (token && !token.startsWith('••')) updates.token = token.trim()

  const admin = createServiceClient()
  const { error } = await admin.from('github_connections').update(updates).eq('id', id)

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
  const { error } = await admin.from('github_connections').delete().eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 400 })

  return Response.json({ success: true })
}
