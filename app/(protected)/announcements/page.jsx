'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePageTitle } from '@/lib/page-context'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'

export default function AnnouncementsPage() {
  usePageTitle('Announcements')

  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('portal_announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <div className="page-header">
        <h1>Announcements</h1>
        <p>Company-wide updates and notices.</p>
      </div>

      <div className="page-content">
        {loading ? (
          <LoadingSkeleton lines={4} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="◈"
            title="No announcements"
            message="Nothing to show right now. Check back later."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => (
              <div key={item.id} className="card">
                <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.7, margin: 0 }}>
                  {item.message}
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8, marginBottom: 0 }}>
                  {new Date(item.created_at).toLocaleDateString([], {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
