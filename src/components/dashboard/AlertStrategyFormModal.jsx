import { useState, useEffect } from 'react'
import { dashboardAPI } from '../../services/dashboardAPI'
import Button from '../ui/Button'
import './AlertStrategyFormModal.css'

const ORDER_TYPES = [
  { value: 'MARKET', label: '시장가' },
  { value: 'LIMIT', label: '지정가' },
]

/**
 * mode: 'strategy' | 'link'
 */
const AlertStrategyFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'strategy',
  strategy = null,
  link = null,
  accounts = [],
  strategies = [],
  isStaff = false,
}) => {
  // strategy fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState('PRIVATE')
  const [maxWeight, setMaxWeight] = useState('100')
  const [tradePercent, setTradePercent] = useState('10')
  const [splitCount, setSplitCount] = useState('1')
  const [splitInterval, setSplitInterval] = useState('0')
  const [orderType, setOrderType] = useState('MARKET')
  const [enabled, setEnabled] = useState(true)
  const [passphrase, setPassphrase] = useState('')
  const [cooldown, setCooldown] = useState('60')

  // link fields
  const [selectedStrategyId, setSelectedStrategyId] = useState(null)
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [seedAmount, setSeedAmount] = useState('')
  const [seedCurrency, setSeedCurrency] = useState('KRW')
  const [overrideMax, setOverrideMax] = useState('')
  const [overrideTrade, setOverrideTrade] = useState('')
  const [overrideSplit, setOverrideSplit] = useState('')
  const [overrideInterval, setOverrideInterval] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setError('')
    if (mode === 'strategy') {
      if (strategy) {
        setTitle(strategy.title || '')
        setDescription(strategy.description || '')
        setVisibility(strategy.visibility || 'PRIVATE')
        setMaxWeight(String(strategy.default_max_position_weight_percent ?? '100'))
        setTradePercent(String(strategy.default_trade_percent ?? '10'))
        setSplitCount(String(strategy.default_split_count ?? '1'))
        setSplitInterval(String(strategy.default_split_interval_seconds ?? '0'))
        setOrderType(strategy.order_type || 'MARKET')
        setEnabled(strategy.enabled !== false)
        setCooldown(String(strategy.cooldown_seconds ?? '60'))
        setPassphrase('')
      } else {
        setTitle('')
        setDescription('')
        setVisibility('PRIVATE')
        setMaxWeight('100')
        setTradePercent('10')
        setSplitCount('1')
        setSplitInterval('0')
        setOrderType('MARKET')
        setEnabled(true)
        setCooldown('60')
        setPassphrase('')
      }
    } else {
      if (link) {
        setSelectedStrategyId(link.strategy?.id ?? link.strategy_id)
        setSelectedAccountId(link.account?.id ?? link.account_id)
        setSeedAmount(String(link.seed_amount ?? ''))
        setSeedCurrency(link.seed_currency || 'KRW')
        setOverrideMax(link.max_position_weight_percent != null ? String(link.max_position_weight_percent) : '')
        setOverrideTrade(link.trade_percent != null ? String(link.trade_percent) : '')
        setOverrideSplit(link.split_count != null ? String(link.split_count) : '')
        setOverrideInterval(link.split_interval_seconds != null ? String(link.split_interval_seconds) : '')
        setEnabled(link.enabled !== false)
      } else {
        setSelectedStrategyId(strategies[0]?.id || null)
        setSelectedAccountId(accounts[0]?.id || null)
        setSeedAmount('')
        setSeedCurrency('KRW')
        setOverrideMax('')
        setOverrideTrade('')
        setOverrideSplit('')
        setOverrideInterval('')
        setEnabled(true)
      }
    }
  }, [isOpen, mode, strategy, link, accounts, strategies])

  const getAccountName = (acc) =>
    acc.broker?.name ? `${acc.broker.name} (${acc.account_number || '-'})` : `계좌 ${acc.id}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'strategy') {
        if (!title.trim()) {
          setError('제목을 입력해 주세요.')
          setLoading(false)
          return
        }
        const payload = {
          title: title.trim(),
          description: description.trim(),
          visibility: isStaff ? visibility : 'PRIVATE',
          default_max_position_weight_percent: parseFloat(maxWeight),
          default_trade_percent: parseFloat(tradePercent),
          default_split_count: parseInt(splitCount, 10),
          default_split_interval_seconds: parseInt(splitInterval, 10),
          order_type: orderType,
          enabled,
          cooldown_seconds: parseInt(cooldown, 10) || 0,
        }
        if (passphrase) payload.webhook_passphrase = passphrase
        if (strategy) {
          await dashboardAPI.updateStrategy(strategy.id, payload)
        } else {
          await dashboardAPI.createStrategy(payload)
        }
      } else {
        if (!selectedStrategyId || !selectedAccountId) {
          setError('전략과 계좌를 선택해 주세요.')
          setLoading(false)
          return
        }
        const seed = parseFloat(seedAmount)
        if (isNaN(seed) || seed <= 0) {
          setError('시드 금액은 0보다 커야 합니다.')
          setLoading(false)
          return
        }
        const payload = {
          strategy_id: Number(selectedStrategyId),
          account_id: Number(selectedAccountId),
          seed_amount: seed,
          seed_currency: seedCurrency,
          max_position_weight_percent: overrideMax === '' ? null : parseFloat(overrideMax),
          trade_percent: overrideTrade === '' ? null : parseFloat(overrideTrade),
          split_count: overrideSplit === '' ? null : parseInt(overrideSplit, 10),
          split_interval_seconds: overrideInterval === '' ? null : parseInt(overrideInterval, 10),
          enabled,
        }
        if (link) {
          await dashboardAPI.updateStrategyLink(link.id, payload)
        } else {
          await dashboardAPI.createStrategyLink(payload)
        }
      }
      onSuccess()
      onClose()
    } catch (err) {
      const data = err.response?.data
      setError(
        typeof data === 'string'
          ? data
          : data?.detail || JSON.stringify(data) || '저장에 실패했습니다.'
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
          <h2>
            {mode === 'strategy'
              ? strategy
                ? '전략 수정'
                : '전략 추가'
              : link
                ? '연동 수정'
                : '전략 연동'}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="alert-strategy-form">
          {error && <div className="form-error">{error}</div>}

          {mode === 'strategy' ? (
            <>
              <label className="form-field">
                <span>제목</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <label className="form-field">
                <span>설명</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </label>
              {isStaff && (
                <label className="form-field">
                  <span>공개 범위</span>
                  <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                    <option value="PRIVATE">비공개</option>
                    <option value="PUBLIC">공개</option>
                  </select>
                </label>
              )}
              <div className="form-row">
                <label className="form-field">
                  <span>default 최대비중 %</span>
                  <input type="number" step="any" min="0.0001" max="100" value={maxWeight} onChange={(e) => setMaxWeight(e.target.value)} required />
                </label>
                <label className="form-field">
                  <span>default 매매당비중 %</span>
                  <input type="number" step="any" min="0.0001" max="100" value={tradePercent} onChange={(e) => setTradePercent(e.target.value)} required />
                </label>
              </div>
              <div className="form-row">
                <label className="form-field">
                  <span>default 분할</span>
                  <input type="number" min="1" value={splitCount} onChange={(e) => setSplitCount(e.target.value)} required />
                </label>
                <label className="form-field">
                  <span>default 분할기간 (초)</span>
                  <input type="number" min="0" value={splitInterval} onChange={(e) => setSplitInterval(e.target.value)} required />
                </label>
              </div>
              <div className="form-row">
                <label className="form-field">
                  <span>주문 타입</span>
                  <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                    {ORDER_TYPES.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>쿨다운 (초)</span>
                  <input type="number" min="0" value={cooldown} onChange={(e) => setCooldown(e.target.value)} />
                </label>
              </div>
              <label className="form-field">
                <span>웹훅 패스프레이즈 (선택)</span>
                <input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder={strategy ? '변경 시에만 입력' : ''} autoComplete="new-password" />
              </label>
            </>
          ) : (
            <>
              <label className="form-field">
                <span>전략</span>
                <select
                  value={selectedStrategyId || ''}
                  onChange={(e) => setSelectedStrategyId(e.target.value ? Number(e.target.value) : null)}
                  required
                  disabled={!!link}
                >
                  {strategies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.visibility === 'PUBLIC' ? '공개' : '비공개'})
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>계좌</span>
                <select
                  value={selectedAccountId || ''}
                  onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : null)}
                  required
                  disabled={!!link}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{getAccountName(acc)}</option>
                  ))}
                </select>
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>시드 금액</span>
                  <input type="number" step="any" min="0.01" value={seedAmount} onChange={(e) => setSeedAmount(e.target.value)} required />
                </label>
                <label className="form-field">
                  <span>통화</span>
                  <select value={seedCurrency} onChange={(e) => setSeedCurrency(e.target.value)}>
                    <option value="KRW">KRW</option>
                    <option value="USD">USD</option>
                    <option value="USDT">USDT</option>
                  </select>
                </label>
              </div>
              <p className="form-hint">아래 override는 비우면 전략 default를 사용합니다.</p>
              <div className="form-row">
                <label className="form-field">
                  <span>최대비중 override %</span>
                  <input type="number" step="any" value={overrideMax} onChange={(e) => setOverrideMax(e.target.value)} placeholder="default 사용" />
                </label>
                <label className="form-field">
                  <span>매매당비중 override %</span>
                  <input type="number" step="any" value={overrideTrade} onChange={(e) => setOverrideTrade(e.target.value)} placeholder="default 사용" />
                </label>
              </div>
              <div className="form-row">
                <label className="form-field">
                  <span>분할 override</span>
                  <input type="number" min="1" value={overrideSplit} onChange={(e) => setOverrideSplit(e.target.value)} placeholder="default 사용" />
                </label>
                <label className="form-field">
                  <span>분할기간 override (초)</span>
                  <input type="number" min="0" value={overrideInterval} onChange={(e) => setOverrideInterval(e.target.value)} placeholder="default 사용" />
                </label>
              </div>
            </>
          )}

          <label className="form-checkbox">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span>활성</span>
          </label>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>취소</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AlertStrategyFormModal
