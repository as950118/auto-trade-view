import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import TargetAllocationPlanFormModal from '../components/dashboard/TargetAllocationPlanFormModal'
import { dashboardAPI } from '../services/dashboardAPI'
import './TargetAllocationPage.css'

const TargetAllocationPage = () => {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [filterAccountId, setFilterAccountId] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [accountsData, plansData] = await Promise.all([
        dashboardAPI.getAccounts(),
        dashboardAPI.getTargetAllocationPlans(),
      ])
      setAccounts(accountsData.results || accountsData || [])
      setPlans(plansData.results || plansData || [])
    } catch (err) {
      console.error('Target allocation data load error:', err)
      setError(err.response?.data?.detail || '데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = () => {
    setEditingPlan(null)
    setModalOpen(true)
  }

  const handleEdit = (plan) => {
    setEditingPlan(plan)
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    loadData()
    setModalOpen(false)
    setEditingPlan(null)
  }

  const handleDelete = async (plan) => {
    if (!window.confirm(`"${plan.symbol?.ticker || plan.symbol_id}" 목표 비율 계획을 삭제하시겠습니까?`)) {
      return
    }
    try {
      await dashboardAPI.deleteTargetAllocationPlan(plan.id)
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || '삭제에 실패했습니다.')
    }
  }

  const filteredPlans = filterAccountId
    ? plans.filter((p) => String(p.account?.id ?? p.account_id) === String(filterAccountId))
    : plans

  const getAccountName = (acc) => {
    if (!acc) return '-'
    return acc.broker?.name ? `${acc.broker.name} (${acc.account_number || '-'})` : `계좌 ${acc.id}`
  }

  if (loading) {
    return (
      <div className="target-allocation-page">
        <Navbar />
        <div className="target-allocation-loading">
          <div className="loading-spinner"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="target-allocation-page">
        <Navbar />
        <div className="target-allocation-error">
          <p>{error}</p>
          <button onClick={loadData} className="retry-button">
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="target-allocation-page">
      <Navbar />
      <div className="target-allocation-container">
        <div className="target-allocation-header">
          <h1 className="target-allocation-title">목표 비율 자동매매</h1>
          <p className="target-allocation-subtitle">
            총 자산(현물+예수금) 대비 특정 종목의 목표 비율을 설정하면, 지정한 일수·횟수에 맞춰 자동으로 분할 매수/매도합니다.
          </p>
        </div>

        <section className="target-allocation-section">
          <div className="section-header-row">
            <h2 className="section-title">계획 목록</h2>
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
              <button type="button" className="btn-add-plan" onClick={handleAdd} disabled={accounts.length === 0}>
                + 계획 추가
              </button>
            </div>
          </div>

          {accounts.length === 0 ? (
            <div className="empty-state">
              <p>등록된 계좌가 없습니다. 대시보드에서 계좌를 먼저 등록해 주세요.</p>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="empty-state">
              <p>등록된 목표 비율 계획이 없습니다.</p>
              <button type="button" className="btn-add-plan-inline" onClick={handleAdd}>
                첫 계획 추가하기
              </button>
            </div>
          ) : (
            <div className="plans-table-wrapper">
              <table className="plans-table">
                <thead>
                  <tr>
                    <th>계좌</th>
                    <th>종목</th>
                    <th>목표 비율</th>
                    <th>기간</th>
                    <th>진행</th>
                    <th>주문 타입</th>
                    <th>상태</th>
                    <th>시작/종료일</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map((plan) => (
                    <tr key={plan.id}>
                      <td>{getAccountName(plan.account)}</td>
                      <td>
                        <span className="symbol-ticker">{plan.symbol?.ticker || '-'}</span>
                        {plan.symbol?.name && (
                          <span className="symbol-name">{plan.symbol.name}</span>
                        )}
                      </td>
                      <td>{(Number(plan.target_ratio) * 100).toFixed(1)}%</td>
                      <td>{plan.total_days}일 / {plan.num_trades}회</td>
                      <td>
                        <span className="trades-done">{plan.trades_done} / {plan.num_trades}</span>
                      </td>
                      <td>{plan.order_type_display || (plan.order_type === 'MARKET' ? '시장가' : '지정가')}</td>
                      <td>
                        <span className={`status-badge ${plan.enabled ? 'status-active' : 'status-paused'}`}>
                          {plan.enabled ? '활성' : '일시중지'}
                        </span>
                      </td>
                      <td className="date-cell">
                        {plan.start_date && plan.end_date
                          ? `${plan.start_date} ~ ${plan.end_date}`
                          : '-'}
                      </td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="btn-action btn-edit"
                          onClick={() => handleEdit(plan)}
                          title="수정"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(plan)}
                          title="삭제"
                        >
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

        <TargetAllocationPlanFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setEditingPlan(null)
          }}
          onSuccess={handleModalSuccess}
          plan={editingPlan}
          accounts={accounts}
        />
      </div>
    </div>
  )
}

export default TargetAllocationPage
