import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/* ============================================================
   GET /auth/callback
   Handles Supabase email link tokens (invite, recovery, etc.)
   - Exchanges the token_hash for a session
   - For invite links: redirects to /set-password
   - For other links: redirects to / (or ?next= param)
   ============================================================ */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
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
            } catch {}
          },
        },
      }
    )

    const { error } = await supabase.auth.verifyOtp({ token_hash, type })

    if (!error) {
      if (type === 'invite') {
        return NextResponse.redirect(new URL('/set-password', origin))
      }
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  // Invalid or expired link
  return NextResponse.redirect(new URL('/login?error=invalid_link', origin))
}
