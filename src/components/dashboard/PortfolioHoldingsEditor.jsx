import { useState, useEffect, useMemo } from 'react'
import { dashboardAPI } from '../../services/dashboardAPI'
import Button from '../ui/Button'
import './PortfolioHoldingsEditor.css'

const PortfolioHoldingsEditor = ({ isOpen, onClose, onSuccess, portfolio }) => {
  const [rows, setRows] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setError('')
    setSearchTerm('')
    setSearchResults([])
    const holdings = portfolio?.holdings || []
    setRows(
      holdings.map((h) => ({
        symbolId: h.symbol?.id,
        ticker: h.symbol?.ticker,
        name: h.symbol?.name,
        currency: h.symbol?.currency,
        targetWeightPercent: String(h.target_weight_percent ?? '0'),
      }))
    )
  }, [isOpen, portfolio])

  useEffect(() => {
    if (!isOpen || !searchTerm.trim()) {
      setSearchResults([])
      return
    }
    let cancelled = false
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const data = await dashboardAPI.getSymbols({ search: searchTerm.trim() })
        if (!cancelled) setSearchResults(data.results || data || [])
      } catch {
        if (!cancelled) setSearchResults([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, searchTerm])

  const weightSum = useMemo(
    () => rows.reduce((sum, r) => sum + (parseFloat(r.targetWeightPercent) || 0), 0),
    [rows]
  )

  const portfolioCurrency = rows[0]?.currency || null

  const handleAddSymbol = (symbol) => {
    if (rows.some((r) => r.symbolId === symbol.id)) return
    setRows((prev) => [
      ...prev,
      {
        symbolId: symbol.id,
        ticker: symbol.ticker,
        name: symbol.name,
        currency: symbol.currency,
        targetWeightPercent: '0',
      },
    ])
    setSearchTerm('')
    setSearchResults([])
  }

  const handleWeightChange = (symbolId, value) => {
    setRows((prev) =>
      prev.map((r) => (r.symbolId === symbolId ? { ...r, targetWeightPercent: value } : r))
    )
  }

  const handleRemove = (symbolId) => {
    setRows((prev) => prev.filter((r) => r.symbolId !== symbolId))
  }

  const handleSave = async () => {
    setError('')
    if (weightSum > 100) {
      setError('목표 비중의 합은 100%를 초과할 수 없습니다.')
      return
    }
    const currencies = new Set(rows.map((r) => r.currency))
    if (currencies.size > 1) {
      setError('포트폴리오는 단일 통화의 종목으로만 구성할 수 있습니다.')
      return
    }
    setLoading(true)
    try {
      await dashboardAPI.updatePortfolioHoldings(
        portfolio.id,
        rows.map((r) => ({
          symbol_id: r.symbolId,
          target_weight_percent: parseFloat(r.targetWeightPercent) || 0,
        }))
      )
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
      <div className="portfolio-modal holdings-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="portfolio-modal-header">
          <h2>{portfolio?.title} · 비중 편집</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className="holdings-editor-body">
          {error && <div className="form-error">{error}</div>}
          <p className="form-hint">
            저장하면 이 포트폴리오를 구독 중인 모든 계좌가 새 비중으로 즉시 리밸런싱됩니다.
          </p>

          <div className="holdings-search">
            <input
              type="text"
              placeholder="종목 검색 (티커 또는 이름)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searching && <div className="holdings-search-status">검색 중...</div>}
            {searchResults.length > 0 && (
              <ul className="holdings-search-results">
                {searchResults.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => handleAddSymbol(s)}>
                      <span>{s.ticker}</span>
                      <span className="muted-text">{s.name} · {s.currency}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {portfolioCurrency && (
            <p className="form-hint">포트폴리오 통화: {portfolioCurrency}</p>
          )}

          {rows.length === 0 ? (
            <div className="empty-state"><p>추가된 종목이 없습니다. 검색해서 추가하세요.</p></div>
          ) : (
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>종목</th>
                  <th>목표 비중 (%)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.symbolId}>
                    <td>
                      <div>{r.ticker}</div>
                      <div className="muted-text">{r.name}</div>
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={r.targetWeightPercent}
                        onChange={(e) => handleWeightChange(r.symbolId, e.target.value)}
                      />
                    </td>
                    <td>
                      <button type="button" className="btn-link danger" onClick={() => handleRemove(r.symbolId)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className={`weight-sum-row ${weightSum > 100 ? 'over' : ''}`}>
            합계: {weightSum.toFixed(2)}% {weightSum < 100 && `(현금 ${(100 - weightSum).toFixed(2)}% 보유)`}
          </div>
        </div>

        <div className="form-actions holdings-editor-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>취소</Button>
          <Button type="button" variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? '저장 중...' : '저장 및 즉시 리밸런싱'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PortfolioHoldingsEditor
