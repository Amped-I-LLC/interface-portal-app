import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

/* ============================================================
   MIDDLEWARE — Route Protection
   Runs on every request before the page renders.
   Redirects unauthenticated users to /login.
   Add any public routes to the PUBLIC_ROUTES array below.
   ============================================================ */

const PUBLIC_ROUTES = ['/login']

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })

  // Allow public routes through without auth check
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return response
  }

  // Create a Supabase server client using the request cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Check for a valid user session
  const { data: { user } } = await supabase.auth.getUser()

  // No session — redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    // Preserve the original destination so we can redirect back after login
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

// Apply middleware to all routes except Next.js internals and static files
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
