import { useState, useEffect, useMemo } from 'react'
import { dashboardAPI } from '../../services/dashboardAPI'
import { getAssetType, isAccountCompatibleWithAssetType } from '../../utils/portfolio'
import './PortfolioFormModal.css'

const CURRENCIES = ['KRW', 'USD', 'USDT']

const PortfolioLinkFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  link = null,
  accounts = [],
  portfolios = [],
  initialPortfolioId = null,
}) => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null)
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [seedAmount, setSeedAmount] = useState('')
  const [seedCurrency, setSeedCurrency] = useState('KRW')
  const [enabled, setEnabled] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setError('')
    if (link) {
      setSelectedPortfolioId(link.portfolio?.id ?? link.portfolio_id)
      setSelectedAccountId(link.account?.id ?? link.account_id)
      setSeedAmount(String(link.seed_amount ?? ''))
      setSeedCurrency(link.seed_currency || 'KRW')
      setEnabled(link.enabled !== false)
    } else {
      const preselected = initialPortfolioId
        ? portfolios.find((p) => p.id === initialPortfolioId)
        : null
      const first = preselected || portfolios[0]
      setSelectedPortfolioId(first?.id || null)
      const firstCurrency = first?.holdings?.[0]?.symbol?.currency
      setSelectedAccountId(accounts[0]?.id || null)
      setSeedAmount('')
      setSeedCurrency(firstCurrency || 'KRW')
      setEnabled(true)
    }
  }, [isOpen, link, accounts, portfolios, initialPortfolioId])

  const selectedPortfolio = useMemo(
    () => portfolios.find((p) => p.id === selectedPortfolioId),
    [portfolios, selectedPortfolioId]
  )
  const portfolioCurrency = selectedPortfolio?.holdings?.[0]?.symbol?.currency || null
  const selectedAssetType = selectedPortfolio ? getAssetType(selectedPortfolio) : null

  // PRD-0003 AC-1: 포트폴리오 자산군과 호환되는 계좌만 노출한다. 수정 모드는 계좌 필드가
  // 비활성화되어 있으므로(이미 확정된 연동) 필터링하지 않고 현재 값을 그대로 보여준다.
  const compatibleAccounts = useMemo(() => {
    if (link || !selectedAssetType) return accounts
    return accounts.filter((acc) => isAccountCompatibleWithAssetType(acc, selectedAssetType))
  }, [accounts, selectedAssetType, link])

  useEffect(() => {
    if (!isOpen || link) return
    if (!compatibleAccounts.some((acc) => acc.id === selectedAccountId)) {
      setSelectedAccountId(compatibleAccounts[0]?.id || null)
    }
  }, [isOpen, link, compatibleAccounts, selectedAccountId])

  const getAccountName = (acc) =>
    acc.broker?.name ? `${acc.broker.name} (${acc.account_number || '-'})` : `계좌 ${acc.id}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!selectedPortfolioId || !selectedAccountId) {
      setError('포트폴리오와 계좌를 선택해 주세요.')
      return
    }
    if (!link && compatibleAccounts.length === 0) {
      setError('이 포트폴리오와 호환되는 계좌가 없습니다.')
      return
    }
    const seed = parseFloat(seedAmount)
    if (isNaN(seed) || seed <= 0) {
      setError('시드 금액은 0보다 커야 합니다.')
      return
    }
    if (portfolioCurrency && seedCurrency !== portfolioCurrency) {
      setError(`이 포트폴리오는 ${portfolioCurrency} 통화입니다. 시드 통화를 일치시켜 주세요.`)
      return
    }
    setLoading(true)
    try {
      const payload = {
        portfolio_id: Number(selectedPortfolioId),
        account_id: Number(selectedAccountId),
        seed_amount: seed,
        seed_currency: seedCurrency,
        enabled,
      }
      if (link) {
        await dashboardAPI.updatePortfolioLink(link.id, payload)
      } else {
        await dashboardAPI.createPortfolioLink(payload)
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
    <div className="portfolio-modal-overlay" onClick={onClose}>
      <div className="portfolio-modal" onClick={(e) => e.stopPropagation()}>
        <div className="portfolio-modal-header">
          <h2>{link ? '구독 수정' : '포트폴리오 구독'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="portfolio-form">
          {error && <div className="form-error">{error}</div>}

          <label className="form-field">
            <span>포트폴리오</span>
            <select
              value={selectedPortfolioId || ''}
              onChange={(e) => setSelectedPortfolioId(e.target.value ? Number(e.target.value) : null)}
              required
              disabled={!!link}
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.visibility === 'PUBLIC' ? '공개' : '비공개'})
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
              disabled={!!link || compatibleAccounts.length === 0}
            >
              {compatibleAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{getAccountName(acc)}</option>
              ))}
            </select>
          </label>
          {!link && compatibleAccounts.length === 0 && (
            <p className="form-error">이 포트폴리오({selectedAssetType === 'MIXED' ? '혼합' : selectedAssetType} 자산군)와 호환되는 계좌가 없습니다.</p>
          )}
          <div className="form-row">
            <label className="form-field">
              <span>시드 금액</span>
              <input type="number" step="any" min="0.01" value={seedAmount} onChange={(e) => setSeedAmount(e.target.value)} required />
            </label>
            <label className="form-field">
              <span>통화</span>
              <select value={seedCurrency} onChange={(e) => setSeedCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          {portfolioCurrency && (
            <p className="form-hint">이 포트폴리오의 통화: {portfolioCurrency}</p>
          )}
          <p className="form-hint">구독하면 목표 비중대로 즉시 매수 주문이 생성됩니다.</p>

          <label className="form-checkbox">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span>활성</span>
          </label>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>취소</button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || (!link && compatibleAccounts.length === 0)}
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PortfolioLinkFormModal
