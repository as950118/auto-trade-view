import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import Logo from './Logo.jsx'
import NavDropdown from './NavDropdown.jsx'
import './Navbar.css'

const MY_PAGE_ITEMS = [
  { to: '/dashboard', label: '대시보드' },
  { to: '/account', label: '계정' },
]

const TRADING_ITEMS = [
  { to: '/target-allocation', label: '목표 비율 매매' },
  { to: '/alert-strategies', label: '알림 전략' },
  { to: '/portfolios', label: '포트폴리오' },
]

const MARKET_ITEMS = [
  { to: '/chart', label: '주가 차트' },
  { to: '/fee-rebate', label: '수수료 리베이트' },
]

const Navbar = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <Logo size="medium" showText={true} />
        </Link>

        <div className="navbar-actions">
          <button
            type="button"
            className="navbar-theme-icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button
            type="button"
            className={`navbar-toggle${menuOpen ? ' is-open' : ''}`}
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={menuOpen}
            aria-controls="navbar-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="navbar-toggle-bar" />
            <span className="navbar-toggle-bar" />
            <span className="navbar-toggle-bar" />
          </button>
        </div>

        {menuOpen && (
          <button
            type="button"
            className="navbar-backdrop"
            aria-label="메뉴 닫기"
            onClick={closeMenu}
          />
        )}

        <div
          id="navbar-menu"
          className={`navbar-menu${menuOpen ? ' is-open' : ''}`}
        >
          <NavDropdown label="시장 정보" items={MARKET_ITEMS} onNavigate={closeMenu} />
          {user ? (
            <>
              <NavDropdown label="마이페이지" items={MY_PAGE_ITEMS} onNavigate={closeMenu} />
              <NavDropdown label="트레이딩" items={TRADING_ITEMS} onNavigate={closeMenu} />
              <span className="navbar-user">
                안녕하세요, {user.displayName || user.username}님
              </span>
              <button onClick={handleLogout} className="navbar-button">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link" onClick={closeMenu}>
                로그인
              </Link>
              <Link to="/signup" className="navbar-button" onClick={closeMenu}>
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
