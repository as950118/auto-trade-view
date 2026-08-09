import { useState, useEffect, useCallback } from 'react'
import { dashboardAPI } from '../../services/dashboardAPI'
import './BuyOrderModal.css'

const QUANTITY_TYPES = [
  { value: 'MAX', label: '전량', shortLabel: '전량' },
  { value: 'PERCENT', label: '비율(%)', shortLabel: null },
  { value: 'EXACT', label: '직접 수량', shortLabel: null },
  { value: 'AMOUNT', label: '금액', shortLabel: null },
]

const ORDER_TYPES = [
  { value: 'MARKET', label: '시장가' },
  { value: 'LIMIT', label: '지정가' },
]

const PERCENT_QUICK = [10, 25, 50, 75, 100]

const BuyOrderModal = ({ isOpen, onClose, onSuccess, accounts }) => {
  const [symbolSearch, setSymbolSearch] = useState('')
  const [symbolResults, setSymbolResults] = useState([])
  const [symbolSearching, setSymbolSearching] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [quantityType, setQuantityType] = useState('MAX')
  const [quantityValue, setQuantityValue] = useState('')
  const [quantityExact, setQuantityExact] = useState('')
  const [orderType, setOrderType] = useState('MARKET')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currencyDisplay = selectedSymbol?.currency || 'KRW'

  // 매수 가능한 계좌만 (buy_enabled)
  const availableAccounts = (accounts || []).filter((acc) => acc.buy_enabled !== false)
  const selectedAccount = availableAccounts.find((acc) => Number(acc.id) === Number(selectedAccountId))
  const selectedBrokerId = selectedAccount?.broker?.id ?? selectedAccount?.broker_id

  const searchSymbols = useCallback(async (query, brokerId) => {
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
        broker_id: brokerId,
        is_delisted: false,
        limit: 20,
      })
      const list = data.results || data
      setSymbolResults(Array.isArray(list) ? list : [])
    } catch (err) {
      setSymbolResults([])
    } finally {
      setSymbolSearching(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedBrokerId) return
    const t = setTimeout(() => searchSymbols(symbolSearch, selectedBrokerId), 300)
    return () => clearTimeout(t)
  }, [symbolSearch, selectedBrokerId, searchSymbols])

  useEffect(() => {
    if (isOpen && availableAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(availableAccounts[0].id)
    }
  }, [isOpen, availableAccounts, selectedAccountId])

  useEffect(() => {
    if (!isOpen) return
    setSymbolSearch('')
    setSymbolResults([])
    setSelectedSymbol(null)
    setSelectedAccountId(availableAccounts.length > 0 ? availableAccounts[0].id : null)
    setQuantityType('MAX')
    setQuantityValue('')
    setQuantityExact('')
    setOrderType('MARKET')
    setPrice('')
    setError('')
  }, [isOpen])

  const handleAccountChange = (accountId) => {
    setSelectedAccountId(accountId ? Number(accountId) : null)
    setSelectedSymbol(null)
    setSymbolSearch('')
    setSymbolResults([])
  }

  const getAccountName = (acc) => {
    return acc.broker?.name ? `${acc.broker.name} (${acc.account_number || '-'})` : `계좌 ${acc.id}`
  }

  const buildPayload = () => {
    const payload = {
      account_id: selectedAccountId,
      symbol_id: selectedSymbol.id,
      side: 'BUY',
      order_type: orderType,
    }

    if (orderType === 'LIMIT' && price) {
      payload.price = parseFloat(price)
    }
    // 시장가 + 전량/비율/금액 시 수량 계산용 예상가
    if (orderType === 'MARKET' && quantityType !== 'EXACT' && price) {
      payload.price = parseFloat(price)
    }

    switch (quantityType) {
      case 'MAX':
        payload.quantity_type = 'MAX'
        break
      case 'PERCENT':
        payload.quantity_type = 'PERCENT'
        payload.quantity_value = parseFloat(quantityValue) || 0
        break
      case 'EXACT':
        payload.quantity_type = 'EXACT'
        payload.quantity_value = parseFloat(quantityExact) || 0
        break
      case 'AMOUNT':
        payload.quantity_type = 'AMOUNT'
        payload.quantity_value = parseFloat(quantityValue) || 0
        break
      default:
        break
    }

    return payload
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!selectedSymbol) {
        setError('종목을 선택해 주세요.')
        setLoading(false)
        return
      }
      if (!selectedAccountId) {
        setError('계좌를 선택해 주세요.')
        setLoading(false)
        return
      }

      if (orderType === 'LIMIT' && (!price || parseFloat(price) <= 0)) {
        setError('지정가 주문은 가격을 입력해 주세요.')
        setLoading(false)
        return
      }

      const needsRefPrice = orderType === 'MARKET' && quantityType !== 'EXACT'
      if (needsRefPrice && (!price || parseFloat(price) <= 0)) {
        setError('시장가 매수에서 전량/비율/금액은 예상가를 입력해 주세요.')
        setLoading(false)
        return
      }

      if (quantityType === 'PERCENT') {
        const v = parseFloat(quantityValue)
        if (!v || v <= 0 || v > 100) {
          setError('비율은 0 초과 100 이하여야 합니다.')
          setLoading(false)
          return
        }
      }
      if (quantityType === 'EXACT') {
        const v = parseFloat(quantityExact)
        if (!v || v <= 0) {
          setError('수량을 입력해 주세요.')
          setLoading(false)
          return
        }
      }
      if (quantityType === 'AMOUNT') {
        const v = parseFloat(quantityValue)
        if (!v || v <= 0) {
          setError('금액을 입력해 주세요.')
          setLoading(false)
          return
        }
      }

      const payload = buildPayload()
      await dashboardAPI.createOrder(payload)
      onSuccess?.()
      onClose()
    } catch (err) {
      const msg =
        err.response?.data?.quantity ||
        err.response?.data?.quantity_value ||
        err.response?.data?.price ||
        (typeof err.response?.data === 'object' && err.response?.data?.detail
          ? err.response.data.detail
          : null) ||
        (Array.isArray(err.response?.data) ? err.response.data.join(', ') : null) ||
        err.message ||
        '주문 접수에 실패했습니다.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
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

  if (!isOpen) return null

  return (
    <div className="modal-overlay buy-modal-overlay" onClick={onClose}>
      <div className="modal-content buy-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">매수 주문</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        {selectedSymbol && (
          <div className="buy-symbol-info">
            <span className="buy-symbol-ticker">{selectedSymbol.ticker}</span>
            <span className="buy-symbol-name">{selectedSymbol.name || ''}</span>
            <span className="buy-symbol-currency">{currencyDisplay}</span>
            <button type="button" className="btn-clear-symbol" onClick={clearSymbol} aria-label="종목 변경">
              변경
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="buy-order-form">
          {error && <div className="modal-error">{error}</div>}

          <div className="form-group">
            <label>매수 계좌</label>
            <select
              value={selectedAccountId ?? ''}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="form-select"
            >
              {availableAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {getAccountName(acc)}
                </option>
              ))}
            </select>
            {selectedAccount && (
              <p className="form-hint">
                {selectedAccount.broker?.name} · {selectedAccount.broker?.is_crypto_exchange ? '암호화폐' : '주식'} 종목만 매수 가능합니다.
              </p>
            )}
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
                <button type="button" className="btn-clear-symbol-inline" onClick={clearSymbol} aria-label="종목 변경">
                  변경
                </button>
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

          <div className="form-group">
            <label>수량 지정</label>
            <div className="quantity-type-tabs">
              {QUANTITY_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`quantity-type-tab ${quantityType === t.value ? 'active' : ''}`}
                  onClick={() => setQuantityType(t.value)}
                >
                  {t.shortLabel || t.label}
                </button>
              ))}
            </div>

            {quantityType === 'PERCENT' && (
              <div className="quantity-value-group">
                <div className="percent-quick-buttons">
                  {PERCENT_QUICK.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`percent-btn ${parseFloat(quantityValue) === p ? 'active' : ''}`}
                      onClick={() => setQuantityValue(String(p))}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.1"
                  placeholder="비율 입력 (0~100)"
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                  className="form-input"
                />
              </div>
            )}

            {quantityType === 'EXACT' && (
              <input
                type="number"
                min="0"
                step="any"
                placeholder="매수 수량"
                value={quantityExact}
                onChange={(e) => setQuantityExact(e.target.value)}
                className="form-input"
              />
            )}

            {quantityType === 'AMOUNT' && (
              <div className="amount-input-wrap">
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="매수 금액"
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                  className="form-input"
                />
                <span className="amount-unit">{currencyDisplay}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>주문 유형</label>
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
            {orderType === 'LIMIT' && (
              <div className="price-input-wrap">
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="지정가"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="form-input"
                />
                <span className="price-unit">{currencyDisplay}</span>
              </div>
            )}
            {orderType === 'MARKET' && quantityType !== 'EXACT' && (
              <div className="price-input-wrap">
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="예상가 (수량 계산용)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="form-input"
                />
                <span className="price-unit">{currencyDisplay}</span>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-buy" disabled={loading || !selectedSymbol}>
              {loading ? '접수 중...' : '매수 주문'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BuyOrderModal
