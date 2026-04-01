'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchAirtable } from '@/lib/airtable'
import { usePageTitle } from '@/lib/page-context'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'

/* ============================================================
   Sample Data Page
   Demonstrates Supabase + Airtable data fetching patterns.
   Delete this page when building your real interface.

   To adapt:
   - Replace 'your-table' with your actual Supabase table name
   - Replace the fetchAirtable() params with your app/table names
   - Update columns to match your data structure
   ============================================================ */

const SUPABASE_TABLE = 'your-table'       // replace with real table
const AIRTABLE_APP   = 'your-app-name'    // matches airtable_keys.app_name
const AIRTABLE_TABLE = 'YourAirtableTable' // replace with real table name

const columns = [
  { key: 'id',     label: 'ID',     sortable: true },
  { key: 'name',   label: 'Name',   sortable: true },
  { key: 'status', label: 'Status', render: (val) => {
    const map = { active: 'success', pending: 'warning', inactive: 'neutral' }
    return <Badge variant={map[val] ?? 'neutral'}>{val}</Badge>
  }},
  { key: 'date',   label: 'Date',   sortable: true },
]

export default function SamplePage() {
  usePageTitle('Sample Page', 'Supabase + Airtable demo')

  const [sbData,     setSbData]     = useState([])
  const [atData,     setAtData]     = useState([])
  const [sbLoading,  setSbLoading]  = useState(true)
  const [atLoading,  setAtLoading]  = useState(true)
  const [sbError,    setSbError]    = useState(null)
  const [atError,    setAtError]    = useState(null)

  const supabase = createClient()

  /* --- Fetch from Supabase --- */
  useEffect(() => {
    supabase
      .from(SUPABASE_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setSbError(error.message)
        else setSbData(data ?? [])
        setSbLoading(false)
      })
  }, [])

  /* --- Fetch from Airtable via server route --- */
  useEffect(() => {
    fetchAirtable({ app: AIRTABLE_APP, table: AIRTABLE_TABLE })
      .then(records => {
        // Flatten Airtable record format: { id, fields: { ... } } → { id, ...fields }
        setAtData(records.map(r => ({ id: r.id, ...r.fields })))
        setAtLoading(false)
      })
      .catch(err => {
        setAtError(err.message)
        setAtLoading(false)
      })
  }, [])

  return (
    <div>
      <div className="page-header">
        <h1>Sample Page</h1>
        <p>This page demonstrates Supabase and Airtable data patterns. Delete when building your real interface.</p>
      </div>

      <div className="page-content">

        {/* Stat summary row */}
        <div className="grid-4">
          <StatCard label="Supabase Records" value={sbLoading ? '…' : sbData.length} />
          <StatCard label="Airtable Records" value={atLoading ? '…' : atData.length} />
          <StatCard label="Active" value={sbLoading ? '…' : sbData.filter(r => r.status === 'active').length} />
          <StatCard label="Pending" value={sbLoading ? '…' : sbData.filter(r => r.status === 'pending').length} />
        </div>

        {/* Supabase table */}
        <Card title="Supabase Data" >
          {sbLoading ? (
            <LoadingSkeleton lines={5} />
          ) : sbError ? (
            <EmptyState icon="⚠️" title="Error loading data" message={sbError} />
          ) : (
            <DataTable columns={columns} data={sbData} pageSize={10} />
          )}
        </Card>

        {/* Airtable table */}
        <Card title="Airtable Data">
          {atLoading ? (
            <LoadingSkeleton lines={5} />
          ) : atError ? (
            <EmptyState icon="⚠️" title="Error loading Airtable data" message={atError} />
          ) : (
            <DataTable columns={columns} data={atData} pageSize={10} />
          )}
        </Card>

      </div>
    </div>
  )
}
