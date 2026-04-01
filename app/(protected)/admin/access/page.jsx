'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePageTitle } from '@/lib/page-context'
import { useAdminGuard } from '@/lib/use-admin-guard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'

export default function AdminAccessPage() {
  usePageTitle('Admin — Access', 'Manage user app access')
  const { loading: guardLoading } = useAdminGuard()

  const [tab,        setTab]        = useState('users')
  const [users,      setUsers]      = useState([])
  const [apps,       setApps]       = useState([])
  const [access,     setAccess]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [editState,  setEditState]  = useState({})
  const [saving,     setSaving]     = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!guardLoading) fetchAll()
  }, [guardLoading])

  async function fetchAll() {
    const [usersRes, appsRes, accessRes] = await Promise.all([
      supabase.from('portal_profiles').select('*').order('email'),
      supabase.from('portal_apps').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('portal_user_app_access').select('*'),
    ])
    setUsers(usersRes.data ?? [])
    setApps(appsRes.data ?? [])
    setAccess(accessRes.data ?? [])
    setLoading(false)
  }

  // ── By User helpers ──────────────────────────────────────
  function expandUser(user) {
    if (expandedId === user.id) { setExpandedId(null); return }
    const currentAppIds = access
      .filter(a => a.user_id === user.id)
      .map(a => a.app_id)
    const state = {}
    apps.forEach(app => { state[app.id] = currentAppIds.includes(app.id) })
    state.__isAdmin = user.is_admin
    setEditState(state)
    setExpandedId(user.id)
  }

  async function saveUserAccess(user) {
    setSaving(true)
    const currentAppIds = access.filter(a => a.user_id === user.id).map(a => a.app_id)
    const newAppIds     = apps.filter(a => editState[a.id]).map(a => a.id)
    const toAdd    = newAppIds.filter(id => !currentAppIds.includes(id))
    const toRemove = currentAppIds.filter(id => !newAppIds.includes(id))

    const ops = []
    if (toAdd.length)
      ops.push(supabase.from('portal_user_app_access').insert(toAdd.map(app_id => ({ user_id: user.id, app_id }))))
    if (toRemove.length)
      ops.push(supabase.from('portal_user_app_access').delete().eq('user_id', user.id).in('app_id', toRemove))
    if (editState.__isAdmin !== user.is_admin)
      ops.push(supabase.from('portal_profiles').update({ is_admin: editState.__isAdmin }).eq('id', user.id))

    await Promise.all(ops)
    await fetchAll()
    setExpandedId(null)
    setSaving(false)
  }

  // ── By App helpers ───────────────────────────────────────
  function expandApp(app) {
    if (expandedId === app.id) { setExpandedId(null); return }
    const currentUserIds = access.filter(a => a.app_id === app.id).map(a => a.user_id)
    const state = {}
    users.forEach(u => { state[u.id] = currentUserIds.includes(u.id) })
    setEditState(state)
    setExpandedId(app.id)
  }

  async function saveAppAccess(app) {
    setSaving(true)
    const currentUserIds = access.filter(a => a.app_id === app.id).map(a => a.user_id)
    const newUserIds     = users.filter(u => editState[u.id]).map(u => u.id)
    const toAdd    = newUserIds.filter(id => !currentUserIds.includes(id))
    const toRemove = currentUserIds.filter(id => !newUserIds.includes(id))

    const ops = []
    if (toAdd.length)
      ops.push(supabase.from('portal_user_app_access').insert(toAdd.map(user_id => ({ user_id, app_id: app.id }))))
    if (toRemove.length)
      ops.push(supabase.from('portal_user_app_access').delete().eq('app_id', app.id).in('user_id', toRemove))

    await Promise.all(ops)
    await fetchAll()
    setExpandedId(null)
    setSaving(false)
  }

  if (guardLoading) return null

  return (
    <div>
      <div className="page-header">
        <h1>Access Management</h1>
        <p>Control which users have access to which apps.</p>
      </div>

      <div className="page-content">

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--color-border)', marginBottom: 24 }}>
          {[['users', 'By User'], ['apps', 'By App']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setExpandedId(null) }}
              style={{
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: tab === key ? 600 : 400,
                color: tab === key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -2,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? <LoadingSkeleton lines={5} card /> : (

          tab === 'users' ? (
            <div className="card">
              <div className="card-header"><h3>Users</h3></div>
              {users.map(user => {
                const userAppIds = access.filter(a => a.user_id === user.id).map(a => a.app_id)
                const userApps   = apps.filter(a => userAppIds.includes(a.id))
                const isExpanded = expandedId === user.id
                const initials   = (user.full_name || user.email || '?').slice(0, 2).toUpperCase()

                return (
                  <div key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {/* User row */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12 }}>
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
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                        {user.is_admin && <Badge variant="info">Admin</Badge>}
                        {userApps.map(a => (
                          <Badge key={a.id} variant="neutral">{a.name}</Badge>
                        ))}
                        {!user.is_admin && userApps.length === 0 && (
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No access</span>
                        )}
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => expandUser(user)}>
                        {isExpanded ? 'Cancel' : 'Manage'}
                      </Button>
                    </div>

                    {/* Expanded edit panel */}
                    {isExpanded && (
                      <div style={{ padding: '16px 20px 20px', background: 'var(--color-bg-page)', borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                            <input
                              type="checkbox"
                              checked={editState.__isAdmin ?? false}
                              onChange={e => setEditState(s => ({ ...s, __isAdmin: e.target.checked }))}
                            />
                            <span style={{ fontWeight: 600 }}>Admin</span>
                            <span style={{ color: 'var(--color-text-muted)' }}>— grants access to all apps automatically</span>
                          </label>
                        </div>
                        <div className="section-label" style={{ marginBottom: 10 }}>App Access</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                          {apps.map(app => (
                            <label key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                              <input
                                type="checkbox"
                                checked={editState[app.id] ?? false}
                                onChange={e => setEditState(s => ({ ...s, [app.id]: e.target.checked }))}
                              />
                              {app.name}
                            </label>
                          ))}
                        </div>
                        <Button variant="primary" size="sm" onClick={() => saveUserAccess(user)} disabled={saving}>
                          {saving ? 'Saving…' : 'Save'}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

          ) : (
            <div className="card">
              <div className="card-header"><h3>Apps</h3></div>
              {apps.map(app => {
                const appUserIds = access.filter(a => a.app_id === app.id).map(a => a.user_id)
                const appUsers   = users.filter(u => appUserIds.includes(u.id))
                const isExpanded = expandedId === app.id
                const initials   = app.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

                return (
                  <div key={app.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {/* App row */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12 }}>
                      {app.logo_url ? (
                        <img src={app.logo_url} alt={app.name} style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', objectFit: 'contain', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 34, height: 34, borderRadius: 'var(--radius-md)',
                          background: 'var(--color-primary-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0,
                        }}>
                          {initials}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>{app.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{app.description}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                        {appUsers.length === 0
                          ? <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No users assigned</span>
                          : appUsers.map(u => (
                              <Badge key={u.id} variant="neutral">{u.full_name || u.email}</Badge>
                            ))
                        }
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => expandApp(app)}>
                        {isExpanded ? 'Cancel' : 'Manage'}
                      </Button>
                    </div>

                    {/* Expanded edit panel */}
                    {isExpanded && (
                      <div style={{ padding: '16px 20px 20px', background: 'var(--color-bg-page)', borderTop: '1px solid var(--color-border)' }}>
                        <div className="section-label" style={{ marginBottom: 10 }}>User Access</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                          {users.map(user => (
                            <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                              <input
                                type="checkbox"
                                checked={editState[user.id] ?? false}
                                onChange={e => setEditState(s => ({ ...s, [user.id]: e.target.checked }))}
                              />
                              <span>{user.full_name || user.email}</span>
                              {user.full_name && <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{user.email}</span>}
                              {user.is_admin && <Badge variant="info">Admin</Badge>}
                            </label>
                          ))}
                        </div>
                        <Button variant="primary" size="sm" onClick={() => saveAppAccess(app)} disabled={saving}>
                          {saving ? 'Saving…' : 'Save'}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
