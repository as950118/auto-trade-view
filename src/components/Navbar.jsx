import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import Logo from './Logo.jsx'
import './Navbar.css'

const Navbar = () => {
  const { user, logout } = useAuth()
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
          <Link to="/chart" className="navbar-link" onClick={closeMenu}>
            주가 차트
          </Link>
          <Link to="/fee-rebate" className="navbar-link" onClick={closeMenu}>
            수수료 리베이트
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="navbar-link" onClick={closeMenu}>
                대시보드
              </Link>
              <Link to="/target-allocation" className="navbar-link" onClick={closeMenu}>
                목표 비율 매매
              </Link>
              <Link to="/alert-strategies" className="navbar-link" onClick={closeMenu}>
                알림 전략
              </Link>
              <Link to="/account" className="navbar-link" onClick={closeMenu}>
                계정
              </Link>
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
