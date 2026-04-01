'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePageTitle } from '@/lib/page-context'
import { useAdminGuard } from '@/lib/use-admin-guard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'

const STATUS_OPTIONS = ['live', 'new', 'maintenance', 'coming_soon']

const STATUS_BADGE = {
  live:        { variant: 'success', label: 'Live' },
  new:         { variant: 'info',    label: 'New' },
  maintenance: { variant: 'warning', label: 'Maintenance' },
  coming_soon: { variant: 'neutral', label: 'Coming Soon' },
}

const EMPTY_FORM = {
  name: '', description: '', url: '', logo_url: '', status: 'live',
  status_note: '', sort_order: 0,
}

export default function AdminAppsPage() {
  usePageTitle('Admin — Apps', 'Manage portal apps')
  const { loading: guardLoading } = useAdminGuard()

  const [apps,      setApps]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [uploadError,  setUploadError]  = useState(null)
  const [showPicker,   setShowPicker]   = useState(false)
  const [bucketFiles,  setBucketFiles]  = useState([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const supabase = createClient()

  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
  const MAX_MB = 2

  async function uploadLogo(file) {
    setUploadError(null)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only PNG, JPG, SVG, and WebP files are allowed.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`File must be under ${MAX_MB}MB.`)
      return
    }
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('app-logos').upload(path, file, { upsert: true })
    if (error) { setUploadError('Upload failed: ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('app-logos').getPublicUrl(path)
    setForm(f => ({ ...f, logo_url: data.publicUrl }))
    setUploading(false)
  }

  async function openPicker() {
    setShowPicker(true)
    setPickerLoading(true)
    const { data } = await supabase.storage.from('app-logos').list('', { sortBy: { column: 'created_at', order: 'desc' } })
    const files = (data ?? []).filter(f => f.name !== '.emptyFolderPlaceholder').map(f => ({
      name: f.name,
      url:  supabase.storage.from('app-logos').getPublicUrl(f.name).data.publicUrl,
    }))
    setBucketFiles(files)
    setPickerLoading(false)
  }

  function selectFromBucket(url) {
    setForm(f => ({ ...f, logo_url: url }))
    setShowPicker(false)
  }

  useEffect(() => {
    if (!guardLoading) fetchApps()
  }, [guardLoading])

  async function fetchApps() {
    const { data } = await supabase
      .from('portal_apps')
      .select('*')
      .order('sort_order')
    setApps(data ?? [])
    setLoading(false)
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(app) {
    setForm({
      name:        app.name,
      description: app.description ?? '',
      url:         app.url,
      logo_url:    app.logo_url    ?? '',
      status:      app.status,
      status_note: app.status_note ?? '',
      sort_order:  app.sort_order  ?? 0,
    })
    setEditingId(app.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setUploadError(null)
    setShowPicker(false)
  }

  async function saveApp() {
    if (!form.name.trim() || !form.url.trim()) return
    setSaving(true)

    const payload = {
      name:        form.name.trim(),
      description: form.description.trim() || null,
      url:         form.url.trim(),
      logo_url:    form.logo_url.trim()    || null,
      status:      form.status,
      status_note: form.status_note.trim() || null,
      sort_order:  Number(form.sort_order) || 0,
    }

    if (editingId) {
      await supabase.from('portal_apps').update(payload).eq('id', editingId)
    } else {
      await supabase.from('portal_apps').insert({ ...payload, is_active: true })
    }

    await fetchApps()
    cancelForm()
    setSaving(false)
  }

  async function toggleActive(app) {
    await supabase
      .from('portal_apps')
      .update({ is_active: !app.is_active })
      .eq('id', app.id)
    setApps(prev => prev.map(a => a.id === app.id ? { ...a, is_active: !a.is_active } : a))
  }

  if (guardLoading) return null

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Apps</h1>
          <p>Add, edit, or deactivate portal apps.</p>
        </div>
        {!showForm && (
          <Button variant="primary" onClick={openAdd}>+ Add App</Button>
        )}
      </div>

      <div className="page-content">

        {/* Add / Edit Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3>{editingId ? 'Edit App' : 'Add App'}</h3>
            </div>

            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="input-label">Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Sales Dashboard"
                />
              </div>
              <div className="form-group">
                <label className="input-label">URL *</label>
                <input
                  className="input"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://app.example.com"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Description</label>
              <input
                className="input"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description of what this app does"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="input-label">
                Logo <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional — PNG, JPG, SVG, or WebP · max 2MB)</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Preview */}
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="logo preview"
                    style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', objectFit: 'contain', border: '1px solid var(--color-border)', flexShrink: 0 }}
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: 'var(--color-text-muted)', flexShrink: 0,
                  }}>+</div>
                )}
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-card)',
                    fontSize: 13, color: 'var(--color-text-secondary)',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.6 : 1,
                  }}>
                    {uploading ? 'Uploading…' : 'Choose file'}
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,.webp"
                      style={{ display: 'none' }}
                      disabled={uploading}
                      onChange={e => { if (e.target.files?.[0]) uploadLogo(e.target.files[0]) }}
                    />
                  </label>
                  <button
                    onClick={openPicker}
                    disabled={uploading}
                    style={{
                      marginLeft: 8, padding: '7px 14px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)', background: 'var(--color-bg-card)',
                      fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer',
                    }}
                  >
                    Choose existing
                  </button>
                  {form.logo_url && !uploading && (
                    <button
                      onClick={() => setForm(f => ({ ...f, logo_url: '' }))}
                      style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                  {uploadError && (
                    <p style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4 }}>{uploadError}</p>
                  )}
                </div>
              </div>

              {/* Bucket picker */}
              {showPicker && (
                <div style={{
                  marginTop: 12, padding: 12,
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-page)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Existing logos
                    </span>
                    <button onClick={() => setShowPicker(false)} style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Close
                    </button>
                  </div>
                  {pickerLoading ? (
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Loading…</p>
                  ) : bucketFiles.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No logos uploaded yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {bucketFiles.map(f => (
                        <button
                          key={f.name}
                          onClick={() => selectFromBucket(f.url)}
                          title={f.name}
                          style={{
                            width: 56, height: 56, padding: 4,
                            border: form.logo_url === f.url ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-bg-card)',
                            cursor: 'pointer', overflow: 'hidden',
                          }}
                        >
                          <img src={f.url} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="input-label">Status</label>
                <select
                  className="select"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Sort Order</label>
                <input
                  className="input"
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                />
              </div>
            </div>

            {form.status === 'maintenance' && (
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="input-label">Maintenance Note</label>
                <input
                  className="input"
                  value={form.status_note}
                  onChange={e => setForm(f => ({ ...f, status_note: e.target.value }))}
                  placeholder="e.g. Back online Friday"
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" onClick={saveApp} disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add App'}
              </Button>
              <Button variant="secondary" onClick={cancelForm} disabled={saving}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Apps Table */}
        {loading ? (
          <LoadingSkeleton lines={4} card />
        ) : apps.length === 0 ? (
          <EmptyState icon="⊞" title="No apps yet" message="Add your first app above." />
        ) : (
          <div className="card">
            <div className="card-header"><h3>All Apps</h3></div>
            <div className="table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Name', 'Description', 'Status', 'Active', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apps.map(app => {
                    const badge = STATUS_BADGE[app.status] ?? STATUS_BADGE.live
                    return (
                      <tr key={app.id} style={{ borderBottom: '1px solid var(--color-border)', opacity: app.is_active ? 1 : 0.5 }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{app.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{app.url}</div>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--color-text-secondary)', maxWidth: 200 }}>
                          {app.description || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          {app.status_note && (
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{app.status_note}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Badge variant={app.is_active ? 'success' : 'neutral'}>
                            {app.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Button size="sm" variant="secondary" onClick={() => openEdit(app)}>Edit</Button>
                            <Button size="sm" variant={app.is_active ? 'danger' : 'secondary'} onClick={() => toggleActive(app)}>
                              {app.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
