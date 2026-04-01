'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePageTitle } from '@/lib/page-context'
import { useAdminGuard } from '@/lib/use-admin-guard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'

export default function AdminAnnouncementsPage() {
  usePageTitle('Admin — Announcements', 'Manage announcements')
  const { loading: guardLoading } = useAdminGuard()

  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [message,   setMessage]   = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [saving,    setSaving]    = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!guardLoading) fetchItems()
  }, [guardLoading])

  async function fetchItems() {
    const { data } = await supabase
      .from('portal_announcements')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }

  async function addAnnouncement() {
    if (!message.trim()) return
    setSaving(true)
    await supabase.from('portal_announcements').insert({
      message:    message.trim(),
      is_active:  true,
      expires_at: expiresAt || null,
    })
    setMessage('')
    setExpiresAt('')
    setShowForm(false)
    await fetchItems()
    setSaving(false)
  }

  async function toggleActive(item) {
    await supabase
      .from('portal_announcements')
      .update({ is_active: !item.is_active })
      .eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i))
  }

  async function deleteItem(id) {
    await supabase.from('portal_announcements').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  if (guardLoading) return null

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Announcements</h1>
          <p>Create and manage company-wide announcements.</p>
        </div>
        {!showForm && (
          <Button variant="primary" onClick={() => setShowForm(true)}>+ New Announcement</Button>
        )}
      </div>

      <div className="page-content">

        {/* New Announcement Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header"><h3>New Announcement</h3></div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Message *</label>
              <textarea
                className="textarea"
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="e.g. Finance Tracker v2 is now live. Previous bookmarks still work."
              />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Expires On <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional — leave blank to show indefinitely)</span></label>
              <input
                className="input"
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                style={{ maxWidth: 200 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" onClick={addAnnouncement} disabled={saving || !message.trim()}>
                {saving ? 'Saving…' : 'Post Announcement'}
              </Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setMessage(''); setExpiresAt('') }} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <LoadingSkeleton lines={4} card />
        ) : items.length === 0 ? (
          <EmptyState icon="⊕" title="No announcements" message="Post your first announcement above." />
        ) : (
          <div className="card">
            <div className="card-header"><h3>All Announcements</h3></div>
            {items.map(item => {
              const isExpired = item.expires_at && new Date(item.expires_at) < new Date()
              return (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--color-border)',
                  opacity: (!item.is_active || isExpired) ? 0.55 : 1,
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'var(--color-text-primary)', margin: '0 0 6px', lineHeight: 1.6 }}>
                      {item.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        Posted {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {item.expires_at && (
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          · Expires {new Date(item.expires_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      <Badge variant={item.is_active && !isExpired ? 'success' : 'neutral'}>
                        {isExpired ? 'Expired' : item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <Button size="sm" variant="secondary" onClick={() => toggleActive(item)}>
                      {item.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => deleteItem(item.id)}>Delete</Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
