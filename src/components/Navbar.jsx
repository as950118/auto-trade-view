import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import Logo from './Logo.jsx'
import './Navbar.css'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <Logo size="medium" showText={true} />
        </Link>
        <div className="navbar-menu">
          {user ? (
            <>
              <Link to="/dashboard" className="navbar-link">
                대시보드
              </Link>
              <span className="navbar-user">안녕하세요, {user.username}님</span>
              <button onClick={handleLogout} className="navbar-button">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                로그인
              </Link>
              <Link to="/signup" className="navbar-button">
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

