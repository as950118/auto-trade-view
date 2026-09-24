import { useState, useEffect, useCallback, useMemo } from 'react'
import { dashboardAPI } from '../../services/dashboardAPI'
import { isAccountCompatibleWithSymbol } from '../../utils/portfolio'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import TextField from '../ui/TextField'
import TickerRow from '../ui/TickerRow'
import { SegmentedControl, FilterChips } from '../ui/Tabs'
import '../../styles/legacy-order-form.css'
import './OrderModal.css'

/**
 * 매수·매도 통합 주문 모달 (DS-0003 OrderPanel, TASK-0018 2단계).
 * 기존 BuyOrderModal / SellOrderModal의 수량 지정·주문 유형·검증·payload 규칙을 그대로 합치고,
 * 상단 토글로 방향을 바꾼다. 방향에 따라 틴트·제출 버튼 색·라벨이 함께 바뀐다.
 *
 * - 매수: 계좌 선택 → 종목 검색(계좌 거래소·자산군으로 필터). initialSymbol이 있으면 그 종목으로 시작한다.
 * - 매도: 종목을 보유한 계좌 중에서 고른다. 종목이 없으면 보유 종목 목록에서 고른다.
 */

const SIDES = [
  { value: 'BUY', label: '매수', tone: 'rise' },
  { value: 'SELL', label: '매도', tone: 'fall' },
]

const QUANTITY_TYPES = [
  { value: 'MAX', label: '전량' },
  { value: 'PERCENT', label: '비율(%)' },
  { value: 'EXACT', label: '직접 수량' },
  { value: 'AMOUNT', label: '금액' },
]

const ORDER_TYPES = [
  { value: 'MARKET', label: '시장가' },
  { value: 'LIMIT', label: '지정가' },
]

const PERCENT_QUICK = [10, 25, 50, 75, 100].map((p) => ({ value: String(p), label: `${p}%` }))

const accountIdOf = (holding) => String(holding.account?.id ?? holding.account)
const brokerIdOf = (obj) => obj?.broker?.id ?? obj?.broker_id
const getAccountName = (acc) =>
  acc.broker?.name ? `${acc.broker.name} (${acc.account_number || '-'})` : `계좌 ${acc.id}`
const formatNumber = (value, maxDigits = 8) =>
  Number(value || 0).toLocaleString('ko-KR', { maximumFractionDigits: maxDigits })

const OrderModal = ({
  isOpen,
  onClose,
  onSuccess,
  accounts = [],
  holdings = [],
  initialSide = 'BUY',
  initialSymbol = null,
  currency,
}) => {
  const [side, setSide] = useState(initialSide)
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol)
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [symbolSearch, setSymbolSearch] = useState('')
  const [symbolResults, setSymbolResults] = useState([])
  const [symbolSearching, setSymbolSearching] = useState(false)
  const [quantityType, setQuantityType] = useState('MAX')
  const [quantityValue, setQuantityValue] = useState('')
  const [quantityExact, setQuantityExact] = useState('')
  const [orderType, setOrderType] = useState('MARKET')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isBuy = side === 'BUY'
  const currencyDisplay = selectedSymbol?.currency || currency || 'KRW'

  // 보유 종목(종목 id 기준) 목록 — 매도 종목 선택과 보유 수량 확인에 쓴다
  const heldSymbols = useMemo(() => {
    const groups = new Map()
    holdings.forEach((h) => {
      if (!h.symbol || parseFloat(h.quantity || 0) <= 0) return
      const key = h.symbol.id
      if (!groups.has(key)) groups.set(key, { symbol: h.symbol, holdings: [], quantity: 0, cost: 0, profit: 0 })
      const g = groups.get(key)
      const qty = parseFloat(h.quantity || 0)
      g.holdings.push(h)
      g.quantity += qty
      g.cost += qty * parseFloat(h.average_price || 0)
      g.profit += parseFloat(h.profit_loss || 0)
    })
    return Array.from(groups.values())
  }, [holdings])

  const symbolHoldings = useMemo(
    () => (selectedSymbol ? heldSymbols.find((g) => g.symbol.id === selectedSymbol.id)?.holdings ?? [] : []),
    [heldSymbols, selectedSymbol]
  )

  // 방향별 주문 가능 계좌
  const sideAccounts = useMemo(() => {
    if (isBuy) {
      const enabled = accounts.filter((acc) => acc.buy_enabled !== false)
      if (!selectedSymbol) return enabled
      // 종목이 정해진 상태면 그 종목을 거래할 수 있는 계좌만 (거래소 일치 + 자산군 호환)
      return enabled.filter(
        (acc) => String(brokerIdOf(acc)) === String(brokerIdOf(selectedSymbol)) && isAccountCompatibleWithSymbol(acc, selectedSymbol)
      )
    }
    return accounts.filter((acc) => symbolHoldings.some((h) => accountIdOf(h) === String(acc.id)))
  }, [isBuy, accounts, selectedSymbol, symbolHoldings])

  const selectedAccount = sideAccounts.find((acc) => String(acc.id) === String(selectedAccountId))
  const selectedHolding = symbolHoldings.find((h) => accountIdOf(h) === String(selectedAccountId))
  const availableQuantity = selectedHolding ? parseFloat(selectedHolding.quantity || 0) : 0
  const currentPrice = selectedHolding ? parseFloat(selectedHolding.current_price || 0) : 0

  // 열릴 때 초기화
  useEffect(() => {
    if (!isOpen) return
    setSide(initialSide)
    setSelectedSymbol(initialSymbol)
    setSelectedAccountId(null)
    setSymbolSearch('')
    setSymbolResults([])
    setQuantityType('MAX')
    setQuantityValue('')
    setQuantityExact('')
    setOrderType('MARKET')
    setPrice('')
    setError('')
  }, [isOpen, initialSide, initialSymbol])

  // 선택 계좌가 현재 방향의 계좌 목록에 없으면 첫 계좌로 맞춘다
  useEffect(() => {
    if (!isOpen) return
    if (!sideAccounts.some((acc) => String(acc.id) === String(selectedAccountId))) {
      setSelectedAccountId(sideAccounts.length > 0 ? sideAccounts[0].id : null)
    }
  }, [isOpen, sideAccounts, selectedAccountId])

  const searchSymbols = useCallback(async (query, account) => {
    const brokerId = brokerIdOf(account)
    if (!brokerId || !query || query.trim().length < 1) {
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
      // PRD-0003 AC-4: 서버 필터(broker)에 더해 선택 계좌 자산군과 다른 종목은 한 번 더 제외한다.
      setSymbolResults((Array.isArray(list) ? list : []).filter((sym) => isAccountCompatibleWithSymbol(account, sym)))
    } catch (err) {
      setSymbolResults([])
    } finally {
      setSymbolSearching(false)
    }
  }, [])

  useEffect(() => {
    if (!isBuy || selectedSymbol || !selectedAccount) return undefined
    const t = setTimeout(() => searchSymbols(symbolSearch, selectedAccount), 300)
    return () => clearTimeout(t)
  }, [isBuy, selectedSymbol, symbolSearch, selectedAccount, searchSymbols])

  const handleSideChange = (nextSide) => {
    if (nextSide === side) return
    setSide(nextSide)
    setError('')
    // 매도로 바꿨는데 보유하지 않은 종목이면 보유 목록에서 다시 고르게 한다
    if (nextSide === 'SELL' && selectedSymbol && !heldSymbols.some((g) => g.symbol.id === selectedSymbol.id)) {
      setSelectedSymbol(null)
    }
  }

  const handleAccountChange = (accountId) => {
    setSelectedAccountId(accountId ? Number(accountId) : null)
    // 매수에서 종목을 검색으로 고른 경우, 계좌(거래소)가 바뀌면 종목을 다시 고른다
    if (isBuy && !initialSymbol) {
      setSelectedSymbol(null)
      setSymbolSearch('')
      setSymbolResults([])
    }
  }

  const clearSymbol = () => {
    setSelectedSymbol(null)
    setSymbolSearch('')
    setSymbolResults([])
  }

  const buildPayload = () => {
    const payload = {
      account_id: selectedAccountId,
      symbol_id: selectedSymbol.id,
      side,
      order_type: orderType,
    }

    if (orderType === 'LIMIT' && price) {
      payload.price = parseFloat(price)
    }
    // 매수 시장가 + 전량/비율/금액: 수량 계산용 예상가
    if (isBuy && orderType === 'MARKET' && quantityType !== 'EXACT' && price) {
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

  const validate = () => {
    if (!selectedSymbol) return '종목을 선택해 주세요.'
    if (!selectedAccountId) return '계좌를 선택해 주세요.'
    if (orderType === 'LIMIT' && (!price || parseFloat(price) <= 0)) return '지정가 주문은 가격을 입력해 주세요.'
    if (isBuy && orderType === 'MARKET' && quantityType !== 'EXACT' && (!price || parseFloat(price) <= 0)) {
      return '시장가 매수에서 전량/비율/금액은 예상가를 입력해 주세요.'
    }
    if (quantityType === 'PERCENT') {
      const v = parseFloat(quantityValue)
      if (!v || v <= 0 || v > 100) return '비율은 0 초과 100 이하여야 합니다.'
    }
    if (quantityType === 'EXACT') {
      const v = parseFloat(quantityExact)
      if (!v || v <= 0) return '수량을 입력해 주세요.'
      if (!isBuy && v > availableQuantity) return `보유 수량(${availableQuantity})을 초과할 수 없습니다.`
    }
    if (quantityType === 'AMOUNT') {
      const v = parseFloat(quantityValue)
      if (!v || v <= 0) return '금액을 입력해 주세요.'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await dashboardAPI.createOrder(buildPayload())
      onSuccess?.()
      onClose()
    } catch (err) {
      const msg =
        err.response?.data?.quantity ||
        err.response?.data?.quantity_value ||
        err.response?.data?.price ||
        (typeof err.response?.data === 'object' && err.response?.data?.detail ? err.response.data.detail : null) ||
        (Array.isArray(err.response?.data) ? err.response.data.join(', ') : null) ||
        err.message ||
        '주문 접수에 실패했습니다.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  const sideLabel = isBuy ? '매수' : '매도'
  const changeButton = (
    <button type="button" className="order-symbol-change" onClick={clearSymbol}>
      변경
    </button>
  )

  const renderSymbolSection = () => {
    if (isBuy) {
      if (!selectedAccount) {
        return <p className="order-empty">매수할 수 있는 계좌가 없어요. 계좌 설정에서 매수를 허용해 주세요.</p>
      }
      if (selectedSymbol) {
        return (
          <TickerRow
            name={selectedSymbol.name}
            code={selectedSymbol.ticker}
            meta={selectedSymbol.currency}
            selected
            trailing={changeButton}
          />
        )
      }
      return (
        <div className="order-search">
          <TextField
            label="종목"
            align="left"
            placeholder="티커 또는 종목명 검색"
            value={symbolSearch}
            onChange={(e) => setSymbolSearch(e.target.value)}
            autoComplete="off"
            help={`${selectedAccount.broker?.name ?? ''} · ${selectedAccount.broker?.is_crypto_exchange ? '암호화폐' : '주식'} 종목만 매수할 수 있어요`}
          />
          {symbolSearching && <p className="order-empty">검색 중...</p>}
          {!symbolSearching && symbolResults.length > 0 && (
            <div className="order-symbol-list" role="listbox" aria-label="종목 검색 결과">
              {symbolResults.map((sym) => (
                <TickerRow
                  key={sym.id}
                  name={sym.name}
                  code={sym.ticker}
                  meta={sym.currency}
                  onClick={() => {
                    setSelectedSymbol(sym)
                    setSymbolSearch('')
                    setSymbolResults([])
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )
    }

    // 매도
    if (selectedSymbol) {
      return (
        <TickerRow
          name={selectedSymbol.name}
          code={selectedSymbol.ticker}
          meta={`${formatNumber(availableQuantity)} 보유`}
          price={currentPrice > 0 ? `${formatNumber(currentPrice, 2)} ${currencyDisplay}` : null}
          selected
          trailing={initialSymbol && side === initialSide ? null : changeButton}
        />
      )
    }
    if (heldSymbols.length === 0) {
      return <p className="order-empty">매도할 보유 종목이 없어요.</p>
    }
    return (
      <div className="order-symbol-list" role="listbox" aria-label="보유 종목">
        {heldSymbols.map((g) => (
          <TickerRow
            key={g.symbol.id}
            name={g.symbol.name}
            code={g.symbol.ticker}
            meta={`${formatNumber(g.quantity)} 보유`}
            rate={g.cost > 0 ? (g.profit / g.cost) * 100 : 0}
            onClick={() => setSelectedSymbol(g.symbol)}
          />
        ))}
      </div>
    )
  }

  const quantityField = () => {
    if (quantityType === 'PERCENT') {
      return (
        <>
          <FilterChips
            ariaLabel="비율 빠른 선택"
            options={PERCENT_QUICK}
            value={String(parseFloat(quantityValue))}
            onChange={setQuantityValue}
          />
          <TextField
            type="number"
            min="0.01"
            max="100"
            step="0.1"
            placeholder="0~100"
            unit="%"
            value={quantityValue}
            onChange={(e) => setQuantityValue(e.target.value)}
            aria-label="비율"
          />
        </>
      )
    }
    if (quantityType === 'EXACT') {
      return (
        <TextField
          type="number"
          min="0"
          step="any"
          placeholder={`${sideLabel} 수량`}
          value={quantityExact}
          onChange={(e) => setQuantityExact(e.target.value)}
          aria-label={`${sideLabel} 수량`}
          help={!isBuy && selectedHolding ? `최대 ${formatNumber(availableQuantity)}까지 ${sideLabel}할 수 있어요` : undefined}
        />
      )
    }
    if (quantityType === 'AMOUNT') {
      return (
        <TextField
          type="number"
          min="0"
          step="1"
          placeholder={`${sideLabel} 금액`}
          unit={currencyDisplay}
          value={quantityValue}
          onChange={(e) => setQuantityValue(e.target.value)}
          aria-label={`${sideLabel} 금액`}
        />
      )
    }
    return null
  }

  const needsRefPrice = isBuy && orderType === 'MARKET' && quantityType !== 'EXACT'

  // 매수는 계좌(거래소)에 따라 검색 대상이 바뀌므로 계좌를 먼저, 매도는 종목을 먼저 고른 뒤 보유 계좌를 고른다
  const accountSelect =
    (selectedSymbol || isBuy) && sideAccounts.length > 0 ? (
      <div className="order-group">
        <label className="order-label" htmlFor="order-account">
          {sideLabel} 계좌
        </label>
        <select
          id="order-account"
          className="order-select"
          value={selectedAccountId ?? ''}
          onChange={(e) => handleAccountChange(e.target.value)}
        >
          {sideAccounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {getAccountName(acc)}
            </option>
          ))}
        </select>
      </div>
    ) : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="주문" size="sm">
      <form onSubmit={handleSubmit} className={`order-form order-form-${isBuy ? 'buy' : 'sell'}`}>
        <SegmentedControl ariaLabel="주문 방향" options={SIDES} value={side} onChange={handleSideChange} block size="lg" />

        {error && <div className="ui-modal-error">{error}</div>}

        {isBuy && accountSelect}
        {renderSymbolSection()}
        {!isBuy && accountSelect}

        {isBuy && selectedSymbol && sideAccounts.length === 0 && (
          <p className="order-empty">이 종목을 매수할 수 있는 계좌가 없어요.</p>
        )}

        {selectedSymbol && (
          <>
            <div className="order-group">
              <span className="order-label">수량 지정</span>
              <SegmentedControl ariaLabel="수량 지정" options={QUANTITY_TYPES} value={quantityType} onChange={setQuantityType} block />
              {quantityField()}
            </div>

            <div className="order-group">
              <span className="order-label">주문 유형</span>
              <SegmentedControl ariaLabel="주문 유형" options={ORDER_TYPES} value={orderType} onChange={setOrderType} block />
              {orderType === 'LIMIT' && (
                <TextField
                  type="number"
                  min="0"
                  step="any"
                  placeholder="지정가"
                  unit={currencyDisplay}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-label="지정가"
                />
              )}
              {needsRefPrice && (
                <TextField
                  type="number"
                  min="0"
                  step="any"
                  placeholder="예상가"
                  unit={currencyDisplay}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-label="예상가"
                  help="시장가 매수에서 전량·비율·금액으로 주문할 때 수량 계산에 써요"
                />
              )}
            </div>
          </>
        )}

        <div className="order-actions">
          <Button type="button" variant="secondary" size="lg" onClick={onClose}>
            취소
          </Button>
          <Button
            type="submit"
            variant={isBuy ? 'buy' : 'sell'}
            size="lg"
            disabled={loading || !selectedSymbol || !selectedAccountId}
          >
            {loading ? '접수 중...' : `${sideLabel} 주문`}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default OrderModal
