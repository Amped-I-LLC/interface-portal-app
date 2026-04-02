'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePageTitle } from '@/lib/page-context'
import Badge from '@/components/ui/Badge'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatLastLogin(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const now = new Date()
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (date.toDateString() === now.toDateString()) return `today at ${time}`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${time}`
}

function getHostname(url) {
  try { return new URL(url).hostname } catch { return url }
}

const STATUS_BADGE = {
  live:        { variant: 'success', label: 'Live' },
  new:         { variant: 'info',    label: 'New' },
  maintenance: { variant: 'warning', label: 'Maintenance' },
  coming_soon: { variant: 'neutral', label: 'Coming Soon' },
}

export default function EmployeeHubPage() {
  usePageTitle('Employee Hub')

  const [user,          setUser]          = useState(null)
  const [profile,       setProfile]       = useState(null)
  const [apps,          setApps]          = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [sopApp,        setSopApp]        = useState(null)  // app whose SOP is open
  const [sopContent,    setSopContent]    = useState('')
  const [sopLoading,    setSopLoading]    = useState(false)
  const [sopError,      setSopError]      = useState(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const [profileRes, annRes] = await Promise.all([
        supabase.from('portal_profiles').select('*').eq('id', user.id).single(),
        supabase.from('portal_announcements').select('*').order('created_at', { ascending: false }),
      ])

      const profile = profileRes.data
      setProfile(profile)
      setAnnouncements(annRes.data ?? [])

      let appsData = []
      if (profile?.is_admin) {
        const { data } = await supabase
          .from('portal_apps')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')
        appsData = data ?? []
      } else {
        const { data } = await supabase
          .from('portal_user_app_access')
          .select('portal_apps(*)')
          .eq('user_id', user.id)
        appsData = (data ?? []).map(r => r.portal_apps).filter(Boolean)
        appsData.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      }

      setApps(appsData)
      setLoading(false)
    }
    load()
  }, [])

  async function openSop(app) {
    setSopApp(app)
    setSopContent('')
    setSopError(null)
    setSopLoading(true)

    const res = await fetch(`/api/sop?app_id=${app.id}`)
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Failed to load SOP.' }))
      setSopError(error || 'Failed to load SOP.')
    } else {
      setSopContent(await res.text())
    }
    setSopLoading(false)
  }

  function closeSop() {
    setSopApp(null)
    setSopContent('')
    setSopError(null)
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || ''
  const lastLogin = formatLastLogin(user?.last_sign_in_at)

  return (
    <div>
      <div className="page-header">
        <h1>{getGreeting()}{firstName ? `, ${firstName}` : ''}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 4 }}>
          {loading
            ? 'Loading your apps...'
            : `You have access to ${apps.length} app${apps.length !== 1 ? 's' : ''}`}
          {lastLogin && ` · Last login: ${lastLogin}`}
        </p>
      </div>

      <div className="page-content">

        {/* Announcements */}
        {announcements.map(a => (
          <div key={a.id} style={{
            background: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            fontSize: 13,
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 900, fontSize: 8 }}>●</span>
            {a.message}
          </div>
        ))}

        {/* App grid */}
        {loading ? (
          <LoadingSkeleton card lines={3} />
        ) : apps.length === 0 ? (
          <EmptyState
            icon="▦"
            title="No apps assigned"
            message="You don't have access to any apps yet. Contact your administrator."
          />
        ) : (
          <>
            <div className="section-label" style={{ marginBottom: 12 }}>YOUR APPS</div>
            <div className="grid-4">
              {apps.map(app => (
                <AppCard key={app.id} app={app} onSop={() => openSop(app)} />
              ))}
            </div>
          </>
        )}

      </div>

      {/* SOP Modal */}
      {sopApp && (
        <div
          onClick={closeSop}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '40px 20px',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: 760,
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>
                  {sopApp.name} — User Guide
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {sopApp.github_repo}
                </div>
              </div>
              <button
                onClick={closeSop}
                style={{
                  fontSize: 20, lineHeight: 1, color: 'var(--color-text-muted)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {sopLoading ? (
                <LoadingSkeleton lines={6} />
              ) : sopError ? (
                <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>{sopError}</p>
              ) : (
                <div style={{
                  fontSize: 13,
                  lineHeight: 1.8,
                  color: 'var(--color-text-secondary)',
                }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...p}) => <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12, marginTop: 24 }} {...p} />,
                      h2: ({node, ...p}) => <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10, marginTop: 20 }} {...p} />,
                      h3: ({node, ...p}) => <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8, marginTop: 16 }} {...p} />,
                      p:  ({node, ...p}) => <p  style={{ marginBottom: 12 }} {...p} />,
                      ul: ({node, ...p}) => <ul style={{ paddingLeft: 20, marginBottom: 12 }} {...p} />,
                      ol: ({node, ...p}) => <ol style={{ paddingLeft: 20, marginBottom: 12 }} {...p} />,
                      li: ({node, ...p}) => <li style={{ marginBottom: 4 }} {...p} />,
                      code: ({node, inline, ...p}) => inline
                        ? <code style={{ background: 'var(--color-bg-page)', padding: '1px 5px', borderRadius: 3, fontSize: 12, fontFamily: 'monospace' }} {...p} />
                        : <pre style={{ background: 'var(--color-bg-page)', padding: 12, borderRadius: 'var(--radius-md)', overflowX: 'auto', fontSize: 12, fontFamily: 'monospace' }}><code {...p} /></pre>,
                      a: ({node, ...p}) => <a style={{ color: 'var(--color-primary)' }} target="_blank" rel="noopener noreferrer" {...p} />,
                      hr: ({node, ...p}) => <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '20px 0' }} {...p} />,
                      table: ({node, ...p}) => <div className="table-wrapper"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }} {...p} /></div>,
                      th: ({node, ...p}) => <th style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid var(--color-border)', fontWeight: 600, color: 'var(--color-text-primary)' }} {...p} />,
                      td: ({node, ...p}) => <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-border)' }} {...p} />,
                    }}
                  >
                    {sopContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AppCard({ app, onSop }) {
  const badge    = STATUS_BADGE[app.status] ?? STATUS_BADGE.live
  const initials = app.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const hasSop   = !!(app.github_repo && app.sop_path)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      position: 'relative',
      transition: 'box-shadow 0.15s, border-color 0.15s',
    }}>
      {/* Status badge */}
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      {/* Logo */}
      <div style={{ marginBottom: 12 }}>
        {app.logo_url ? (
          <img
            src={app.logo_url}
            alt={app.name}
            style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', objectFit: 'contain' }}
          />
        ) : (
          <div style={{
            width: 40, height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--color-primary)',
          }}>
            {initials}
          </div>
        )}
      </div>

      {/* Name */}
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 6, paddingRight: 48 }}>
        {app.name}
      </div>

      {/* Description */}
      {app.description && (
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6, flex: 1, marginBottom: 12 }}>
          {app.description}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        paddingTop: 10,
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {app.status === 'maintenance' && app.status_note
            ? app.status_note
            : getHostname(app.url)}
        </span>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {hasSop && (
            <button
              onClick={onSop}
              style={{
                fontSize: 11, padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
              }}
            >
              User Guide
            </button>
          )}
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11, padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-primary)',
              background: 'var(--color-primary)',
              color: '#fff',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Open
          </a>
        </div>
      </div>
    </div>
  )
}
