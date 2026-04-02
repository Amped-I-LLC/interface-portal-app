'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MAIN_NAV = [
  { label: 'Employee Hub',  href: '/',              icon: '▦' },
  { label: 'Announcements', href: '/announcements', icon: '◈' },
]

const ADMIN_NAV = [
  { label: 'Users',         href: '/admin/users',         icon: '⊙' },
  { label: 'Apps',          href: '/admin/apps',          icon: '⊞' },
  { label: 'Access',        href: '/admin/access',        icon: '⊡' },
  { label: 'Announcements', href: '/admin/announcements', icon: '⊕' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isAdmin,  setIsAdmin]  = useState(false)
  const [logoUrl,  setLogoUrl]  = useState(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('portal_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setIsAdmin(data?.is_admin ?? false))
    })

    fetch('/api/logo-url')
      .then(r => r.json())
      .then(({ url }) => { if (url) setLogoUrl(url) })
  }, [])

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'var(--color-sidebar-bg)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 40,
    }}>

      {/* Logo / App Name */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--color-sidebar-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Company logo"
              style={{ height: 32, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
            />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '-0.01em' }}>
              Amped I
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-sidebar-label)', marginTop: 1 }}>
              Company Portal v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <NavSection label="MAIN" items={MAIN_NAV} pathname={pathname} />
        {isAdmin && <NavSection label="ADMIN" items={ADMIN_NAV} pathname={pathname} />}
      </nav>

      {/* Bottom */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--color-sidebar-border)',
        fontSize: 11,
        color: 'var(--color-sidebar-label)',
      }}>
        Amped I · Portal v1.0
      </div>
    </aside>
  )
}

function NavSection({ label, items, pathname }) {
  return (
    <div>
      <div className="section-label">{label}</div>
      {items.map(({ label, href, icon }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              margin: '1px 8px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-sidebar-active-text)' : 'var(--color-sidebar-text)',
              background: isActive ? 'var(--color-sidebar-active)' : 'transparent',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.background = 'var(--color-sidebar-hover)'
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.background = 'transparent'
            }}
          >
            <span style={{ fontSize: 15, opacity: isActive ? 1 : 0.7 }}>{icon}</span>
            {label}
          </Link>
        )
      })}
    </div>
  )
}
