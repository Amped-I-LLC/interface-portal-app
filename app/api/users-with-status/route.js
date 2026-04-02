import { createClient, createServiceClient } from '@/lib/supabase/server'

/* ============================================================
   GET /api/users-with-status
   Returns all portal users merged with their auth status:
   - is_banned  — account is banned (access revoked)
   - is_pending — invited but has not accepted yet
   Requires caller to be authenticated + admin.
   ============================================================ */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
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

  const [{ data: authData }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from('portal_profiles').select('*').order('email'),
  ])

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const users = (authData?.users ?? [])
    .filter(u => profileMap[u.id])
    .map(u => {
      const now = new Date()
      const bannedUntil = u.banned_until ? new Date(u.banned_until) : null
      return {
        ...profileMap[u.id],
        is_banned:  bannedUntil ? bannedUntil > now : false,
        is_pending: !u.email_confirmed_at && !!u.invited_at,
      }
    })
    .sort((a, b) => (a.email ?? '').localeCompare(b.email ?? ''))

  return Response.json({ users })
}
