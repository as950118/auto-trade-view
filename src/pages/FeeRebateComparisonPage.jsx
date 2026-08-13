import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Button from '../components/ui/Button'
import { dashboardAPI } from '../services/dashboardAPI'
import './FeeRebateComparisonPage.css'

const SORT_KEYS = {
  exchange_name: 'exchange_name',
  rebate_pct: 'rebate_pct',
  trading_discount_pct: 'trading_discount_pct',
  limit_order_fee_pct: 'limit_order_fee_pct',
  market_order_fee_pct: 'market_order_fee_pct',
  avg_payback_krw: 'avg_payback_krw',
}

const FeeRebateComparisonPage = () => {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortKey, setSortKey] = useState('rebate_pct')
  const [sortAsc, setSortAsc] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await dashboardAPI.getFeeRebates()
      const data = res.results ?? res
      setList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fee rebates load error:', err)
      setError(err.response?.data?.detail || '수수료 환급 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev)
    } else {
      setSortKey(key)
      setSortAsc(key === 'exchange_name')
    }
  }

  const sortedList = useMemo(() => {
    if (!list.length) return []
    const k = sortKey
    const mult = sortAsc ? 1 : -1
    return [...list].sort((a, b) => {
      const va = a[k]
      const vb = b[k]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'string' && typeof vb === 'string') {
        return mult * va.localeCompare(vb)
      }
      const numA = Number(va)
      const numB = Number(vb)
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
        return mult * (numA - numB)
      }
      return 0
    })
  }, [list, sortKey, sortAsc])

  const formatPct = (val) => (val != null ? `${Number(val)}%` : '-')
  const formatKrw = (val) => {
    if (val == null) return '-'
    const n = Number(val)
    if (n >= 10000) return `${(n / 10000).toFixed(1)}만원`
    return `${n.toLocaleString()}원`
  }

  if (loading) {
    return (
      <div className="fee-rebate-page">
        <Navbar />
        <div className="fee-rebate-loading">
          <div className="loading-spinner"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fee-rebate-page">
        <Navbar />
        <div className="fee-rebate-error">
          <p>{error}</p>
          <Button type="button" variant="primary" onClick={loadData}>
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fee-rebate-page">
      <Navbar />
      <div className="fee-rebate-container">
        <header className="fee-rebate-header">
          <h1 className="fee-rebate-title">거래소 수수료 환급(페이백) 비교</h1>
          <p className="fee-rebate-subtitle">
            각 거래소의 페이백률, 거래 할인율, 지정가/시장가 수수료, 1인 평균 페이백 등을 비교할 수 있습니다. 컬럼 헤더를 클릭하면 정렬됩니다.
          </p>
        </header>

        <section className="fee-rebate-section">
          <div className="section-header-row">
            <h2 className="section-title">비교 테이블</h2>
          </div>

          {sortedList.length === 0 ? (
            <div className="empty-state">
              <p>등록된 거래소 수수료 환급 정보가 없습니다.</p>
              <p className="empty-state-hint">관리자가 데이터를 등록하거나 크롤링 후 표시됩니다.</p>
            </div>
          ) : (
            <div className="fee-rebate-table-wrapper">
              <table className="fee-rebate-table">
                <thead>
                  <tr>
                    <th
                      className={sortKey === SORT_KEYS.exchange_name ? 'sorted' : ''}
                      onClick={() => handleSort(SORT_KEYS.exchange_name)}
                    >
                      거래소
                      {sortKey === SORT_KEYS.exchange_name && (sortAsc ? ' ↑' : ' ↓')}
                    </th>
                    <th
                      className={sortKey === SORT_KEYS.rebate_pct ? 'sorted' : ''}
                      onClick={() => handleSort(SORT_KEYS.rebate_pct)}
                    >
                      페이백률
                      {sortKey === SORT_KEYS.rebate_pct && (sortAsc ? ' ↑' : ' ↓')}
                    </th>
                    <th
                      className={sortKey === SORT_KEYS.trading_discount_pct ? 'sorted' : ''}
                      onClick={() => handleSort(SORT_KEYS.trading_discount_pct)}
                    >
                      거래 할인율
                      {sortKey === SORT_KEYS.trading_discount_pct && (sortAsc ? ' ↑' : ' ↓')}
                    </th>
                    <th
                      className={sortKey === SORT_KEYS.limit_order_fee_pct ? 'sorted' : ''}
                      onClick={() => handleSort(SORT_KEYS.limit_order_fee_pct)}
                    >
                      지정가 수수료
                      {sortKey === SORT_KEYS.limit_order_fee_pct && (sortAsc ? ' ↑' : ' ↓')}
                    </th>
                    <th
                      className={sortKey === SORT_KEYS.market_order_fee_pct ? 'sorted' : ''}
                      onClick={() => handleSort(SORT_KEYS.market_order_fee_pct)}
                    >
                      시장가 수수료
                      {sortKey === SORT_KEYS.market_order_fee_pct && (sortAsc ? ' ↑' : ' ↓')}
                    </th>
                    <th
                      className={sortKey === SORT_KEYS.avg_payback_krw ? 'sorted' : ''}
                      onClick={() => handleSort(SORT_KEYS.avg_payback_krw)}
                    >
                      1인 평균 페이백
                      {sortKey === SORT_KEYS.avg_payback_krw && (sortAsc ? ' ↑' : ' ↓')}
                    </th>
                    <th>태그</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedList.map((row) => (
                    <tr key={row.id}>
                      <td className="exchange-name">{row.exchange_name}</td>
                      <td>{formatPct(row.rebate_pct)}</td>
                      <td>{formatPct(row.trading_discount_pct)}</td>
                      <td>{formatPct(row.limit_order_fee_pct)}</td>
                      <td>{formatPct(row.market_order_fee_pct)}</td>
                      <td>{formatKrw(row.avg_payback_krw)}</td>
                      <td className="tags-cell">
                        {Array.isArray(row.tags) && row.tags.length > 0
                          ? row.tags.map((tag, i) => (
                              <span key={i} className="tag-badge">
                                {tag}
                              </span>
                            ))
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default FeeRebateComparisonPage
