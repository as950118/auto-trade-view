import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Button from '../components/ui/Button'
import AccountCard from '../components/dashboard/AccountCard'
import HoldingsTable from '../components/dashboard/HoldingsTable'
import DailyProfitChart from '../components/dashboard/DailyProfitChart'
import SummaryStats from '../components/dashboard/SummaryStats'
import AccountFormModal from '../components/dashboard/AccountFormModal'
import BuyOrderModal from '../components/dashboard/BuyOrderModal'
import { dashboardAPI } from '../services/dashboardAPI'
import './DashboardPage.css'

const DashboardPage = () => {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [holdings, setHoldings] = useState([])
  const [dailyProfits, setDailyProfits] = useState([])
  const [profitSummary, setProfitSummary] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [buyModalOpen, setBuyModalOpen] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, []) // selectedAccount 제거 - 초기 로드만 수행

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 병렬로 데이터 로드 - 모든 holdings를 가져옴 (필터링은 클라이언트에서)
      const [accountsData, holdingsData, profitsData, summaryData] = await Promise.all([
        dashboardAPI.getAccounts(),
        dashboardAPI.getHoldings(null), // 항상 전체 데이터 가져오기
        dashboardAPI.getDailyProfits({ ordering: '-date' }),
        dashboardAPI.getProfitSummary(),
      ])

      setAccounts(accountsData.results || accountsData)
      setHoldings(holdingsData.results || holdingsData)
      setDailyProfits(profitsData.results || profitsData)
      setProfitSummary(summaryData)
    } catch (err) {
      console.error('Dashboard data load error:', err)
      setError(err.response?.data?.detail || '데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAccountFilter = (accountId) => {
    setSelectedAccount(accountId === 'all' ? null : accountId)
  }

  const handleAddAccount = () => {
    setEditingAccount(null)
    setIsModalOpen(true)
  }

  const handleEditAccount = (account) => {
    setEditingAccount(account)
    setIsModalOpen(true)
  }

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('정말 이 계좌를 삭제하시겠습니까?')) {
      return
    }

    try {
      await dashboardAPI.deleteAccount(accountId)
      loadDashboardData()
    } catch (err) {
      alert(err.response?.data?.detail || '계좌 삭제에 실패했습니다.')
    }
  }

  const handleModalSuccess = () => {
    loadDashboardData()
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div className="dashboard-error">
          <p>{error}</p>
          <Button variant="primary" size="lg" onClick={loadDashboardData}>
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  // 통화별 총자산 / 평가손익 (환율 환산 없이 분리)
  const totalAssetsKrw = accounts.reduce(
    (sum, a) => sum + parseFloat(a.total_assets_krw || 0),
    0
  )
  const totalAssetsUsd = accounts.reduce(
    (sum, a) => sum + parseFloat(a.total_assets_usd || 0),
    0
  )
  const totalProfitLossKrw = accounts.reduce(
    (sum, a) => sum + parseFloat(a.profit_loss_krw || 0),
    0
  )
  const totalProfitLossUsd = accounts.reduce(
    (sum, a) => sum + parseFloat(a.profit_loss_usd || 0),
    0
  )

  // 통화별 가중 평균 수익률 (해당 통화 자산 기준)
  const totalProfitRateKrw = totalAssetsKrw > 0
    ? accounts.reduce((sum, a) => {
        const assets = parseFloat(a.total_assets_krw || 0)
        const rate = parseFloat(a.profit_rate_krw || 0)
        return sum + assets * rate
      }, 0) / totalAssetsKrw
    : 0
  const totalProfitRateUsd = totalAssetsUsd > 0
    ? accounts.reduce((sum, a) => {
        const assets = parseFloat(a.total_assets_usd || 0)
        const rate = parseFloat(a.profit_rate_usd || 0)
        return sum + assets * rate
      }, 0) / totalAssetsUsd
    : 0

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">대시보드</h1>
          <p className="dashboard-subtitle">안녕하세요, {user?.displayName || user?.username}님</p>
        </div>

        {/* 요약 통계 */}
        {profitSummary && (
          <SummaryStats
            summary={profitSummary}
            totalAssetsKrw={totalAssetsKrw}
            totalAssetsUsd={totalAssetsUsd}
            totalProfitLossKrw={totalProfitLossKrw}
            totalProfitLossUsd={totalProfitLossUsd}
            totalProfitRateKrw={totalProfitRateKrw}
            totalProfitRateUsd={totalProfitRateUsd}
          />
        )}

        <div className="dashboard-row-2col">
          {/* 계좌 목록 */}
          <section className="dashboard-section">
            <div className="section-header-row">
              <h2 className="section-title">계좌 목록</h2>
              <Button variant="primary" size="sm" onClick={handleAddAccount}>
                + 계좌 등록
              </Button>
            </div>
            <div className="accounts-scroll">
              <div className="accounts-grid">
                {accounts.length > 0 ? (
                  accounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      holdings={holdings}
                      onClick={() => handleAccountFilter(account.id)}
                      onEdit={() => handleEditAccount(account)}
                      onDelete={() => handleDeleteAccount(account.id)}
                      isSelected={selectedAccount === account.id}
                    />
                  ))
                ) : (
                <div className="empty-state">
                  <p>등록된 계좌가 없습니다.</p>
                  <Button variant="primary" onClick={handleAddAccount}>
                    계좌 등록하기
                  </Button>
                </div>
              )}
              </div>
            </div>
            {selectedAccount && (
              <Button
                variant="secondary"
                size="sm"
                className="filter-clear-button"
                onClick={() => handleAccountFilter('all')}
              >
                전체 보기
              </Button>
            )}
          </section>

          {/* 일일 수익률 차트 */}
          <section className="dashboard-section">
            <h2 className="section-title">일일 수익률 추이</h2>
            <DailyProfitChart
              data={dailyProfits}
              selectedAccount={selectedAccount}
            />
          </section>
        </div>

        {/* 계좌 등록/수정 모달 */}
        <AccountFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingAccount(null)
          }}
          onSuccess={handleModalSuccess}
          account={editingAccount}
        />

        {/* 보유종목 */}
        <section className="dashboard-section">
          <div className="section-header-row">
            <h2 className="section-title">보유종목</h2>
            <div className="section-header-actions">
              <Button
                type="button"
                variant="buy"
                size="sm"
                onClick={() => setBuyModalOpen(true)}
              >
                매수
              </Button>
              {selectedAccount && (
                <span className="filter-badge">
                  계좌 필터 적용됨
                </span>
              )}
            </div>
          </div>
          <HoldingsTable
            holdings={holdings}
            accounts={accounts}
            selectedAccount={selectedAccount}
            onClearAccountFilter={() => handleAccountFilter(null)}
            onSellSuccess={loadDashboardData}
          />
        </section>

        {/* 매수 주문 모달 */}
        <BuyOrderModal
          isOpen={buyModalOpen}
          onClose={() => setBuyModalOpen(false)}
          onSuccess={handleModalSuccess}
          accounts={accounts}
        />
      </div>
    </div>
  )
}

export default DashboardPage

