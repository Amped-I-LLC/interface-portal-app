import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/* ============================================================
   Supabase Server Client
   Use this in Server Components, API routes, and middleware.
   e.g. fetching data, reading session on the server,
        fetching Airtable keys from the airtable_keys table
   ============================================================ */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    }
  )
}
