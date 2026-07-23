import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
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
  const { user } = useAuth()
  const isStaff = !!(user?.is_staff || user?.isStaff)
  const [accounts, setAccounts] = useState([])
  const [strategies, setStrategies] = useState([])
  const [links, setLinks] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [strategyModalOpen, setStrategyModalOpen] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState(null)
  const [editingLink, setEditingLink] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [accountsData, strategiesData, linksData, eventsData] = await Promise.all([
        dashboardAPI.getAccounts(),
        dashboardAPI.getStrategies(),
        dashboardAPI.getStrategyLinks(),
        dashboardAPI.getAlertEvents(),
      ])
      setAccounts(accountsData.results || accountsData || [])
      setStrategies(strategiesData.results || strategiesData || [])
      setLinks(linksData.results || linksData || [])
      setEvents(eventsData.results || eventsData || [])
    } catch (err) {
      console.error('Strategy page load error:', err)
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
      await dashboardAPI.regenerateStrategyToken(strategy.id)
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || '토큰 재발급에 실패했습니다.')
    }
  }

  const handleDeleteStrategy = async (strategy) => {
    if (!window.confirm(`"${strategy.title}" 전략을 삭제하시겠습니까?`)) return
    try {
      await dashboardAPI.deleteStrategy(strategy.id)
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || '삭제에 실패했습니다.')
    }
  }

  const handleDeleteLink = async (link) => {
    if (!window.confirm('이 연동을 삭제하시겠습니까?')) return
    try {
      await dashboardAPI.deleteStrategyLink(link.id)
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
          <button type="button" onClick={loadData} className="retry-button">다시 시도</button>
        </div>
      </div>
    )
  }

  return (
    <div className="alert-strategy-page">
      <Navbar />
      <div className="alert-strategy-container">
        <div className="alert-strategy-header">
          <h1 className="alert-strategy-title">TradingView 전략 / 연동</h1>
          <p className="alert-strategy-subtitle">
            전략 템플릿에 webhook을 연결하고, 계좌를 연동해 시드·비중·분할을 설정합니다.
            {/* 향후: 공개 전략 연동 시 제작자 수수료 — backend trading/strategy_fees.py */}
          </p>
          <div className="alert-strategy-hint">
            <strong>Alert 메시지 예시</strong>
            <pre>{`{"ticker":"{{ticker}}","action":"BUY","price":"{{close}}","secret":"your-passphrase","alert_id":"{{timenow}}"}`}</pre>
          </div>
        </div>

        <section className="alert-strategy-section">
          <div className="section-header-row">
            <h2 className="section-title">전략</h2>
            <button
              type="button"
              className="btn-add-plan"
              onClick={() => {
                setEditingStrategy(null)
                setStrategyModalOpen(true)
              }}
            >
              + 전략 추가
            </button>
          </div>
          {strategies.length === 0 ? (
            <div className="empty-state"><p>등록된 전략이 없습니다.</p></div>
          ) : (
            <div className="plans-table-wrapper">
              <table className="plans-table">
                <thead>
                  <tr>
                    <th>제목</th>
                    <th>공개</th>
                    <th>매매당비중</th>
                    <th>최대비중</th>
                    <th>분할</th>
                    <th>활성</th>
                    <th>웹훅</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {strategies.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div>{s.title}</div>
                        {s.description && <div className="muted-text">{s.description}</div>}
                      </td>
                      <td>{s.visibility === 'PUBLIC' ? '공개' : '비공개'}</td>
                      <td>{s.default_trade_percent}%</td>
                      <td>{s.default_max_position_weight_percent}%</td>
                      <td>
                        {s.default_split_count}회 / {s.default_split_interval_seconds}초
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
                        {(s.owner === user?.id || s.owner_username === user?.username || isStaff) && (
                          <button type="button" className="btn-link muted" onClick={() => handleRegenerateToken(s)}>
                            토큰 재발급
                          </button>
                        )}
                      </td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => {
                            setEditingStrategy(s)
                            setStrategyModalOpen(true)
                          }}
                        >
                          수정
                        </button>
                        <button type="button" className="btn-link danger" onClick={() => handleDeleteStrategy(s)}>
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
            <h2 className="section-title">내 연동</h2>
            <button
              type="button"
              className="btn-add-plan"
              onClick={() => {
                setEditingLink(null)
                setLinkModalOpen(true)
              }}
              disabled={accounts.length === 0 || strategies.length === 0}
            >
              + 연동 추가
            </button>
          </div>
          {links.length === 0 ? (
            <div className="empty-state"><p>연동된 전략이 없습니다.</p></div>
          ) : (
            <div className="plans-table-wrapper">
              <table className="plans-table">
                <thead>
                  <tr>
                    <th>전략</th>
                    <th>계좌</th>
                    <th>시드</th>
                    <th>유효 매매당비중</th>
                    <th>유효 최대비중</th>
                    <th>유효 분할</th>
                    <th>활성</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((l) => (
                    <tr key={l.id}>
                      <td>{l.strategy?.title || l.strategy_id}</td>
                      <td>{getAccountName(l.account)}</td>
                      <td>
                        {Number(l.seed_amount).toLocaleString()} {l.seed_currency}
                      </td>
                      <td>{l.effective_trade_percent}%</td>
                      <td>{l.effective_max_position_weight_percent}%</td>
                      <td>
                        {l.effective_split_count}회 / {l.effective_split_interval_seconds}초
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

        <section className="alert-strategy-section">
          <div className="section-header-row">
            <h2 className="section-title">최근 알림 이력</h2>
            <button type="button" className="btn-refresh" onClick={loadData}>새로고침</button>
          </div>
          {events.length === 0 ? (
            <div className="empty-state"><p>수신된 알림이 없습니다.</p></div>
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
                      <td>{ev.strategy_title || ev.strategy}</td>
                      <td>{ev.ticker || '-'}</td>
                      <td>{ev.action || '-'}</td>
                      <td>
                        <span className={`status-pill status-${(ev.status || '').toLowerCase()}`}>
                          {STATUS_LABELS[ev.status] || ev.status}
                        </span>
                      </td>
                      <td className="reason-cell">
                        {ev.reject_reason ||
                          (ev.trade_plans?.length
                            ? `Plans: ${ev.trade_plans.length}`
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
        isOpen={strategyModalOpen}
        mode="strategy"
        onClose={() => {
          setStrategyModalOpen(false)
          setEditingStrategy(null)
        }}
        onSuccess={loadData}
        strategy={editingStrategy}
        isStaff={isStaff}
      />
      <AlertStrategyFormModal
        isOpen={linkModalOpen}
        mode="link"
        onClose={() => {
          setLinkModalOpen(false)
          setEditingLink(null)
        }}
        onSuccess={loadData}
        link={editingLink}
        accounts={accounts}
        strategies={strategies}
      />
    </div>
  )
}

export default AlertStrategyPage
