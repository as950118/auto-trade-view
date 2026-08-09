import './Badge.css'

const VARIANTS = ['success', 'warning', 'danger']

function Badge({ variant = 'success', pill = true, className = '', children }) {
  const variantClass = VARIANTS.includes(variant) ? variant : 'success'
  const classes = ['ui-badge', `ui-badge-${variantClass}`, pill ? 'ui-badge-pill' : '', className]
    .filter(Boolean)
    .join(' ')

  return <span className={classes}>{children}</span>
}

export default Badge
