/* ============================================================
   EmptyState
   Usage:
     <EmptyState
       icon="📭"
       title="No records found"
       message="Try adjusting your filters or add a new record."
     />
     <EmptyState
       icon="🔍"
       title="No results"
       message="Nothing matched your search."
       action={<Button onClick={fn}>Clear search</Button>}
     />
   Props:
     icon    — emoji or ReactNode for visual
     title   — primary message
     message — secondary description (optional)
     action  — ReactNode, e.g. a Button (optional)
   ============================================================ */
export default function EmptyState({ icon, title, message, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      gap: 12,
    }}>
      {icon && (
        <div style={{ fontSize: 36, lineHeight: 1 }}>{icon}</div>
      )}
      <div style={{
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--color-text-primary)',
      }}>
        {title}
      </div>
      {message && (
        <div style={{
          fontSize: 13,
          color: 'var(--color-text-muted)',
          maxWidth: 320,
          lineHeight: 1.6,
        }}>
          {message}
        </div>
      )}
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  )
}
