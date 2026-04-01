/* ============================================================
   StatCard
   Usage:
     <StatCard label="Total Records" value={412} />
     <StatCard label="Revenue" value="$84,200" trend="+12%" trendUp />
     <StatCard label="Overdue" value={7} trend="+3" trendUp={false} />
   Props:
     label    — string, metric name
     value    — string | number, main display value
     trend    — string, e.g. '+12%' or '-3' (optional)
     trendUp  — boolean, true = green arrow, false = red arrow
   ============================================================ */
export default function StatCard({ label, value, trend, trendUp }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--color-text-muted)',
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 24,
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        lineHeight: 1,
      }}>
        {value ?? '—'}
      </div>
      {trend && (
        <div style={{
          marginTop: 8,
          fontSize: 12,
          fontWeight: 600,
          color: trendUp ? 'var(--color-success)' : 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}>
          <span>{trendUp ? '↑' : '↓'}</span>
          {trend}
        </div>
      )}
    </div>
  )
}
