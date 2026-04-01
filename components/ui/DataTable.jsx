'use client'

import { useState, useMemo } from 'react'
import EmptyState from './EmptyState'

/* ============================================================
   DataTable
   Usage:
     const columns = [
       { key: 'name',   label: 'Name',   sortable: true },
       { key: 'status', label: 'Status', render: (val) => <Badge variant="success">{val}</Badge> },
       { key: 'date',   label: 'Date',   sortable: true },
     ]
     <DataTable columns={columns} data={records} />
     <DataTable columns={columns} data={records} pageSize={20} />

   Props:
     columns  — array of { key, label, sortable?, render? }
                  key      — matches a key in each data row object
                  label    — column header text
                  sortable — enables click-to-sort on this column
                  render   — optional fn(value, row) => ReactNode for custom cell rendering
     data     — array of objects
     pageSize — rows per page (default: 10)
   ============================================================ */
export default function DataTable({ columns = [], data = [], pageSize = 10 }) {
  const [filter,    setFilter]    = useState('')
  const [sortKey,   setSortKey]   = useState(null)
  const [sortDir,   setSortDir]   = useState('asc')
  const [page,      setPage]      = useState(1)

  /* --- Filter --- */
  const filtered = useMemo(() => {
    if (!filter.trim()) return data
    const q = filter.toLowerCase()
    return data.filter(row =>
      columns.some(col => String(row[col.key] ?? '').toLowerCase().includes(q))
    )
  }, [data, filter, columns])

  /* --- Sort --- */
  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  /* --- Pagination --- */
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  function handleFilter(e) {
    setFilter(e.target.value)
    setPage(1)
  }

  return (
    <div>
      {/* Filter input */}
      <div style={{ marginBottom: 12 }}>
        <input
          className="input"
          style={{ maxWidth: 280 }}
          type="text"
          placeholder="Search..."
          value={filter}
          onChange={handleFilter}
        />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 0, border: 'none' }}>
                  <EmptyState
                    icon="🔍"
                    title="No results"
                    message={filter ? 'No records matched your search.' : 'No records to display.'}
                  />
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
          fontSize: 12,
          color: 'var(--color-text-muted)',
        }}>
          <span>
            Showing {Math.min((currentPage - 1) * pageSize + 1, sorted.length)}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
