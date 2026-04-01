'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/* ============================================================
   Login Page
   - Supabase email + password auth
   - Redirects to /dashboard (or original destination) on success
   - Shows inline error on failure
   ============================================================ */
export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Redirect to original destination or dashboard
    const params = new URLSearchParams(window.location.search)
    router.push(params.get('redirectTo') || '/')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
          }}>
            Amped I
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Sign in to continue
          </div>
        </div>

        {/* Login Card */}
        <div className="card">
          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label className="input-label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@amped-i.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="input-label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                padding: '10px 12px',
                background: 'var(--color-danger-light)',
                color: '#991b1b',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>
          Access is managed by your administrator.
        </div>
      </div>
    </div>
  )
}
