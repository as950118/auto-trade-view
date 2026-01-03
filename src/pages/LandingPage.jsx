import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import './LandingPage.css'

const LandingPage = () => {
  const { user } = useAuth()

  return (
    <div className="landing-page">
      <Navbar />
      <main className="landing-main">
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="brand-highlight">Trader's Mark</span>
              <br />
              자동매매의 새로운 기준
            </h1>
            <p className="hero-description">
              주식과 암호화폐를 포함한 모든 자산의 자동매매를 지원하는
              <br />
              강력하고 안전한 트레이딩 플랫폼입니다.
            </p>
            <div className="hero-buttons">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary">
                  대시보드로 이동
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary">
                    무료로 시작하기
                  </Link>
                  <Link to="/login" className="btn btn-secondary">
                    로그인
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="features">
          <div className="features-container">
            <h2 className="features-title">주요 기능</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3 className="feature-title">주식 자동매매</h3>
                <p className="feature-description">
                  국내외 주식 시장을 지원하는 강력한 자동매매 시스템
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">₿</div>
                <h3 className="feature-title">암호화폐 자동매매</h3>
                <p className="feature-description">
                  주요 거래소를 지원하는 암호화폐 자동매매 솔루션
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3 className="feature-title">실시간 모니터링</h3>
                <p className="feature-description">
                  실시간으로 주문 상태와 수익률을 확인할 수 있습니다
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3 className="feature-title">안전한 거래</h3>
                <p className="feature-description">
                  최고 수준의 보안으로 자산을 안전하게 관리합니다
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-container">
          <p>&copy; 2024 Trader's Mark. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

