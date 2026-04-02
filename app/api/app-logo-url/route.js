import { createClient, createServiceClient } from '@/lib/supabase/server'

/* ============================================================
   GET /api/app-logo-url?path=filename.ext
   Returns a short-lived signed URL for a single file in the
   private `app-logos` bucket.
   Requires an authenticated session.
   ============================================================ */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    return Response.json({ error: 'path is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()
  const { data, error } = await admin.storage
    .from('app-logos')
    .createSignedUrl(path, 60 * 60 * 2) // 2-hour signed URL

  if (error || !data?.signedUrl) {
    return Response.json({ url: null })
  }

  return Response.json({ url: data.signedUrl })
}
