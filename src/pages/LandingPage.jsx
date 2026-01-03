import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Logo from '../components/Logo.jsx'
import PriceChart from '../components/PriceChart.jsx'
import PerformanceChart from '../components/PerformanceChart.jsx'
import './LandingPage.css'

const LandingPage = () => {
  const { user } = useAuth()

  return (
    <div className="landing-page">
      <Navbar />
      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-logo">
              <Logo size="large" showText={true} color="white" />
            </div>
            <h1 className="hero-title">
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

        {/* Chart Section */}
        <section className="chart-section">
          <div className="chart-section-container">
            <div className="section-header">
              <h2 className="section-title">실시간 성과 분석</h2>
              <p className="section-description">
                데이터 기반 의사결정으로 최적의 매매 타이밍을 제공합니다
              </p>
            </div>
            <div className="charts-grid">
              <PriceChart />
              <PerformanceChart />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features">
          <div className="features-container">
            <div className="section-header">
              <h2 className="section-title">주요 기능</h2>
              <p className="section-description">
                강력한 기능으로 자동매매를 더욱 스마트하게
              </p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">📈</div>
                </div>
                <h3 className="feature-title">주식 자동매매</h3>
                <p className="feature-description">
                  국내외 주식 시장을 지원하는 강력한 자동매매 시스템으로
                  최적의 매매 타이밍을 자동으로 포착합니다.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">₿</div>
                </div>
                <h3 className="feature-title">암호화폐 자동매매</h3>
                <p className="feature-description">
                  주요 거래소를 지원하는 암호화폐 자동매매 솔루션으로
                  24시간 자동 거래가 가능합니다.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">⚡</div>
                </div>
                <h3 className="feature-title">실시간 모니터링</h3>
                <p className="feature-description">
                  실시간으로 주문 상태와 수익률을 확인할 수 있으며
                  상세한 거래 내역을 제공합니다.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">🔒</div>
                </div>
                <h3 className="feature-title">안전한 거래</h3>
                <p className="feature-description">
                  최고 수준의 보안으로 자산을 안전하게 관리하며
                  모든 거래는 암호화되어 보호됩니다.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">🎯</div>
                </div>
                <h3 className="feature-title">스마트 리스크 관리</h3>
                <p className="feature-description">
                  변동성 기반 포지션 크기 조절과 동적 손절 기능으로
                  리스크를 최소화합니다.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">📊</div>
                </div>
                <h3 className="feature-title">다중 타임프레임 분석</h3>
                <p className="feature-description">
                  여러 시간대의 데이터를 종합 분석하여
                  더 정확한 매매 신호를 생성합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="technology">
          <div className="technology-container">
            <div className="section-header">
              <h2 className="section-title">기술적 우수성</h2>
              <p className="section-description">
                고급 알고리즘과 데이터 분석으로 차별화된 자동매매 경험을 제공합니다
              </p>
            </div>
            <div className="tech-grid">
              <div className="tech-card">
                <div className="tech-number">01</div>
                <h3 className="tech-title">시장 상태 분석</h3>
                <p className="tech-description">
                  추세, 횡보, 변동성 등 시장 상태를 실시간으로 분석하여
                  최적의 전략을 자동으로 선택합니다.
                </p>
              </div>
              <div className="tech-card">
                <div className="tech-number">02</div>
                <h3 className="tech-title">변동성 기반 포지션</h3>
                <p className="tech-description">
                  시장 변동성을 고려한 포지션 크기 조절로
                  리스크를 관리하면서 수익 기회를 극대화합니다.
                </p>
              </div>
              <div className="tech-card">
                <div className="tech-number">03</div>
                <h3 className="tech-title">슬리피지 최소화</h3>
                <p className="tech-description">
                  과거 거래 데이터를 학습하여 슬리피지를 최소화하고
                  실제 체결가를 정확하게 예측합니다.
                </p>
              </div>
              <div className="tech-card">
                <div className="tech-number">04</div>
                <h3 className="tech-title">적응형 리스크 관리</h3>
                <p className="tech-description">
                  시장 상태에 따라 동적으로 손절 기준을 조정하여
                  불필요한 손실을 방지합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-container">
            <h2 className="cta-title">지금 시작하세요</h2>
            <p className="cta-description">
              Trader's Mark와 함께 스마트한 자동매매를 경험해보세요
            </p>
            {!user && (
              <div className="cta-buttons">
                <Link to="/signup" className="btn btn-primary btn-large">
                  무료로 시작하기
                </Link>
                <Link to="/login" className="btn btn-secondary btn-large">
                  로그인
                </Link>
              </div>
            )}
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
