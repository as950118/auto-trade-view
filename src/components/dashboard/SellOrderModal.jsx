import { useState, useEffect } from 'react'
import { dashboardAPI } from '../../services/dashboardAPI'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import './SellOrderModal.css'

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

const SellOrderModal = ({ isOpen, onClose, onSuccess, holdingGroup, accounts, currency }) => {
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [quantityType, setQuantityType] = useState('MAX')
  const [quantityValue, setQuantityValue] = useState('')
  const [quantityExact, setQuantityExact] = useState('')
  const [orderType, setOrderType] = useState('MARKET')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const symbol = holdingGroup?.symbol
  const holdingsList = holdingGroup?.holdings ?? []
  const currencyDisplay = currency || symbol?.currency || 'KRW'

  // 해당 종목을 보유한 계좌만
  const availableAccounts = accounts.filter((acc) =>
    holdingsList.some((h) => String(h.account?.id ?? h.account) === String(acc.id))
  )

  // 선택된 계좌의 보유 정보
  const selectedHolding = selectedAccountId
    ? holdingsList.find((h) => String(h.account?.id ?? h.account) === String(selectedAccountId))
    : null
  const availableQuantity = selectedHolding ? parseFloat(selectedHolding.quantity || 0) : 0
  const currentPrice = selectedHolding ? parseFloat(selectedHolding.current_price || 0) : 0

  useEffect(() => {
    if (isOpen && availableAccounts.length > 0) {
      const firstId = availableAccounts[0].id
      setSelectedAccountId(firstId)
    } else {
      setSelectedAccountId(null)
    }
  }, [isOpen, availableAccounts])

  useEffect(() => {
    if (!isOpen) return
    setQuantityType('MAX')
    setQuantityValue('')
    setQuantityExact('')
    setOrderType('MARKET')
    setPrice('')
    setError('')
  }, [isOpen])

  const getAccountName = (acc) => {
    return acc.broker?.name ? `${acc.broker.name} (${acc.account_number || '-'})` : `계좌 ${acc.id}`
  }

  const buildPayload = () => {
    const payload = {
      account_id: selectedAccountId,
      symbol_id: symbol.id,
      side: 'SELL',
      order_type: orderType,
    }

    if (orderType === 'LIMIT' && price) {
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
      if (orderType === 'LIMIT' && (!price || parseFloat(price) <= 0)) {
        setError('지정가 주문은 가격을 입력해 주세요.')
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
        if (v > availableQuantity) {
          setError(`보유 수량(${availableQuantity})을 초과할 수 없습니다.`)
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="매도 주문" size="sm">
        {symbol && (
          <div className="sell-symbol-info">
            <span className="sell-symbol-ticker">{symbol.ticker}</span>
            <span className="sell-symbol-name">{symbol.name || ''}</span>
            <span className="sell-available-qty">
              보유 수량: <strong>{availableQuantity.toLocaleString('ko-KR', { maximumFractionDigits: 8 })}</strong>
              {currentPrice > 0 && (
                <> · 현재가: {currentPrice.toLocaleString('ko-KR', { maximumFractionDigits: 2 })} {currencyDisplay}</>
              )}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="sell-order-form">
          {error && <div className="ui-modal-error">{error}</div>}

          <div className="form-group">
            <label>매도 계좌</label>
            <select
              value={selectedAccountId ?? ''}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              className="form-select"
            >
              {availableAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {getAccountName(acc)}
                </option>
              ))}
            </select>
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
                placeholder="매도 수량"
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
                  placeholder="매도 금액"
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
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" size="lg" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" variant="sell" size="lg" disabled={loading}>
              {loading ? '접수 중...' : '매도 주문'}
            </Button>
          </div>
        </form>
    </Modal>
  )
}

export default SellOrderModal
