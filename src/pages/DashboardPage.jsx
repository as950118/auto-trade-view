import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
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
          <button onClick={loadDashboardData} className="retry-button">
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  // 총 자산 계산
  const totalAssets = accounts.reduce((sum, account) => {
    return sum + parseFloat(account.total_assets || 0)
  }, 0)

  // 총 수익률 계산 (가중 평균)
  const totalProfitRate = accounts.length > 0
    ? accounts.reduce((sum, account) => {
        const assets = parseFloat(account.total_assets || 0)
        const rate = parseFloat(account.profit_rate || 0)
        return sum + (assets * rate)
      }, 0) / totalAssets
    : 0

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">대시보드</h1>
          <p className="dashboard-subtitle">안녕하세요, {user?.username}님</p>
        </div>

        {/* 요약 통계 */}
        {profitSummary && (
          <SummaryStats
            summary={profitSummary}
            totalAssets={totalAssets}
            totalProfitRate={totalProfitRate}
          />
        )}

        {/* 계좌 목록 */}
        <section className="dashboard-section">
          <div className="section-header-row">
            <h2 className="section-title">계좌 목록</h2>
            <button className="btn-add-account" onClick={handleAddAccount}>
              + 계좌 등록
            </button>
          </div>
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
                <button className="btn-add-account" onClick={handleAddAccount}>
                  계좌 등록하기
                </button>
              </div>
            )}
          </div>
          {selectedAccount && (
            <button
              className="filter-clear-button"
              onClick={() => handleAccountFilter('all')}
            >
              전체 보기
            </button>
          )}
        </section>

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

        {/* 일일 수익률 차트 */}
        <section className="dashboard-section">
          <h2 className="section-title">일일 수익률 추이</h2>
          <DailyProfitChart
            data={dailyProfits}
            selectedAccount={selectedAccount}
          />
        </section>

        {/* 보유종목 */}
        <section className="dashboard-section">
          <div className="section-header-row">
            <h2 className="section-title">보유종목</h2>
            <div className="section-header-actions">
              <button
                type="button"
                className="btn-buy-open"
                onClick={() => setBuyModalOpen(true)}
              >
                매수
              </button>
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

