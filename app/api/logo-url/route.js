import { createClient, createServiceClient } from '@/lib/supabase/server'

/* ============================================================
   GET /api/logo-url
   Returns a short-lived signed URL for the company logo stored
   in the private `app-logo` Supabase Storage bucket.
   - Requires an authenticated session
   - Uses service role to bypass RLS on storage
   - Finds the first file in the bucket (no hardcoded filename)
   ============================================================ */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()

  const { data: files, error: listError } = await admin.storage
    .from('company-logo')
    .list('', { limit: 1 })

  if (listError || !files?.length) {
    return Response.json({ url: null })
  }

  const filename = files[0].name
  const { data, error } = await admin.storage
    .from('company-logo')
    .createSignedUrl(filename, 60 * 60 * 2) // 2-hour signed URL

  if (error || !data?.signedUrl) {
    return Response.json({ url: null })
  }

  return Response.json({ url: data.signedUrl })
}
