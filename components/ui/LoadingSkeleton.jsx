/* ============================================================
   LoadingSkeleton
   Uses the .skeleton shimmer animation from globals.css.
   Usage:
     <LoadingSkeleton />                        — 3 lines, default height
     <LoadingSkeleton lines={5} />              — 5 lines
     <LoadingSkeleton lines={1} height={120} /> — single tall block (e.g. chart)
     <LoadingSkeleton card />                   — wrapped in a card
   Props:
     lines   — number of skeleton rows (default: 3)
     height  — height of each row in px (default: 16)
     gap     — gap between rows in px (default: 10)
     card    — boolean, wraps in a .card container
   ============================================================ */
export default function LoadingSkeleton({ lines = 3, height = 16, gap = 10, card = false }) {
  const rows = Array.from({ length: lines })

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {rows.map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height,
            width: i === rows.length - 1 && lines > 1 ? '60%' : '100%',
            borderRadius: 'var(--radius-md)',
          }}
        />
      ))}
    </div>
  )

  if (card) {
    return <div className="card">{content}</div>
  }

  return content
}
