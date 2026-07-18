import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import AlertStrategyFormModal from '../components/dashboard/AlertStrategyFormModal'
import { dashboardAPI } from '../services/dashboardAPI'
import './AlertStrategyPage.css'

const STATUS_LABELS = {
  RECEIVED: '수신',
  ACCEPTED: '수락',
  REJECTED: '거부',
  EXECUTING: '실행중',
  COMPLETED: '완료',
  FAILED: '실패',
}

const AlertStrategyPage = () => {
  const [accounts, setAccounts] = useState([])
  const [strategies, setStrategies] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterAccountId, setFilterAccountId] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [accountsData, strategiesData, eventsData] = await Promise.all([
        dashboardAPI.getAccounts(),
        dashboardAPI.getAlertStrategies(),
        dashboardAPI.getAlertEvents(),
      ])
      setAccounts(accountsData.results || accountsData || [])
      setStrategies(strategiesData.results || strategiesData || [])
      setEvents(eventsData.results || eventsData || [])
    } catch (err) {
      console.error('Alert strategy load error:', err)
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

  const filteredStrategies = filterAccountId
    ? strategies.filter((s) => String(s.account?.id ?? s.account_id) === String(filterAccountId))
    : strategies

  const handleCopyWebhook = async (strategy) => {
    const url = strategy.webhook_url
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(strategy.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      window.prompt('웹훅 URL을 복사하세요:', url)
    }
  }

  const handleRegenerateToken = async (strategy) => {
    if (!window.confirm('웹훅 토큰을 재발급하면 기존 TradingView Alert URL을 바꿔야 합니다. 계속할까요?')) {
      return
    }
    try {
      await dashboardAPI.regenerateAlertStrategyToken(strategy.id)
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || '토큰 재발급에 실패했습니다.')
    }
  }

  const handleDelete = async (strategy) => {
    if (!window.confirm(`"${strategy.name}" 전략을 삭제하시겠습니까?`)) return
    try {
      await dashboardAPI.deleteAlertStrategy(strategy.id)
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || '삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="alert-strategy-page">
        <Navbar />
        <div className="alert-strategy-loading">
          <div className="loading-spinner" />
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert-strategy-page">
        <Navbar />
        <div className="alert-strategy-error">
          <p>{error}</p>
          <button type="button" onClick={loadData} className="retry-button">
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="alert-strategy-page">
      <Navbar />
      <div className="alert-strategy-container">
        <div className="alert-strategy-header">
          <h1 className="alert-strategy-title">TradingView 알림 전략</h1>
          <p className="alert-strategy-subtitle">
            TradingView Alert webhook을 받아 고정 시드 비율로 매수/매도하고, 보유 비중을 검사한 뒤 분할 실행합니다.
          </p>
          <div className="alert-strategy-hint">
            <strong>Alert 메시지 예시</strong>
            <pre>{`{"ticker":"{{ticker}}","action":"BUY","price":"{{close}}","secret":"your-passphrase","alert_id":"{{timenow}}"}`}</pre>
          </div>
        </div>

        <section className="alert-strategy-section">
          <div className="section-header-row">
            <h2 className="section-title">전략 목록</h2>
            <div className="section-header-actions">
              {accounts.length > 0 && (
                <select
                  value={filterAccountId}
                  onChange={(e) => setFilterAccountId(e.target.value)}
                  className="filter-account-select"
                >
                  <option value="">전체 계좌</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {getAccountName(acc)}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className="btn-add-plan"
                onClick={() => {
                  setEditing(null)
                  setModalOpen(true)
                }}
                disabled={accounts.length === 0}
              >
                + 전략 추가
              </button>
            </div>
          </div>

          {accounts.length === 0 ? (
            <div className="empty-state">
              <p>등록된 계좌가 없습니다. 대시보드에서 계좌를 먼저 등록해 주세요.</p>
            </div>
          ) : filteredStrategies.length === 0 ? (
            <div className="empty-state">
              <p>등록된 알림 전략이 없습니다.</p>
            </div>
          ) : (
            <div className="plans-table-wrapper">
              <table className="plans-table">
                <thead>
                  <tr>
                    <th>전략명</th>
                    <th>계좌</th>
                    <th>시드</th>
                    <th>매수/매도 %</th>
                    <th>최대비중</th>
                    <th>분할</th>
                    <th>활성</th>
                    <th>웹훅</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStrategies.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{getAccountName(s.account)}</td>
                      <td>
                        {Number(s.seed_amount).toLocaleString()} {s.seed_currency}
                      </td>
                      <td>
                        {s.buy_seed_percent}% / {s.sell_seed_percent}%
                      </td>
                      <td>{s.max_position_weight_percent}%</td>
                      <td>
                        {s.split_count}회 / {s.split_interval_seconds}초
                      </td>
                      <td>
                        <span className={`badge ${s.enabled ? 'badge-on' : 'badge-off'}`}>
                          {s.enabled ? 'ON' : 'OFF'}
                        </span>
                      </td>
                      <td className="webhook-cell">
                        <button type="button" className="btn-link" onClick={() => handleCopyWebhook(s)}>
                          {copiedId === s.id ? '복사됨' : 'URL 복사'}
                        </button>
                        <button type="button" className="btn-link muted" onClick={() => handleRegenerateToken(s)}>
                          토큰 재발급
                        </button>
                      </td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => {
                            setEditing(s)
                            setModalOpen(true)
                          }}
                        >
                          수정
                        </button>
                        <button type="button" className="btn-link danger" onClick={() => handleDelete(s)}>
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

        <section className="alert-strategy-section">
          <div className="section-header-row">
            <h2 className="section-title">최근 알림 이력</h2>
            <button type="button" className="btn-refresh" onClick={loadData}>
              새로고침
            </button>
          </div>
          {events.length === 0 ? (
            <div className="empty-state">
              <p>수신된 알림이 없습니다.</p>
            </div>
          ) : (
            <div className="plans-table-wrapper">
              <table className="plans-table">
                <thead>
                  <tr>
                    <th>시각</th>
                    <th>전략</th>
                    <th>티커</th>
                    <th>액션</th>
                    <th>상태</th>
                    <th>사유 / 계획</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 50).map((ev) => (
                    <tr key={ev.id}>
                      <td>{new Date(ev.received_at).toLocaleString()}</td>
                      <td>{ev.strategy_name || ev.strategy}</td>
                      <td>{ev.ticker || '-'}</td>
                      <td>{ev.action || '-'}</td>
                      <td>
                        <span className={`status-pill status-${(ev.status || '').toLowerCase()}`}>
                          {STATUS_LABELS[ev.status] || ev.status}
                        </span>
                      </td>
                      <td className="reason-cell">
                        {ev.reject_reason ||
                          (ev.trade_plan
                            ? `Plan #${ev.trade_plan.id} (${ev.trade_plan.legs_done}/${ev.trade_plan.split_count})`
                            : '-')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <AlertStrategyFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSuccess={loadData}
        strategy={editing}
        accounts={accounts}
      />
    </div>
  )
}

export default AlertStrategyPage
