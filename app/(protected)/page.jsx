'use client'

import { usePageTitle } from '@/lib/page-context'
import StatCard from '@/components/ui/StatCard'

/* ============================================================
   Default Dashboard Page
   Replace the content here with your interface's home view.
   Call usePageTitle() to set the Topbar title for this page.
   ============================================================ */
export default function DashboardPage() {
  usePageTitle('Dashboard', 'Welcome back')

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome to your interface. Replace this page with your content.</p>
      </div>

      <div className="page-content">

        {/* Stat cards row */}
        <div className="grid-4">
          <StatCard label="Total Records" value="—" />
          <StatCard label="Active"        value="—" />
          <StatCard label="Pending"       value="—" />
          <StatCard label="Last Updated"  value="—" />
        </div>

        {/* Main content card */}
        <div className="card">
          <div className="card-header">
            <h3>Getting Started</h3>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
            This is the <strong>Amped I Interface Template</strong>. To build your interface:
          </p>
          <ol style={{ marginTop: 12, paddingLeft: 20, fontSize: 13, lineHeight: 2, color: 'var(--color-text-secondary)' }}>
            <li>Update the nav items in <code>components/layout/Sidebar.jsx</code></li>
            <li>Add your pages inside <code>app/(protected)/</code></li>
            <li>Connect your data in <code>lib/supabase/</code> and <code>app/api/airtable/</code></li>
            <li>Update the app name in <code>components/layout/Sidebar.jsx</code> and <code>app/layout.jsx</code></li>
            <li>Set your environment variables in <code>.env.local</code></li>
          </ol>
        </div>

      </div>
    </div>
  )
}
