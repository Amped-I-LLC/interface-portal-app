'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePageTitle } from '@/lib/page-context'
import Badge from '@/components/ui/Badge'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'

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

  const firstName  = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || ''
  const lastLogin  = formatLastLogin(user?.last_sign_in_at)

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
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

function AppCard({ app }) {
  const badge    = STATUS_BADGE[app.status] ?? STATUS_BADGE.live
  const initials = app.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <a
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        textDecoration: 'none',
        position: 'relative',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow   = 'var(--shadow-md)'
        e.currentTarget.style.borderColor = 'var(--color-primary)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow   = 'none'
        e.currentTarget.style.borderColor = 'var(--color-border)'
      }}
    >
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
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-primary)',
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

      {/* Footer: URL or maintenance note */}
      <div style={{
        fontSize: 11,
        color: 'var(--color-text-muted)',
        marginTop: 'auto',
        paddingTop: 10,
        borderTop: '1px solid var(--color-border)',
      }}>
        {app.status === 'maintenance' && app.status_note
          ? app.status_note
          : getHostname(app.url)}
      </div>
    </a>
  )
}
