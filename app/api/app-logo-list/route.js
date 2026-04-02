import { createClient, createServiceClient } from '@/lib/supabase/server'

/* ============================================================
   GET /api/app-logo-list
   Lists all files in the private `app-logos` bucket and
   returns each with a short-lived signed URL.
   Used by the logo picker in the Admin → Apps form.
   Requires an authenticated + admin session.
   ============================================================ */
export async function GET() {
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

  const { data: files, error } = await admin.storage
    .from('app-logos')
    .list('', { sortBy: { column: 'created_at', order: 'desc' } })

  if (error) {
    return Response.json({ files: [] })
  }

  const validFiles = (files ?? []).filter(f => f.name !== '.emptyFolderPlaceholder')

  const signed = await Promise.all(
    validFiles.map(async f => {
      const { data } = await admin.storage
        .from('app-logos')
        .createSignedUrl(f.name, 60 * 60 * 2)
      return { name: f.name, url: data?.signedUrl ?? null }
    })
  )

  return Response.json({ files: signed.filter(f => f.url) })
}
