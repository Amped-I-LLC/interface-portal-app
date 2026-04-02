'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePageTitle } from '@/lib/page-context'
import { useAdminGuard } from '@/lib/use-admin-guard'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'

export default function AdminUsersPage() {
  usePageTitle('Admin — Users', 'Manage users')
  const { loading: guardLoading } = useAdminGuard()
  const router = useRouter()
  const supabase = createClient()

  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [email,      setEmail]      = useState('')
  const [sending,    setSending]    = useState(false)
  const [inviteErr,  setInviteErr]  = useState(null)
  // confirmAction: { id, type: 'revoke' | 'delete' } | null
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionId,   setActionId]   = useState(null) // user id currently being acted on
  const [actionErr,  setActionErr]  = useState(null)
  const [selfId,     setSelfId]     = useState(null)

  useEffect(() => {
    if (guardLoading) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setSelfId(user.id)
    })
    fetchUsers()
  }, [guardLoading])

  async function fetchUsers() {
    setLoading(true)
    const res = await fetch('/api/users-with-status')
    const json = await res.json()
    setUsers(json.users ?? [])
    setLoading(false)
  }

  async function sendInvite(e) {
    e.preventDefault()
    if (!email.trim()) return
    setInviteErr(null)
    setSending(true)

    const res = await fetch('/api/invite-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    const json = await res.json()

    if (!res.ok) {
      setInviteErr(json.error || 'Failed to send invite.')
      setSending(false)
      return
    }

    router.push(`/admin/access?user=${json.id}`)
  }

  async function revokeUser(userId) {
    setActionErr(null)
    setActionId(userId)
    setConfirmAction(null)

    const res = await fetch('/api/revoke-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const json = await res.json()

    if (!res.ok) {
      setActionErr(json.error || 'Failed to revoke access.')
    } else {
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_banned: true, is_admin: false } : u
      ))
    }
    setActionId(null)
  }

  async function restoreUser(userId) {
    setActionErr(null)
    setActionId(userId)

    const res = await fetch('/api/restore-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const json = await res.json()

    if (!res.ok) {
      setActionErr(json.error || 'Failed to restore user.')
    } else {
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_banned: false } : u
      ))
    }
    setActionId(null)
  }

  async function deleteUser(userId) {
    setActionErr(null)
    setActionId(userId)
    setConfirmAction(null)

    const res = await fetch('/api/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const json = await res.json()

    if (!res.ok) {
      setActionErr(json.error || 'Failed to delete user.')
    } else {
      setUsers(prev => prev.filter(u => u.id !== userId))
    }
    setActionId(null)
  }

  if (guardLoading) return null

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <p>Invite new users and manage existing ones.</p>
      </div>

      <div className="page-content">

        {/* Invite form */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3>Invite User</h3></div>
          <form onSubmit={sendInvite}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setInviteErr(null) }}
                  placeholder="employee@ampedi.com"
                  disabled={sending}
                />
                {inviteErr && (
                  <p style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 6 }}>{inviteErr}</p>
                )}
              </div>
              <Button type="submit" variant="primary" disabled={sending || !email.trim()}>
                {sending ? 'Sending…' : 'Send Invite'}
              </Button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
              The user will receive an email with a link to set their password. You'll be redirected to assign their app access immediately after.
            </p>
          </form>
        </div>

        {/* Users list */}
        {loading ? (
          <LoadingSkeleton lines={4} card />
        ) : users.length === 0 ? (
          <EmptyState icon="⊡" title="No users yet" message="Invite your first user above." />
        ) : (
          <div className="card">
            <div className="card-header"><h3>All Users</h3></div>

            {actionErr && (
              <div style={{ padding: '10px 16px', background: 'var(--color-danger-light, #fef2f2)', borderBottom: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: 12, color: 'var(--color-danger)', margin: 0 }}>{actionErr}</p>
              </div>
            )}

            {users.map(user => {
              const initials      = (user.full_name || user.email || '?').slice(0, 2).toUpperCase()
              const isSelf        = user.id === selfId
              const isAdmin       = user.is_admin
              const isActing      = actionId === user.id
              const pendingAction = confirmAction?.id === user.id ? confirmAction.type : null

              return (
                <div key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>

                  {/* Main row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    opacity: user.is_banned ? 0.6 : 1,
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'var(--color-primary-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0,
                    }}>
                      {initials}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>
                        {user.full_name || user.email}
                      </div>
                      {user.full_name && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{user.email}</div>
                      )}
                    </div>

                    {/* Status badges */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {user.is_admin   && <Badge variant="info">Admin</Badge>}
                      {user.is_pending && <Badge variant="warning">Pending</Badge>}
                      {user.is_banned  && <Badge variant="danger">Revoked</Badge>}
                    </div>

                    {/* Actions */}
                    {!isSelf && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                        {!user.is_banned && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => router.push(`/admin/access?user=${user.id}`)}
                            disabled={isActing}
                          >
                            Manage Access
                          </Button>
                        )}

                        {!isAdmin && (
                          <>
                            {user.is_banned ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => restoreUser(user.id)}
                                disabled={isActing}
                              >
                                {isActing ? 'Restoring…' : 'Restore'}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="neutral"
                                onClick={() => setConfirmAction(
                                  pendingAction === 'revoke' ? null : { id: user.id, type: 'revoke' }
                                )}
                                disabled={isActing}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                </svg>
                                Revoke
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setConfirmAction(
                                pendingAction === 'delete' ? null : { id: user.id, type: 'delete' }
                              )}
                              disabled={isActing}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                              </svg>
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline confirmation panel */}
                  {pendingAction === 'revoke' && (
                    <div style={{
                      padding: '12px 16px',
                      background: 'var(--color-bg-page)',
                      borderTop: '1px solid var(--color-border)',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <p style={{ fontSize: 13, color: 'var(--color-text-primary)', margin: 0, flex: 1 }}>
                        This will ban the account and remove all app access for <strong>{user.full_name || user.email}</strong>. The account can be restored later.
                      </p>
                      <Button size="sm" variant="danger" onClick={() => revokeUser(user.id)}>
                        Yes, Revoke
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setConfirmAction(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}

                  {pendingAction === 'delete' && (
                    <div style={{
                      padding: '12px 16px',
                      background: 'var(--color-bg-page)',
                      borderTop: '1px solid var(--color-border)',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <p style={{ fontSize: 13, color: 'var(--color-text-primary)', margin: 0, flex: 1 }}>
                        <strong>Permanently delete</strong> the account for <strong>{user.full_name || user.email}</strong>? This removes all their data and cannot be undone.
                      </p>
                      <Button size="sm" variant="danger" onClick={() => deleteUser(user.id)}>
                        Yes, Delete
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setConfirmAction(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
