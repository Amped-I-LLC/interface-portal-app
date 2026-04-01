/* ============================================================
   Card
   Usage:
     <Card>content</Card>
     <Card title="Users" action={<Button size="sm">Add</Button>}>
       content
     </Card>
   Props:
     title    — string, renders a card-header with title
     action   — ReactNode, placed on the right side of the header
     padding  — override inner padding (default: 'var(--space-6)')
     children — card body content
   ============================================================ */
export default function Card({ title, action, padding, children, style }) {
  return (
    <div className="card" style={{ padding: padding || 'var(--space-6)', ...style }}>
      {title && (
        <div className="card-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
