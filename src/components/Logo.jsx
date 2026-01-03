import './Logo.css'

const Logo = ({ size = 'medium', showText = true, color = 'red' }) => {
  const sizeClass = `logo-${size}`
  const iconColor = color === 'white' ? '#ffffff' : '#dc2626'
  
  return (
    <div className={`logo ${sizeClass}`}>
      <svg
        className="logo-icon"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 차트 그래프 배경 */}
        <rect x="20" y="30" width="8" height="40" fill={iconColor} opacity="0.3" rx="2" />
        <rect x="32" y="20" width="8" height="50" fill={iconColor} opacity="0.4" rx="2" />
        <rect x="44" y="40" width="8" height="30" fill={iconColor} opacity="0.5" rx="2" />
        <rect x="56" y="25" width="8" height="45" fill={iconColor} opacity="0.6" rx="2" />
        <rect x="68" y="35" width="8" height="35" fill={iconColor} opacity="0.7" rx="2" />
        
        {/* 상승 화살표 */}
        <path
          d="M 50 15 L 45 25 L 50 20 L 55 25 Z"
          fill={iconColor}
        />
        <path
          d="M 50 20 L 50 35"
          stroke={iconColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* T 마크 (Trader's Mark) */}
        <rect x="40" y="60" width="20" height="4" fill={iconColor} rx="2" />
        <rect x="48" y="60" width="4" height="20" fill={iconColor} rx="2" />
      </svg>
      {showText && (
        <span className="logo-text">Trader's Mark</span>
      )}
    </div>
  )
}

export default Logo

