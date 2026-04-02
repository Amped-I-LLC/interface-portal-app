'use client'

import { useEffect, useState } from 'react'
import { usePageTitle } from '@/lib/page-context'
import { useDevGuard } from '@/lib/use-dev-guard'
import Button from '@/components/ui/Button'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'

const TABS = ['Airtable Connections', 'GitHub Connections', 'Portal Profiles']

const EMPTY_AT = { app: '', name: '', token: '', base_id: '', notes: '' }
const EMPTY_GH = { label: '', token: '', notes: '' }

export default function DevToolsPage() {
  usePageTitle('Dev Tools', 'Manage global service connections')
  const { loading: guardLoading } = useDevGuard()

  const [tab,         setTab]         = useState(0)

  // Portal Profiles state
  const [profiles,    setProfiles]    = useState([])
  const [ppLoading,   setPpLoading]   = useState(true)
  const [ppSaving,    setPpSaving]    = useState(null)  // id of row being saved
  const [ppError,     setPpError]     = useState(null)

  // Airtable state
  const [atConns,     setAtConns]     = useState([])
  const [atLoading,   setAtLoading]   = useState(true)
  const [atForm,      setAtForm]      = useState(EMPTY_AT)
  const [atAdding,    setAtAdding]    = useState(false)
  const [atSaving,    setAtSaving]    = useState(false)
  const [atEditId,    setAtEditId]    = useState(null)
  const [atEditForm,  setAtEditForm]  = useState({})
  const [atConfirmId, setAtConfirmId] = useState(null)
  const [atError,     setAtError]     = useState(null)

  // GitHub state
  const [ghConns,     setGhConns]     = useState([])
  const [ghLoading,   setGhLoading]   = useState(true)
  const [ghForm,      setGhForm]      = useState(EMPTY_GH)
  const [ghAdding,    setGhAdding]    = useState(false)
  const [ghSaving,    setGhSaving]    = useState(false)
  const [ghEditId,    setGhEditId]    = useState(null)
  const [ghEditForm,  setGhEditForm]  = useState({})
  const [ghConfirmId, setGhConfirmId] = useState(null)
  const [ghError,     setGhError]     = useState(null)

  useEffect(() => {
    if (guardLoading) return
    fetchAirtable()
    fetchGithub()
    fetchProfiles()
  }, [guardLoading])

  // ── Airtable helpers ──────────────────────────────────────
  async function fetchAirtable() {
    setAtLoading(true)
    const res = await fetch('/api/dev/airtable-connections')
    const json = await res.json()
    setAtConns(json.connections ?? [])
    setAtLoading(false)
  }

  async function addAirtable(e) {
    e.preventDefault()
    setAtError(null)
    setAtSaving(true)
    const res = await fetch('/api/dev/airtable-connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(atForm),
    })
    const json = await res.json()
    if (!res.ok) { setAtError(json.error); setAtSaving(false); return }
    setAtConns(prev => [...prev, json.connection])
    setAtForm(EMPTY_AT)
    setAtAdding(false)
    setAtSaving(false)
  }

  async function saveAtEdit(id) {
    setAtError(null)
    const res = await fetch('/api/dev/airtable-connections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...atEditForm }),
    })
    const json = await res.json()
    if (!res.ok) { setAtError(json.error); return }
    setAtConns(prev => prev.map(c => c.id === id ? { ...c, ...atEditForm, token: atEditForm.token?.startsWith('••') ? c.token : `••••••••${atEditForm.token?.slice(-4)}` } : c))
    setAtEditId(null)
  }

  async function deleteAirtable(id) {
    setAtError(null)
    const res = await fetch('/api/dev/airtable-connections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const json = await res.json()
    if (!res.ok) { setAtError(json.error); return }
    setAtConns(prev => prev.filter(c => c.id !== id))
    setAtConfirmId(null)
  }

  // ── GitHub helpers ────────────────────────────────────────
  async function fetchGithub() {
    setGhLoading(true)
    const res = await fetch('/api/dev/github-connections')
    const json = await res.json()
    setGhConns(json.connections ?? [])
    setGhLoading(false)
  }

  async function addGithub(e) {
    e.preventDefault()
    setGhError(null)
    setGhSaving(true)
    const res = await fetch('/api/dev/github-connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ghForm),
    })
    const json = await res.json()
    if (!res.ok) { setGhError(json.error); setGhSaving(false); return }
    setGhConns(prev => [...prev, json.connection])
    setGhForm(EMPTY_GH)
    setGhAdding(false)
    setGhSaving(false)
  }

  async function saveGhEdit(id) {
    setGhError(null)
    const res = await fetch('/api/dev/github-connections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...ghEditForm }),
    })
    const json = await res.json()
    if (!res.ok) { setGhError(json.error); return }
    setGhConns(prev => prev.map(c => c.id === id ? { ...c, ...ghEditForm, token: ghEditForm.token?.startsWith('••') ? c.token : `••••••••${ghEditForm.token?.slice(-4)}` } : c))
    setGhEditId(null)
  }

  async function deleteGithub(id) {
    setGhError(null)
    const res = await fetch('/api/dev/github-connections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const json = await res.json()
    if (!res.ok) { setGhError(json.error); return }
    setGhConns(prev => prev.filter(c => c.id !== id))
    setGhConfirmId(null)
  }

  // ── Portal Profiles helpers ───────────────────────────────
  async function fetchProfiles() {
    setPpLoading(true)
    const res = await fetch('/api/dev/portal-profiles')
    const json = await res.json()
    setProfiles(json.profiles ?? [])
    setPpLoading(false)
  }

  async function toggleFlag(id, field, currentValue) {
    setPpError(null)
    setPpSaving(id)
    const res = await fetch('/api/dev/portal-profiles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: !currentValue }),
    })
    const json = await res.json()
    if (!res.ok) {
      setPpError(json.error)
    } else {
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, [field]: !currentValue } : p))
    }
    setPpSaving(null)
  }

  if (guardLoading) return null

  return (
    <div>
      <div className="page-header">
        <h1>Dev Tools</h1>
        <p>Manage global service connections. These credentials are server-side only and never exposed to the browser.</p>
      </div>

      <div className="page-content">

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
          {TABS.map((label, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: tab === i ? 600 : 400,
                color: tab === i ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderBottom: tab === i ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Airtable Connections tab ── */}
        {tab === 0 && (
          <div>
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Airtable Connections</h3>
                {!atAdding && (
                  <Button size="sm" variant="primary" onClick={() => { setAtAdding(true); setAtError(null) }}>
                    + Add Connection
                  </Button>
                )}
              </div>

              {atError && (
                <div style={{ padding: '10px 16px', background: 'var(--color-danger-light)', borderBottom: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: 12, color: 'var(--color-danger)', margin: 0 }}>{atError}</p>
                </div>
              )}

              {/* Add form */}
              {atAdding && (
                <form onSubmit={addAirtable} style={{ padding: 16, borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-page)' }}>
                  <div className="grid-2" style={{ marginBottom: 12 }}>
                    <div className="form-group">
                      <label className="input-label">App <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <input className="input" placeholder="interface-proposal-estimator" value={atForm.app} onChange={e => setAtForm(f => ({ ...f, app: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="input-label">Name</label>
                      <input className="input" placeholder="Proposal Estimator" value={atForm.name} onChange={e => setAtForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid-2" style={{ marginBottom: 12 }}>
                    <div className="form-group">
                      <label className="input-label">Token (PAT) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <input className="input" placeholder="patXXXXXXXXXXXXXX.XXXX" value={atForm.token} onChange={e => setAtForm(f => ({ ...f, token: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="input-label">Base ID <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <input className="input" placeholder="appXXXXXXXXXXXXXX" value={atForm.base_id} onChange={e => setAtForm(f => ({ ...f, base_id: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="input-label">Notes</label>
                    <input className="input" placeholder="Optional — e.g. read-only scope, expires 2027" value={atForm.notes} onChange={e => setAtForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="submit" size="sm" variant="primary" disabled={atSaving}>{atSaving ? 'Saving…' : 'Save'}</Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => { setAtAdding(false); setAtForm(EMPTY_AT); setAtError(null) }}>Cancel</Button>
                  </div>
                </form>
              )}

              {/* List */}
              {atLoading ? (
                <div style={{ padding: 16 }}><LoadingSkeleton lines={3} /></div>
              ) : atConns.length === 0 && !atAdding ? (
                <EmptyState icon="⊡" title="No Airtable connections" message="Add a connection to enable Airtable integration for an interface." />
              ) : (
                atConns.map(conn => (
                  <div key={conn.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {atEditId === conn.id ? (
                      <div style={{ padding: 16, background: 'var(--color-bg-page)' }}>
                        <div className="grid-2" style={{ marginBottom: 12 }}>
                          <div className="form-group">
                            <label className="input-label">App</label>
                            <input className="input" value={atEditForm.app ?? conn.app} onChange={e => setAtEditForm(f => ({ ...f, app: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label className="input-label">Name</label>
                            <input className="input" value={atEditForm.name ?? conn.name ?? ''} onChange={e => setAtEditForm(f => ({ ...f, name: e.target.value }))} />
                          </div>
                        </div>
                        <div className="grid-2" style={{ marginBottom: 12 }}>
                          <div className="form-group">
                            <label className="input-label">Token (PAT) <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(leave masked to keep existing)</span></label>
                            <input className="input" value={atEditForm.token ?? conn.token} onChange={e => setAtEditForm(f => ({ ...f, token: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label className="input-label">Base ID</label>
                            <input className="input" value={atEditForm.base_id ?? conn.base_id} onChange={e => setAtEditForm(f => ({ ...f, base_id: e.target.value }))} />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                          <label className="input-label">Notes</label>
                          <input className="input" value={atEditForm.notes ?? conn.notes ?? ''} onChange={e => setAtEditForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button size="sm" variant="primary" onClick={() => saveAtEdit(conn.id)}>Save</Button>
                          <Button size="sm" variant="secondary" onClick={() => { setAtEditId(null); setAtEditForm({}) }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>
                            {conn.name || conn.app}
                            {conn.name && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 6 }}>({conn.app})</span>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                            Base: {conn.base_id} &nbsp;·&nbsp; Token: {conn.token}
                          </div>
                          {conn.notes && (
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{conn.notes}</div>
                          )}
                        </div>
                        {atConfirmId === conn.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Delete?</span>
                            <Button size="sm" variant="danger" onClick={() => deleteAirtable(conn.id)}>Yes</Button>
                            <Button size="sm" variant="secondary" onClick={() => setAtConfirmId(null)}>No</Button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Button size="sm" variant="secondary" onClick={() => { setAtEditId(conn.id); setAtEditForm({ app: conn.app, name: conn.name ?? '', token: conn.token, base_id: conn.base_id, notes: conn.notes ?? '' }); setAtError(null) }}>Edit</Button>
                            <Button size="sm" variant="danger" onClick={() => setAtConfirmId(conn.id)}>Delete</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── GitHub Connections tab ── */}
        {tab === 1 && (
          <div>
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>GitHub Connections</h3>
                {!ghAdding && (
                  <Button size="sm" variant="primary" onClick={() => { setGhAdding(true); setGhError(null) }}>
                    + Add Connection
                  </Button>
                )}
              </div>

              {ghError && (
                <div style={{ padding: '10px 16px', background: 'var(--color-danger-light)', borderBottom: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: 12, color: 'var(--color-danger)', margin: 0 }}>{ghError}</p>
                </div>
              )}

              {/* Add form */}
              {ghAdding && (
                <form onSubmit={addGithub} style={{ padding: 16, borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-page)' }}>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="input-label">Label</label>
                    <input className="input" placeholder="e.g. Org PAT (read-only)" value={ghForm.label} onChange={e => setGhForm(f => ({ ...f, label: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="input-label">Token (PAT) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input className="input" placeholder="github_pat_XXXX…" value={ghForm.token} onChange={e => setGhForm(f => ({ ...f, token: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="input-label">Notes</label>
                    <input className="input" placeholder="Optional — e.g. expires 2027-01, repo:read scope" value={ghForm.notes} onChange={e => setGhForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="submit" size="sm" variant="primary" disabled={ghSaving}>{ghSaving ? 'Saving…' : 'Save'}</Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => { setGhAdding(false); setGhForm(EMPTY_GH); setGhError(null) }}>Cancel</Button>
                  </div>
                </form>
              )}

              {/* List */}
              {ghLoading ? (
                <div style={{ padding: 16 }}><LoadingSkeleton lines={3} /></div>
              ) : ghConns.length === 0 && !ghAdding ? (
                <EmptyState icon="⊡" title="No GitHub connections" message="Add a Personal Access Token to enable GitHub integration (e.g. SOP viewer)." />
              ) : (
                ghConns.map(conn => (
                  <div key={conn.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {ghEditId === conn.id ? (
                      <div style={{ padding: 16, background: 'var(--color-bg-page)' }}>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                          <label className="input-label">Label</label>
                          <input className="input" value={ghEditForm.label ?? conn.label ?? ''} onChange={e => setGhEditForm(f => ({ ...f, label: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                          <label className="input-label">Token <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(leave masked to keep existing)</span></label>
                          <input className="input" value={ghEditForm.token ?? conn.token} onChange={e => setGhEditForm(f => ({ ...f, token: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                          <label className="input-label">Notes</label>
                          <input className="input" value={ghEditForm.notes ?? conn.notes ?? ''} onChange={e => setGhEditForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button size="sm" variant="primary" onClick={() => saveGhEdit(conn.id)}>Save</Button>
                          <Button size="sm" variant="secondary" onClick={() => { setGhEditId(null); setGhEditForm({}) }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>
                            {conn.label || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Unlabelled</span>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                            Token: {conn.token}
                          </div>
                          {conn.notes && (
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{conn.notes}</div>
                          )}
                        </div>
                        {ghConfirmId === conn.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Delete?</span>
                            <Button size="sm" variant="danger" onClick={() => deleteGithub(conn.id)}>Yes</Button>
                            <Button size="sm" variant="secondary" onClick={() => setGhConfirmId(null)}>No</Button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Button size="sm" variant="secondary" onClick={() => { setGhEditId(conn.id); setGhEditForm({ label: conn.label ?? '', token: conn.token, notes: conn.notes ?? '' }); setGhError(null) }}>Edit</Button>
                            <Button size="sm" variant="danger" onClick={() => setGhConfirmId(conn.id)}>Delete</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Portal Profiles tab ── */}
        {tab === 2 && (
          <div>
            <div className="card">
              <div className="card-header">
                <h3>Portal Profiles</h3>
              </div>

              {ppError && (
                <div style={{ padding: '10px 16px', background: 'var(--color-danger-light)', borderBottom: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: 12, color: 'var(--color-danger)', margin: 0 }}>{ppError}</p>
                </div>
              )}

              {ppLoading ? (
                <div style={{ padding: 16 }}><LoadingSkeleton lines={4} /></div>
              ) : profiles.length === 0 ? (
                <EmptyState icon="⊙" title="No profiles found" message="Profiles are created automatically when users are invited." />
              ) : (
                <>
                  {/* Header row */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 80px',
                    padding: '8px 16px',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    <div>User</div>
                    <div style={{ textAlign: 'center' }}>Admin</div>
                    <div style={{ textAlign: 'center' }}>Dev</div>
                  </div>

                  {profiles.map(profile => {
                    const isSaving = ppSaving === profile.id
                    const displayName = profile.full_name || profile.email || profile.id.slice(0, 8)
                    return (
                      <div key={profile.id} style={{
                        display: 'grid', gridTemplateColumns: '1fr 80px 80px',
                        alignItems: 'center',
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--color-border)',
                        opacity: isSaving ? 0.5 : 1,
                        transition: 'opacity 0.15s',
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>{displayName}</div>
                          {profile.full_name && (
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{profile.email}</div>
                          )}
                        </div>

                        {/* Admin toggle */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button
                            onClick={() => !isSaving && toggleFlag(profile.id, 'is_admin', profile.is_admin)}
                            disabled={isSaving}
                            title={profile.is_admin ? 'Remove admin' : 'Make admin'}
                            style={{
                              width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                              background: profile.is_admin ? 'var(--color-primary)' : 'var(--color-border)',
                              position: 'relative', transition: 'background 0.2s',
                            }}
                          >
                            <span style={{
                              position: 'absolute', top: 2,
                              left: profile.is_admin ? 18 : 2,
                              width: 16, height: 16, borderRadius: '50%', background: '#fff',
                              transition: 'left 0.2s',
                            }} />
                          </button>
                        </div>

                        {/* Dev toggle */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button
                            onClick={() => !isSaving && toggleFlag(profile.id, 'is_dev', profile.is_dev)}
                            disabled={isSaving}
                            title={profile.is_dev ? 'Remove dev role' : 'Make dev'}
                            style={{
                              width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                              background: profile.is_dev ? 'var(--color-success)' : 'var(--color-border)',
                              position: 'relative', transition: 'background 0.2s',
                            }}
                          >
                            <span style={{
                              position: 'absolute', top: 2,
                              left: profile.is_dev ? 18 : 2,
                              width: 16, height: 16, borderRadius: '50%', background: '#fff',
                              transition: 'left 0.2s',
                            }} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
              Admin — can access all admin pages (Users, Apps, Access, Announcements). &nbsp;
              Dev — same as Admin, plus Dev Tools. Devs cannot remove their own dev role.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
