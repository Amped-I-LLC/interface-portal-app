'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

/* ============================================================
   Set Password Page
   Shown to newly invited users after clicking their invite link.
   The user already has a session — we just call updateUser.
   ============================================================ */
export default function SetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
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

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
            Amped I
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Welcome! Set a password to secure your account.
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label className="input-label">New Password</label>
              <input
                className="input"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="input-label">Confirm Password</label>
              <input
                className="input"
                type="password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
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

            <Button
              type="submit"
              variant="primary"
              disabled={loading || !password || !confirm}
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              {loading ? 'Saving…' : 'Set Password & Continue'}
            </Button>

          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>
          You'll use this password every time you sign in.
        </div>
      </div>
    </div>
  )
}
