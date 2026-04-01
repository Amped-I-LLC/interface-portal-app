'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Topbar({ title = '', subtitle = '' }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: '#fff',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>

      {/* Page title + subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {title && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
              {title}
            </h2>
            {subtitle && (
              <span style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                paddingLeft: 10,
                borderLeft: '1px solid var(--color-border)',
              }}>
                {subtitle}
              </span>
            )}
          </>
        )}
      </div>

      {/* Right side — user info + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <UserInfo />
        <button
          onClick={handleLogout}
          style={{
            fontSize: 12,
            color: 'var(--color-text-muted)',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '5px 10px',
            cursor: 'pointer',
          }}
        >
          Log out
        </button>
      </div>
    </header>
  )
}

/* ---- User Info (reads live from Supabase session) ---- */
function UserInfo() {
  const [display, setDisplay] = useState({ initials: '…', name: '' })
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const full = user.user_metadata?.full_name || ''
      const email = user.email || ''
      const initials = full
        ? full.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : email.slice(0, 2).toUpperCase()
      setDisplay({ initials, name: full || email })
    })
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: 'var(--color-primary-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--color-primary)',
        flexShrink: 0,
      }}>
        {display.initials}
      </div>
      {display.name && (
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {display.name}
        </span>
      )}
    </div>
  )
}
