import { useState, useEffect } from 'react'
import { dashboardAPI } from '../../services/dashboardAPI'
import './AlertStrategyFormModal.css'

const ORDER_TYPES = [
  { value: 'MARKET', label: '시장가' },
  { value: 'LIMIT', label: '지정가' },
]

const CURRENCIES = [
  { value: 'KRW', label: 'KRW' },
  { value: 'USD', label: 'USD' },
  { value: 'USDT', label: 'USDT' },
]

const AlertStrategyFormModal = ({ isOpen, onClose, onSuccess, strategy = null, accounts = [] }) => {
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [name, setName] = useState('')
  const [seedAmount, setSeedAmount] = useState('')
  const [seedCurrency, setSeedCurrency] = useState('KRW')
  const [buySeedPercent, setBuySeedPercent] = useState('10')
  const [sellSeedPercent, setSellSeedPercent] = useState('10')
  const [maxWeight, setMaxWeight] = useState('100')
  const [minSellHolding, setMinSellHolding] = useState('')
  const [splitCount, setSplitCount] = useState('1')
  const [splitInterval, setSplitInterval] = useState('0')
  const [orderType, setOrderType] = useState('MARKET')
  const [enabled, setEnabled] = useState(true)
  const [passphrase, setPassphrase] = useState('')
  const [allowedTickers, setAllowedTickers] = useState('')
  const [cooldown, setCooldown] = useState('60')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (strategy) {
      setSelectedAccountId(strategy.account?.id ?? strategy.account_id)
      setName(strategy.name || '')
      setSeedAmount(strategy.seed_amount != null ? String(strategy.seed_amount) : '')
      setSeedCurrency(strategy.seed_currency || 'KRW')
      setBuySeedPercent(strategy.buy_seed_percent != null ? String(strategy.buy_seed_percent) : '10')
      setSellSeedPercent(strategy.sell_seed_percent != null ? String(strategy.sell_seed_percent) : '10')
      setMaxWeight(strategy.max_position_weight_percent != null ? String(strategy.max_position_weight_percent) : '100')
      setMinSellHolding(
        strategy.min_sell_holding_percent != null ? String(strategy.min_sell_holding_percent) : ''
      )
      setSplitCount(strategy.split_count != null ? String(strategy.split_count) : '1')
      setSplitInterval(
        strategy.split_interval_seconds != null ? String(strategy.split_interval_seconds) : '0'
      )
      setOrderType(strategy.order_type || 'MARKET')
      setEnabled(strategy.enabled !== false)
      setPassphrase('')
      setAllowedTickers(
        Array.isArray(strategy.allowed_tickers) ? strategy.allowed_tickers.join(', ') : ''
      )
      setCooldown(strategy.cooldown_seconds != null ? String(strategy.cooldown_seconds) : '60')
    } else {
      setSelectedAccountId(accounts.length > 0 ? accounts[0].id : null)
      setName('')
      setSeedAmount('')
      setSeedCurrency('KRW')
      setBuySeedPercent('10')
      setSellSeedPercent('10')
      setMaxWeight('100')
      setMinSellHolding('')
      setSplitCount('1')
      setSplitInterval('0')
      setOrderType('MARKET')
      setEnabled(true)
      setPassphrase('')
      setAllowedTickers('')
      setCooldown('60')
    }
    setError('')
  }, [isOpen, strategy, accounts])

  const getAccountName = (acc) =>
    acc.broker?.name ? `${acc.broker.name} (${acc.account_number || '-'})` : `계좌 ${acc.id}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!selectedAccountId) {
        setError('계좌를 선택해 주세요.')
        setLoading(false)
        return
      }
      if (!name.trim()) {
        setError('전략명을 입력해 주세요.')
        setLoading(false)
        return
      }
      const seed = parseFloat(seedAmount)
      if (isNaN(seed) || seed <= 0) {
        setError('시드 금액은 0보다 커야 합니다.')
        setLoading(false)
        return
      }
      const buyPct = parseFloat(buySeedPercent)
      const sellPct = parseFloat(sellSeedPercent)
      const maxPct = parseFloat(maxWeight)
      if ([buyPct, sellPct, maxPct].some((v) => isNaN(v) || v <= 0 || v > 100)) {
        setError('매수/매도/최대 비중(%)은 0 초과 100 이하여야 합니다.')
        setLoading(false)
        return
      }
      const splits = parseInt(splitCount, 10)
      const interval = parseInt(splitInterval, 10)
      if (isNaN(splits) || splits < 1) {
        setError('분할 횟수는 1 이상이어야 합니다.')
        setLoading(false)
        return
      }
      if (isNaN(interval) || interval < 0) {
        setError('분할 간격(초)은 0 이상이어야 합니다.')
        setLoading(false)
        return
      }

      const tickers = allowedTickers
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)

      const payload = {
        account_id: Number(selectedAccountId),
        name: name.trim(),
        seed_amount: seed,
        seed_currency: seedCurrency,
        buy_seed_percent: buyPct,
        sell_seed_percent: sellPct,
        max_position_weight_percent: maxPct,
        min_sell_holding_percent: minSellHolding === '' ? null : parseFloat(minSellHolding),
        split_count: splits,
        split_interval_seconds: interval,
        order_type: orderType,
        enabled,
        allowed_tickers: tickers.length ? tickers : null,
        cooldown_seconds: parseInt(cooldown, 10) || 0,
      }
      if (passphrase) {
        payload.webhook_passphrase = passphrase
      }

      if (strategy) {
        await dashboardAPI.updateAlertStrategy(strategy.id, payload)
      } else {
        await dashboardAPI.createAlertStrategy(payload)
      }
      onSuccess()
      onClose()
    } catch (err) {
      const data = err.response?.data
      setError(
        typeof data === 'string'
          ? data
          : data?.detail || data?.non_field_errors?.[0] || JSON.stringify(data) || '저장에 실패했습니다.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="alert-strategy-modal-overlay" onClick={onClose}>
      <div className="alert-strategy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="alert-strategy-modal-header">
          <h2>{strategy ? '알림 전략 수정' : '알림 전략 추가'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="alert-strategy-form">
          {error && <div className="form-error">{error}</div>}

          <label className="form-field">
            <span>계좌</span>
            <select
              value={selectedAccountId || ''}
              onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : null)}
              required
              disabled={!!strategy}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {getAccountName(acc)}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>전략명</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="예: BTC 추세 전략" />
          </label>

          <div className="form-row">
            <label className="form-field">
              <span>고정 시드 금액</span>
              <input
                type="number"
                step="any"
                min="0.01"
                value={seedAmount}
                onChange={(e) => setSeedAmount(e.target.value)}
                required
              />
            </label>
            <label className="form-field">
              <span>통화</span>
              <select value={seedCurrency} onChange={(e) => setSeedCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span>매수 시드 %</span>
              <input
                type="number"
                step="any"
                min="0.0001"
                max="100"
                value={buySeedPercent}
                onChange={(e) => setBuySeedPercent(e.target.value)}
                required
              />
            </label>
            <label className="form-field">
              <span>매도 시드 %</span>
              <input
                type="number"
                step="any"
                min="0.0001"
                max="100"
                value={sellSeedPercent}
                onChange={(e) => setSellSeedPercent(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span>최대 포지션 비중 %</span>
              <input
                type="number"
                step="any"
                min="0.0001"
                max="100"
                value={maxWeight}
                onChange={(e) => setMaxWeight(e.target.value)}
                required
              />
            </label>
            <label className="form-field">
              <span>최소 매도 보유 비중 % (선택)</span>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                value={minSellHolding}
                onChange={(e) => setMinSellHolding(e.target.value)}
                placeholder="비우면 미적용"
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span>분할 횟수</span>
              <input
                type="number"
                min="1"
                value={splitCount}
                onChange={(e) => setSplitCount(e.target.value)}
                required
              />
            </label>
            <label className="form-field">
              <span>분할 간격 (초)</span>
              <input
                type="number"
                min="0"
                value={splitInterval}
                onChange={(e) => setSplitInterval(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span>주문 타입</span>
              <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                {ORDER_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>쿨다운 (초)</span>
              <input
                type="number"
                min="0"
                value={cooldown}
                onChange={(e) => setCooldown(e.target.value)}
              />
            </label>
          </div>

          <label className="form-field">
            <span>웹훅 패스프레이즈 (선택)</span>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder={strategy ? '변경 시에만 입력' : 'payload secret과 일치'}
              autoComplete="new-password"
            />
          </label>

          <label className="form-field">
            <span>허용 티커 (쉼표 구분, 비우면 전체)</span>
            <input
              value={allowedTickers}
              onChange={(e) => setAllowedTickers(e.target.value)}
              placeholder="예: BTC-KRW, ETH-KRW"
            />
          </label>

          <label className="form-checkbox">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span>전략 활성</span>
          </label>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              취소
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '저장 중...' : strategy ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AlertStrategyFormModal
