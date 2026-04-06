'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/* ============================================================
   Auth Callback Page
   Handles the redirect after an invite or password-reset link.
   Works with both PKCE (token_hash) and implicit (hash fragment) flows.
   ============================================================ */
export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function handle() {
      const params = new URLSearchParams(window.location.search)
      const token_hash = params.get('token_hash')
      const type       = params.get('type')        // 'invite' | 'recovery' | etc.
      const code       = params.get('code')        // PKCE OAuth code (less common for invites)
      const next       = params.get('next') ?? '/' // where to go after (we pass 'set-password')

      // --- PKCE code exchange (OAuth / some email flows) ---
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.replace(next === 'set-password' ? '/set-password' : next)
          return
        }
      }

      // --- token_hash OTP (email invite / magic link / recovery) ---
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (!error) {
          router.replace(type === 'invite' ? '/set-password' : next)
          return
        }
      }

      // --- Implicit flow (hash fragment tokens) ---
      // Supabase JS client auto-processes hash tokens on init.
      // We just need to wait for the SIGNED_IN event.
      const hashStr   = window.location.hash.slice(1)
      const hashType  = new URLSearchParams(hashStr).get('type')

      if (hashStr.includes('access_token')) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
            subscription.unsubscribe()
            router.replace(hashType === 'invite' ? '/set-password' : '/')
          }
        })
        // Fallback if event never fires
        setTimeout(() => router.replace('/login?error=invalid_link'), 6000)
        return
      }

      // Nothing matched — bad / expired link
      router.replace('/login?error=invalid_link')
    }

    handle()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-page)',
      fontSize: 14,
      color: 'var(--color-text-muted)',
    }}>
      Verifying your link…
    </div>
  )
}
