import { createClient, createServiceClient } from '@/lib/supabase/server'

/* ============================================================
   GET /api/sop?app_id=<uuid>
   Fetches the SOP_User_*.md file from the app's GitHub repo.
   - Validates user session
   - Validates user has access to the app (or is admin)
   - Fetches PAT from github_connections (server-side only)
   - Returns raw markdown content
   ============================================================ */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const app_id = searchParams.get('app_id')

  if (!app_id) {
    return Response.json({ error: 'Missing app_id' }, { status: 400 })
  }

  const supabase = await createClient()

  // Validate session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get app details
  const { data: app, error: appError } = await supabase
    .from('portal_apps')
    .select('id, name, github_repo, sop_path, is_active')
    .eq('id', app_id)
    .eq('is_active', true)
    .single()

  if (appError || !app) {
    return Response.json({ error: 'App not found' }, { status: 404 })
  }

  if (!app.github_repo || !app.sop_path) {
    return Response.json({ error: 'No SOP configured for this app' }, { status: 404 })
  }

  // Check user has access (admin/dev or has access row)
  const { data: profile } = await supabase
    .from('portal_profiles')
    .select('is_admin, is_dev')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin && !profile?.is_dev) {
    const { data: access } = await supabase
      .from('portal_user_app_access')
      .select('id')
      .eq('user_id', user.id)
      .eq('app_id', app_id)
      .single()

    if (!access) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Fetch PAT from github_connections using service role
  const supabaseAdmin = createServiceClient()
  const { data: conn } = await supabaseAdmin
    .from('github_connections')
    .select('token')
    .limit(1)
    .single()

  if (!conn?.token) {
    return Response.json({ error: 'GitHub connection not configured' }, { status: 500 })
  }

  // Fetch file from GitHub API
  const [owner, repo] = app.github_repo.split('/')
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${app.sop_path}`

  const ghRes = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${conn.token}`,
      Accept: 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  })

  if (!ghRes.ok) {
    return Response.json({ error: `GitHub fetch failed: ${ghRes.status}` }, { status: 502 })
  }

  const markdown = await ghRes.text()
  return new Response(markdown, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
