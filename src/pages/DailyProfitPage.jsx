import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Button from '../components/ui/Button'
import DailyProfitChart from '../components/dashboard/DailyProfitChart'
import { dashboardAPI } from '../services/dashboardAPI'
import './DailyProfitPage.css'

const DailyProfitPage = () => {
  const [accounts, setAccounts] = useState([])
  const [dailyProfits, setDailyProfits] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    loadDailyProfits(selectedAccount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount])

  const loadAccounts = async () => {
    try {
      const accountsData = await dashboardAPI.getAccounts()
      setAccounts(accountsData.results || accountsData)
    } catch (err) {
      console.error('계좌 목록 로드 실패:', err)
    }
  }

  const loadDailyProfits = async (accountId) => {
    try {
      setLoading(true)
      setError(null)
      const data = accountId
        ? await dashboardAPI.getDailyProfitsByAccount(accountId)
        : await dashboardAPI.getDailyProfits({ ordering: '-date' })
      setDailyProfits(data.results || data)
    } catch (err) {
      console.error('일일 수익률 로드 실패:', err)
      setError(err.response?.data?.detail || '데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getAccountName = (acc) =>
    acc.broker?.name ? `${acc.broker.name} (${acc.account_number || '-'})` : `계좌 ${acc.id}`

  return (
    <div className="daily-profit-page">
      <Navbar />
      <div className="daily-profit-container">
        <div className="daily-profit-header">
          <h1 className="daily-profit-title">일일 수익률 추이</h1>
          <select
            className="daily-profit-account-select"
            value={selectedAccount ?? ''}
            onChange={(e) => setSelectedAccount(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">전체 계좌</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {getAccountName(acc)}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="daily-profit-error">
            <p>{error}</p>
            <Button variant="primary" size="md" onClick={() => loadDailyProfits(selectedAccount)}>
              다시 시도
            </Button>
          </div>
        ) : loading ? (
          <div className="daily-profit-loading">
            <div className="loading-spinner" />
            <p>데이터를 불러오는 중...</p>
          </div>
        ) : (
          <section className="daily-profit-section">
            <DailyProfitChart data={dailyProfits} selectedAccount={selectedAccount} />
          </section>
        )}
      </div>
    </div>
  )
}

export default DailyProfitPage
