import { createClient, createServiceClient } from '@/lib/supabase/server'

/* ============================================================
   POST /api/invite-user
   Sends a Supabase invite email to a new user.
   - Validates caller is authenticated + admin
   - Uses service role to call inviteUserByEmail
   - Returns the new user's id so the portal can redirect
   ============================================================ */
export async function POST(request) {
  const { email } = await request.json()

  if (!email) {
    return Response.json({ error: 'Email is required' }, { status: 400 })
  }

  // Validate session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate admin
  const { data: profile } = await supabase
    .from('portal_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Send invite using service role
  const admin = createServiceClient()
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email)

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  return Response.json({ id: data.user.id })
}
