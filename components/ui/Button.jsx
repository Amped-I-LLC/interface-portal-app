/* ============================================================
   Button
   Usage:
     <Button>Save</Button>
     <Button variant="secondary" size="sm" onClick={fn}>Cancel</Button>
     <Button variant="danger" disabled>Delete</Button>
   Props:
     variant  — 'primary' | 'secondary' | 'neutral' | 'danger'  (default: 'primary')
     size     — 'sm' | 'md' | 'lg'                              (default: 'md')
     disabled — boolean
     onClick  — function
     type     — 'button' | 'submit' | 'reset'                   (default: 'button')
     children — content
   ============================================================ */
export default function Button({
  variant  = 'primary',
  size     = 'md',
  disabled = false,
  onClick,
  type     = 'button',
  children,
  style,
}) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  const variantClass = `btn-${variant}`

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variantClass} ${sizeClass}`}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {children}
    </button>
  )
}
