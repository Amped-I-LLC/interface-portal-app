'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // Forgot password state
  const [showForgot,   setShowForgot]   = useState(false)
  const [resetEmail,   setResetEmail]   = useState('')
  const [resetSending, setResetSending] = useState(false)
  const [resetSent,    setResetSent]    = useState(false)
  const [resetErr,     setResetErr]     = useState('')

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

    const params = new URLSearchParams(window.location.search)
    router.push(params.get('redirectTo') || '/')
    router.refresh()
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setResetErr('')
    setResetSending(true)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${siteUrl}/auth/callback?next=set-password`,
    })

    setResetSending(false)
    if (error) {
      setResetErr(error.message)
    } else {
      setResetSent(true)
    }
  }

  // ── Forgot password view ──────────────────────────────────
  if (showForgot) {
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

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              Amped I
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Reset your password
            </div>
          </div>

          <div className="card">
            {resetSent ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>📬</div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                  Check your email
                </p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
                  We sent a password reset link to <strong>{resetEmail}</strong>.
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail('') }}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Back to Sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label className="input-label">Your email address</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@amped-i.com"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {resetErr && (
                  <div style={{
                    padding: '10px 12px',
                    background: 'var(--color-danger-light)',
                    color: '#991b1b',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    marginBottom: 16,
                  }}>
                    {resetErr}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={resetSending || !resetEmail.trim()}
                  style={{ width: '100%', justifyContent: 'center', padding: '10px', marginBottom: 10 }}
                >
                  {resetSending ? 'Sending…' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowForgot(false); setResetErr('') }}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Back to Sign in
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Login view ────────────────────────────────────────────
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

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
            Amped I
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Sign in to continue
          </div>
        </div>

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

          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button
              type="button"
              onClick={() => { setShowForgot(true); setResetEmail(email) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: 'var(--color-text-muted)',
                textDecoration: 'underline',
              }}
            >
              Forgot password?
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>
          Access is managed by your administrator.
        </div>
      </div>
    </div>
  )
}
