import { createClient, createServiceClient } from '@/lib/supabase/server'

/* ============================================================
   POST /api/revoke-user
   Revokes a user's access:
   1. Bans the account in Supabase Auth (10-year duration)
   2. Removes all portal_user_app_access records
   3. Sets is_admin = false in portal_profiles
   Requires caller to be authenticated + admin.
   Cannot revoke yourself.
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

  if (user.id === userId) {
    return Response.json({ error: 'You cannot revoke your own access.' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('portal_profiles')
    .select('is_admin, is_dev')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin && !profile?.is_dev) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createServiceClient()

  const [banResult] = await Promise.all([
    admin.auth.admin.updateUserById(userId, { ban_duration: '87600h' }),
    supabase.from('portal_user_app_access').delete().eq('user_id', userId),
    supabase.from('portal_profiles').update({ is_admin: false }).eq('id', userId),
  ])

  if (banResult.error) {
    return Response.json({ error: banResult.error.message }, { status: 400 })
  }

  return Response.json({ success: true })
}
