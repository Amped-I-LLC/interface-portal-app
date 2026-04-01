'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/* ============================================================
   NAV CONFIG
   To add a new page to the sidebar, add an entry here.
   'href' must match the route in app/(protected)/
   'section' groups items under a label (optional)
   ============================================================ */
const NAV_ITEMS = [
  { section: 'MAIN', items: [
    { label: 'Dashboard',   href: '/',          icon: '▦' },
  ]},
  { section: 'DATA', items: [
    { label: 'Records',     href: '/records',   icon: '☰' },
    { label: 'Reports',     href: '/reports',   icon: '↗' },
  ]},
  { section: 'SETTINGS', items: [
    { label: 'Settings',    href: '/settings',  icon: '⚙' },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()

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
        <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '-0.01em' }}>
          Amped I
        </div>
        {/* Replace with the current interface name when stamping a new project */}
        <div style={{ fontSize: 11, color: 'var(--color-sidebar-label)', marginTop: 2 }}>
          Interface Name v1.0
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV_ITEMS.map(({ section, items }) => (
          <div key={section}>
            <div className="section-label">{section}</div>
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
                    color: isActive
                      ? 'var(--color-sidebar-active-text)'
                      : 'var(--color-sidebar-text)',
                    background: isActive
                      ? 'var(--color-sidebar-active)'
                      : 'transparent',
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
        ))}
      </nav>

      {/* Bottom — version info */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--color-sidebar-border)',
        fontSize: 11,
        color: 'var(--color-sidebar-label)',
      }}>
        Amped I · Template v1.0
      </div>
    </aside>
  )
}
