import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import PortfolioFormModal from '../components/dashboard/PortfolioFormModal'
import PortfolioHoldingsEditor from '../components/dashboard/PortfolioHoldingsEditor'
import PortfolioLinkFormModal from '../components/dashboard/PortfolioLinkFormModal'
import PortfolioWeightChart from '../components/dashboard/PortfolioWeightChart'
import { dashboardAPI } from '../services/dashboardAPI'
import './PortfolioPage.css'

const PortfolioPage = () => {
  const { user } = useAuth()
  const isStaff = !!(user?.is_staff || user?.isStaff)
  const [accounts, setAccounts] = useState([])
  const [portfolios, setPortfolios] = useState([])
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false)
  const [holdingsModalOpen, setHoldingsModalOpen] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState(null)
  const [editingLink, setEditingLink] = useState(null)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [accountsData, portfoliosData, linksData] = await Promise.all([
        dashboardAPI.getAccounts(),
        dashboardAPI.getPortfolios(),
        dashboardAPI.getPortfolioLinks(),
      ])
      setAccounts(accountsData.results || accountsData || [])
      setPortfolios(portfoliosData.results || portfoliosData || [])
      setLinks(linksData.results || linksData || [])
    } catch (err) {
      console.error('Portfolio page load error:', err)
      setError(err.response?.data?.detail || '데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getAccountName = (acc) => {
    if (!acc) return '-'
    return acc.broker?.name ? `${acc.broker.name} (${acc.account_number || '-'})` : `계좌 ${acc.id}`
  }

  const handleDeletePortfolio = async (portfolio) => {
    if (!window.confirm(`"${portfolio.title}" 포트폴리오를 삭제하시겠습니까?`)) return
    try {
      await dashboardAPI.deletePortfolio(portfolio.id)
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || '삭제에 실패했습니다.')
    }
  }

  const handleDeleteLink = async (link) => {
    if (!window.confirm('이 구독을 삭제하시겠습니까?')) return
    try {
      await dashboardAPI.deletePortfolioLink(link.id)
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || '삭제에 실패했습니다.')
    }
  }

  const canManage = (portfolio) =>
    isStaff || portfolio.owner === user?.id || portfolio.owner_username === user?.username

  const selectedPortfolio = portfolios.find((p) => p.id === selectedPortfolioId) || null

  if (loading) {
    return (
      <div className="portfolio-page">
        <Navbar />
        <div className="portfolio-loading">
          <div className="loading-spinner" />
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="portfolio-page">
        <Navbar />
        <div className="portfolio-error">
          <p>{error}</p>
          <button type="button" onClick={loadData} className="retry-button">다시 시도</button>
        </div>
      </div>
    )
  }

  return (
    <div className="portfolio-page">
      <Navbar />
      <div className="portfolio-container">
        <div className="portfolio-header">
          <h1 className="portfolio-title">포트폴리오</h1>
          <p className="portfolio-subtitle">
            여러 종목의 목표 비중으로 구성된 포트폴리오를 만들고, 구독한 계좌는 비중 변경 시 즉시 동일하게 미러링됩니다.
          </p>
        </div>

        <section className="portfolio-section">
          <div className="section-header-row">
            <h2 className="section-title">포트폴리오</h2>
            <button
              type="button"
              className="btn-add-plan"
              onClick={() => {
                setEditingPortfolio(null)
                setPortfolioModalOpen(true)
              }}
            >
              + 포트폴리오 추가
            </button>
          </div>
          {portfolios.length === 0 ? (
            <div className="empty-state"><p>등록된 포트폴리오가 없습니다.</p></div>
          ) : (
            <div className="plans-table-wrapper">
              <table className="plans-table">
                <thead>
                  <tr>
                    <th>제목</th>
                    <th>공개</th>
                    <th>종목 수</th>
                    <th>활성</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolios.map((p) => (
                    <tr key={p.id} className={selectedPortfolioId === p.id ? 'row-selected' : ''}>
                      <td>
                        <button type="button" className="btn-link" onClick={() => setSelectedPortfolioId(p.id)}>
                          {p.title}
                        </button>
                        {p.description && <div className="muted-text">{p.description}</div>}
                      </td>
                      <td>{p.visibility === 'PUBLIC' ? '공개' : '비공개'}</td>
                      <td>{p.holdings?.length ?? 0}</td>
                      <td>
                        <span className={`badge ${p.enabled ? 'badge-on' : 'badge-off'}`}>
                          {p.enabled ? 'ON' : 'OFF'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        {canManage(p) ? (
                          <>
                            <button
                              type="button"
                              className="btn-link"
                              onClick={() => {
                                setEditingPortfolio(p)
                                setPortfolioModalOpen(true)
                              }}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              className="btn-link"
                              onClick={() => {
                                setSelectedPortfolioId(p.id)
                                setHoldingsModalOpen(true)
                              }}
                            >
                              비중 편집
                            </button>
                            <button type="button" className="btn-link danger" onClick={() => handleDeletePortfolio(p)}>
                              삭제
                            </button>
                          </>
                        ) : (
                          <button type="button" className="btn-link" onClick={() => setSelectedPortfolioId(p.id)}>
                            상세보기
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedPortfolio && (
          <section className="portfolio-section">
            <div className="section-header-row">
              <h2 className="section-title">{selectedPortfolio.title} · 목표 비중</h2>
            </div>
            <PortfolioWeightChart holdings={selectedPortfolio.holdings} />
          </section>
        )}

        <section className="portfolio-section">
          <div className="section-header-row">
            <h2 className="section-title">내 구독</h2>
            <button
              type="button"
              className="btn-add-plan"
              onClick={() => {
                setEditingLink(null)
                setLinkModalOpen(true)
              }}
              disabled={accounts.length === 0 || portfolios.length === 0}
            >
              + 구독 추가
            </button>
          </div>
          {links.length === 0 ? (
            <div className="empty-state"><p>구독한 포트폴리오가 없습니다.</p></div>
          ) : (
            <div className="plans-table-wrapper">
              <table className="plans-table">
                <thead>
                  <tr>
                    <th>포트폴리오</th>
                    <th>계좌</th>
                    <th>시드</th>
                    <th>활성</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((l) => (
                    <tr key={l.id}>
                      <td>{l.portfolio?.title || l.portfolio_id}</td>
                      <td>{getAccountName(l.account)}</td>
                      <td>
                        {Number(l.seed_amount).toLocaleString()} {l.seed_currency}
                      </td>
                      <td>
                        <span className={`badge ${l.enabled ? 'badge-on' : 'badge-off'}`}>
                          {l.enabled ? 'ON' : 'OFF'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => {
                            setEditingLink(l)
                            setLinkModalOpen(true)
                          }}
                        >
                          수정
                        </button>
                        <button type="button" className="btn-link danger" onClick={() => handleDeleteLink(l)}>
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <PortfolioFormModal
        isOpen={portfolioModalOpen}
        onClose={() => {
          setPortfolioModalOpen(false)
          setEditingPortfolio(null)
        }}
        onSuccess={loadData}
        portfolio={editingPortfolio}
        isStaff={isStaff}
      />
      <PortfolioHoldingsEditor
        isOpen={holdingsModalOpen}
        onClose={() => setHoldingsModalOpen(false)}
        onSuccess={loadData}
        portfolio={selectedPortfolio}
      />
      <PortfolioLinkFormModal
        isOpen={linkModalOpen}
        onClose={() => {
          setLinkModalOpen(false)
          setEditingLink(null)
        }}
        onSuccess={loadData}
        link={editingLink}
        accounts={accounts}
        portfolios={portfolios}
      />
    </div>
  )
}

export default PortfolioPage
