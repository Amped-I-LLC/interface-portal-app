import { createClient, createServiceClient } from '@/lib/supabase/server'

/* ============================================================
   /api/dev/portal-profiles
   GET  — list all portal profiles with role flags
   PATCH — update is_admin / is_dev for a specific profile
   Requires is_dev = true.
   A dev cannot remove their own is_dev flag (self-lockout protection).
   ============================================================ */

async function requireDev(supabase, user) {
  const { data: profile } = await supabase
    .from('portal_profiles')
    .select('is_dev')
    .eq('id', user.id)
    .single()
  return profile?.is_dev === true
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireDev(supabase, user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('portal_profiles')
    .select('id, email, full_name, is_admin, is_dev, created_at')
    .order('email')

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ profiles: data ?? [] })
}

export async function PATCH(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireDev(supabase, user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id, is_admin, is_dev } = await request.json()
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  // Prevent a dev from removing their own is_dev flag
  if (id === user.id && is_dev === false) {
    return Response.json({ error: 'You cannot remove your own dev role.' }, { status: 400 })
  }

  const updates = {}
  if (is_admin !== undefined) updates.is_admin = is_admin
  if (is_dev   !== undefined) updates.is_dev   = is_dev

  const admin = createServiceClient()
  const { error } = await admin.from('portal_profiles').update(updates).eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 400 })

  return Response.json({ success: true })
}
