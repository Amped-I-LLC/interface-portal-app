/* ============================================================
   Badge
   Usage:
     <Badge variant="success">Active</Badge>
     <Badge variant="warning">Pending</Badge>
     <Badge variant="danger">Overdue</Badge>
   Props:
     variant — 'success' | 'warning' | 'danger' | 'info' | 'neutral'
               (default: 'neutral')
     children — label text
   ============================================================ */
export default function Badge({ variant = 'neutral', children }) {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  )
}
