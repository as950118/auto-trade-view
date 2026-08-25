import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import PortfolioFormModal from '../components/dashboard/PortfolioFormModal'
import PortfolioHoldingsEditor from '../components/dashboard/PortfolioHoldingsEditor'
import PortfolioLinkFormModal from '../components/dashboard/PortfolioLinkFormModal'
import PortfolioComparisonPanel from '../components/dashboard/PortfolioComparisonPanel'
import PortfolioCard, { getAssetType } from '../components/dashboard/PortfolioCard'
import { dashboardAPI } from '../services/dashboardAPI'
import './PortfolioPage.css'

const OWNERSHIP_TABS = [
  { value: 'ALL', label: '전체' },
  { value: 'MINE', label: '내 포트폴리오' },
  { value: 'SUBSCRIBED', label: '구독 중' },
  { value: 'PUBLIC', label: '공개 포트폴리오' },
]

const ASSET_TABS = [
  { value: 'ALL', label: '전체 자산' },
  { value: 'STOCK', label: '주식' },
  { value: 'CRYPTO', label: '코인' },
  { value: 'MIXED', label: '혼합' },
]

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

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
  const [subscribeTargetId, setSubscribeTargetId] = useState(null)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null)

  const [search, setSearch] = useState('')
  const [ownershipFilter, setOwnershipFilter] = useState('ALL')
  const [assetFilter, setAssetFilter] = useState('ALL')

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
      if (selectedPortfolioId === portfolio.id) setSelectedPortfolioId(null)
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

  const isOwned = (portfolio) =>
    portfolio.owner === user?.id || portfolio.owner_username === user?.username

  const canManage = (portfolio) => isStaff || isOwned(portfolio)

  const subscribedPortfolioIds = useMemo(
    () => new Set(links.map((l) => l.portfolio?.id ?? l.portfolio_id)),
    [links]
  )

  const ownershipCounts = useMemo(() => {
    const counts = { ALL: portfolios.length, MINE: 0, SUBSCRIBED: 0, PUBLIC: 0 }
    portfolios.forEach((p) => {
      if (isOwned(p)) counts.MINE += 1
      if (subscribedPortfolioIds.has(p.id)) counts.SUBSCRIBED += 1
      if (!isOwned(p) && p.visibility === 'PUBLIC') counts.PUBLIC += 1
    })
    return counts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolios, subscribedPortfolioIds, user])

  const filteredPortfolios = useMemo(() => {
    const q = search.trim().toLowerCase()
    return portfolios.filter((p) => {
      if (ownershipFilter === 'MINE' && !isOwned(p)) return false
      if (ownershipFilter === 'SUBSCRIBED' && !subscribedPortfolioIds.has(p.id)) return false
      if (ownershipFilter === 'PUBLIC' && (isOwned(p) || p.visibility !== 'PUBLIC')) return false
      if (assetFilter !== 'ALL' && getAssetType(p) !== assetFilter) return false
      if (q) {
        const inTitle = p.title?.toLowerCase().includes(q)
        const inDesc = p.description?.toLowerCase().includes(q)
        const inHoldings = (p.holdings || []).some(
          (h) => h.symbol?.ticker?.toLowerCase().includes(q) || h.symbol?.name?.toLowerCase().includes(q)
        )
        if (!inTitle && !inDesc && !inHoldings) return false
      }
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolios, ownershipFilter, assetFilter, search, subscribedPortfolioIds, user])

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
          <Button type="button" variant="primary" size="lg" onClick={loadData}>다시 시도</Button>
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
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setEditingPortfolio(null)
                setPortfolioModalOpen(true)
              }}
            >
              + 포트폴리오 추가
            </Button>
          </div>

          <div className="portfolio-toolbar">
            <div className="portfolio-search">
              <SearchIcon />
              <input
                type="text"
                placeholder="제목, 설명, 종목으로 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="search-clear" onClick={() => setSearch('')} aria-label="검색어 지우기">
                  ×
                </button>
              )}
            </div>

            <div className="filter-row">
              {OWNERSHIP_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`filter-chip${ownershipFilter === tab.value ? ' active' : ''}`}
                  onClick={() => setOwnershipFilter(tab.value)}
                >
                  {tab.label}
                  <span className="filter-chip-count">{ownershipCounts[tab.value]}</span>
                </button>
              ))}
            </div>

            <div className="filter-row">
              {ASSET_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`filter-chip filter-chip-secondary${assetFilter === tab.value ? ' active' : ''}`}
                  onClick={() => setAssetFilter(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {portfolios.length === 0 ? (
            <div className="empty-state"><p>등록된 포트폴리오가 없습니다.</p></div>
          ) : filteredPortfolios.length === 0 ? (
            <div className="empty-state"><p>조건에 맞는 포트폴리오가 없습니다.</p></div>
          ) : (
            <div className="portfolio-grid">
              {filteredPortfolios.map((p) => (
                <PortfolioCard
                  key={p.id}
                  portfolio={p}
                  isMine={isOwned(p)}
                  isSubscribed={subscribedPortfolioIds.has(p.id)}
                  canManage={canManage(p)}
                  isSelected={selectedPortfolioId === p.id}
                  onSelect={(portfolio) => setSelectedPortfolioId(portfolio.id)}
                  onEdit={(portfolio) => {
                    setEditingPortfolio(portfolio)
                    setPortfolioModalOpen(true)
                  }}
                  onEditWeights={(portfolio) => {
                    setSelectedPortfolioId(portfolio.id)
                    setHoldingsModalOpen(true)
                  }}
                  onDelete={handleDeletePortfolio}
                  onSubscribe={(portfolio) => {
                    setSubscribeTargetId(portfolio.id)
                    setEditingLink(null)
                    setLinkModalOpen(true)
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {selectedPortfolio && (
          <section className="portfolio-section portfolio-detail-section">
            <div className="section-header-row">
              <h2 className="section-title">{selectedPortfolio.title} · 목표비중 vs 실제보유</h2>
              <button type="button" className="btn-link" onClick={() => setSelectedPortfolioId(null)}>
                닫기
              </button>
            </div>
            <PortfolioComparisonPanel portfolio={selectedPortfolio} links={links} />
          </section>
        )}

        <section className="portfolio-section">
          <div className="section-header-row">
            <h2 className="section-title">내 구독</h2>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setEditingLink(null)
                setSubscribeTargetId(null)
                setLinkModalOpen(true)
              }}
              disabled={accounts.length === 0 || portfolios.length === 0}
            >
              + 구독 추가
            </Button>
          </div>
          {links.length === 0 ? (
            <div className="empty-state"><p>구독한 포트폴리오가 없습니다.</p></div>
          ) : (
            <div className="subscription-list">
              {links.map((l) => (
                <div key={l.id} className="subscription-card">
                  <div className="subscription-info">
                    <span className="subscription-title">{l.portfolio?.title || l.portfolio_id}</span>
                    <span className="subscription-meta">{getAccountName(l.account)}</span>
                  </div>
                  <div className="subscription-seed">
                    {Number(l.seed_amount).toLocaleString()} {l.seed_currency}
                  </div>
                  <Badge variant={l.enabled ? 'success' : 'danger'}>
                    {l.enabled ? 'ON' : 'OFF'}
                  </Badge>
                  <div className="subscription-actions">
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => {
                        setEditingLink(l)
                        setSubscribeTargetId(null)
                        setLinkModalOpen(true)
                      }}
                    >
                      수정
                    </button>
                    <button type="button" className="btn-link danger" onClick={() => handleDeleteLink(l)}>
                      삭제
                    </button>
                  </div>
                </div>
              ))}
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
          setSubscribeTargetId(null)
        }}
        onSuccess={loadData}
        link={editingLink}
        accounts={accounts}
        portfolios={portfolios}
        initialPortfolioId={subscribeTargetId}
      />
    </div>
  )
}

export default PortfolioPage
