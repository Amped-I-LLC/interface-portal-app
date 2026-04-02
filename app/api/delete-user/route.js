import { createClient, createServiceClient } from '@/lib/supabase/server'

/* ============================================================
   POST /api/delete-user
   Permanently deletes a user:
   1. Removes portal_user_app_access records
   2. Removes portal_profiles record
   3. Deletes the account from Supabase Auth (irreversible)
   Requires caller to be authenticated + admin.
   Cannot delete yourself.
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
    return Response.json({ error: 'You cannot delete your own account.' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('portal_profiles')
    .select('is_admin, is_dev')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin && !profile?.is_dev) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Clear relational data first, then delete the auth account
  await Promise.all([
    supabase.from('portal_user_app_access').delete().eq('user_id', userId),
    supabase.from('portal_profiles').delete().eq('id', userId),
  ])

  const admin = createServiceClient()
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  return Response.json({ success: true })
}
