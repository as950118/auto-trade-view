import { useState, useEffect, useCallback } from 'react'
import { dashboardAPI } from '../../services/dashboardAPI'
import { isAccountCompatibleWithSymbol } from '../../utils/portfolio'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import './TargetAllocationPlanFormModal.css'

const ORDER_TYPES = [
  { value: 'MARKET', label: '시장가' },
  { value: 'LIMIT', label: '지정가' },
]

const TargetAllocationPlanFormModal = ({ isOpen, onClose, onSuccess, plan = null, accounts = [] }) => {
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [symbolSearch, setSymbolSearch] = useState('')
  const [symbolResults, setSymbolResults] = useState([])
  const [symbolSearching, setSymbolSearching] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [targetRatioPercent, setTargetRatioPercent] = useState('')
  const [totalDays, setTotalDays] = useState('')
  const [numTrades, setNumTrades] = useState('')
  const [orderType, setOrderType] = useState('MARKET')
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedAccount = accounts.find((a) => Number(a.id) === Number(selectedAccountId))
  const selectedBrokerId = selectedAccount?.broker?.id ?? selectedAccount?.broker_id

  const searchSymbols = useCallback(async (query, account) => {
    const brokerId = account?.broker?.id ?? account?.broker_id
    if (!brokerId) {
      setSymbolResults([])
      return
    }
    if (!query || query.trim().length < 1) {
      setSymbolResults([])
      return
    }
    setSymbolSearching(true)
    try {
      const data = await dashboardAPI.getSymbols({
        search: query.trim(),
        broker: brokerId,
        is_delisted: false,
        limit: 20,
      })
      const list = data.results || data
      // PRD-0003 AC-3: 서버 필터(broker)에 더해 선택 계좌 자산군과 다른 종목은 한 번 더 제외한다.
      const filtered = (Array.isArray(list) ? list : []).filter((sym) =>
        isAccountCompatibleWithSymbol(account, sym)
      )
      setSymbolResults(filtered)
    } catch (err) {
      setSymbolResults([])
    } finally {
      setSymbolSearching(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedBrokerId) return
    const t = setTimeout(() => searchSymbols(symbolSearch, selectedAccount), 300)
    return () => clearTimeout(t)
  }, [symbolSearch, selectedBrokerId, selectedAccount, searchSymbols])

  useEffect(() => {
    if (!isOpen) return
    if (plan) {
      setSelectedAccountId(plan.account?.id ?? plan.account_id)
      setSelectedSymbol(plan.symbol ? { id: plan.symbol.id, ticker: plan.symbol.ticker, name: plan.symbol.name, currency: plan.symbol.currency } : null)
      setTargetRatioPercent(plan.target_ratio != null ? String(Number(plan.target_ratio) * 100) : '')
      setTotalDays(plan.total_days != null ? String(plan.total_days) : '')
      setNumTrades(plan.num_trades != null ? String(plan.num_trades) : '')
      setOrderType(plan.order_type || 'MARKET')
      setEnabled(plan.enabled !== false)
      setSymbolSearch('')
    } else {
      setSelectedAccountId(accounts.length > 0 ? accounts[0].id : null)
      setSelectedSymbol(null)
      setTargetRatioPercent('')
      setTotalDays('')
      setNumTrades('')
      setOrderType('MARKET')
      setEnabled(true)
      setSymbolSearch('')
    }
    setError('')
  }, [isOpen, plan, accounts])

  const handleAccountChange = (accountId) => {
    setSelectedAccountId(accountId ? Number(accountId) : null)
    if (!plan) {
      setSelectedSymbol(null)
      setSymbolSearch('')
      setSymbolResults([])
    }
  }

  const getAccountName = (acc) => {
    return acc.broker?.name ? `${acc.broker.name} (${acc.account_number || '-'})` : `계좌 ${acc.id}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const ratio = parseFloat(targetRatioPercent)
      if (isNaN(ratio) || ratio <= 0 || ratio > 100) {
        setError('목표 비율은 0 초과 100 이하여야 합니다. (예: 20 = 20%)')
        setLoading(false)
        return
      }
      const days = parseInt(totalDays, 10)
      if (isNaN(days) || days < 1) {
        setError('총 일수는 1 이상이어야 합니다.')
        setLoading(false)
        return
      }
      const trades = parseInt(numTrades, 10)
      if (isNaN(trades) || trades < 1) {
        setError('분할 횟수는 1 이상이어야 합니다.')
        setLoading(false)
        return
      }
      if (!selectedAccountId || !selectedSymbol?.id) {
        setError('계좌와 종목을 선택해 주세요.')
        setLoading(false)
        return
      }

      if (plan) {
        const updatePayload = {
          target_ratio: ratio / 100,
          total_days: days,
          num_trades: trades,
          order_type: orderType,
          enabled,
        }
        await dashboardAPI.updateTargetAllocationPlan(plan.id, updatePayload)
      } else {
        const createPayload = {
          account_id: selectedAccountId,
          symbol_id: selectedSymbol.id,
          target_ratio: ratio / 100,
          total_days: days,
          num_trades: trades,
          order_type: orderType,
          enabled,
        }
        await dashboardAPI.createTargetAllocationPlan(createPayload)
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      const msg =
        err.response?.data?.target_ratio ||
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : null) ||
        err.message ||
        '저장에 실패했습니다.'
      setError(typeof msg === 'string' ? msg : msg)
    } finally {
      setLoading(false)
    }
  }

  const selectSymbol = (sym) => {
    setSelectedSymbol(sym)
    setSymbolSearch('')
    setSymbolResults([])
  }

  const clearSymbol = () => {
    setSelectedSymbol(null)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={plan ? '목표 비율 계획 수정' : '목표 비율 자동매매 추가'}
      size="md"
    >
        <p className="target-allocation-desc">
          총 자산(현물+예수금) 대비 이 종목이 차지할 비율을 목표로, 지정한 일수 동안 지정한 횟수만큼 나눠서 매수/매도합니다.
        </p>

        <form onSubmit={handleSubmit} className="target-allocation-form">
          {error && <div className="ui-modal-error">{error}</div>}

          <div className="form-group">
            <label>계좌</label>
            <select
              value={selectedAccountId ?? ''}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="form-select"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {getAccountName(acc)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>종목</label>
            {!selectedAccountId ? (
              <div className="symbol-placeholder">계좌를 먼저 선택하세요.</div>
            ) : selectedSymbol ? (
              <div className="selected-symbol-row">
                <div className="selected-symbol-display">
                  {selectedSymbol.ticker} {selectedSymbol.name && `· ${selectedSymbol.name}`}
                </div>
                {!plan && (
                  <button type="button" className="btn-clear-symbol-inline" onClick={clearSymbol} aria-label="종목 변경">
                    변경
                  </button>
                )}
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="티커 또는 종목명 검색"
                  value={symbolSearch}
                  onChange={(e) => setSymbolSearch(e.target.value)}
                  className="form-input"
                  autoComplete="off"
                />
                {symbolSearching && <div className="symbol-search-loading">검색 중...</div>}
                {!symbolSearching && symbolResults.length > 0 && (
                  <ul className="symbol-results-list">
                    {symbolResults.map((sym) => (
                      <li key={sym.id}>
                        <button
                          type="button"
                          className="symbol-result-item"
                          onClick={() => selectSymbol(sym)}
                        >
                          <span className="symbol-result-ticker">{sym.ticker}</span>
                          {sym.name && <span className="symbol-result-name">{sym.name}</span>}
                          {sym.currency && <span className="symbol-result-currency">{sym.currency}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>목표 비율 (%)</label>
              <input
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                placeholder="20"
                value={targetRatioPercent}
                onChange={(e) => setTargetRatioPercent(e.target.value)}
                className="form-input"
              />
              <span className="form-hint">총 자산 대비 이 종목 목표 비율 (예: 20 = 20%)</span>
            </div>
            <div className="form-group">
              <label>주문 타입</label>
              <div className="order-type-tabs">
                {ORDER_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`order-type-tab ${orderType === t.value ? 'active' : ''}`}
                    onClick={() => setOrderType(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>총 일수</label>
              <input
                type="number"
                min="1"
                placeholder="5"
                value={totalDays}
                onChange={(e) => setTotalDays(e.target.value)}
                className="form-input"
              />
              <span className="form-hint">몇 일에 걸쳐 매매할지</span>
            </div>
            <div className="form-group">
              <label>분할 횟수</label>
              <input
                type="number"
                min="1"
                placeholder="10"
                value={numTrades}
                onChange={(e) => setNumTrades(e.target.value)}
                className="form-input"
              />
              <span className="form-hint">몇 번에 나눠서 매매할지</span>
            </div>
          </div>

          <div className="form-group form-group-checkbox">
            <label>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span>활성화 (스케줄러가 주기적으로 주문 생성)</span>
            </label>
          </div>

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? '저장 중...' : plan ? '수정' : '추가'}
            </Button>
          </div>
        </form>
    </Modal>
  )
}

export default TargetAllocationPlanFormModal
