import { createBrowserClient } from '@supabase/ssr'

/* ============================================================
   Supabase Browser Client
   Use this in Client Components ('use client')
   e.g. login forms, logout buttons, real-time subscriptions
   ============================================================ */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
