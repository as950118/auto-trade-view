import './Button.css'

const VARIANTS = ['primary', 'buy', 'sell', 'secondary', 'ghost']

function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const variantClass = VARIANTS.includes(variant) ? variant : 'primary'
  const classes = ['ui-btn', `ui-btn-${variantClass}`, `ui-btn-${size}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}

export default Button
