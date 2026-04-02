import { createClient, createServiceClient } from '@/lib/supabase/server'

/* ============================================================
   POST /api/restore-user
   Restores a revoked user by unbanning their account.
   App access is NOT automatically restored — admin assigns
   it afterwards via Access Management.
   Requires caller to be authenticated + admin.
   ============================================================ */
export async function POST(request) {
  const { userId } = await request.json()

  if (!userId) {
    return Response.json({ error: 'userId is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('portal_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createServiceClient()
  const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' })

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  return Response.json({ success: true })
}
