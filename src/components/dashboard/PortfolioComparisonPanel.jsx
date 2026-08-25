import { useState, useEffect, useMemo } from 'react'
import Badge from '../ui/Badge'
import { dashboardAPI } from '../../services/dashboardAPI'
import { buildTargetComparisonRows, computeAccountWeights } from '../../utils/portfolioComparison'
import './PortfolioComparisonPanel.css'

const getAccountLabel = (account) => {
  if (!account) return '-'
  return account.broker?.name ? `${account.broker.name} (${account.account_number || '-'})` : `계좌 ${account.id}`
}

const formatPercent = (value, digits = 1) => `${Number(value).toFixed(digits)}%`

const formatSignedPercentPoint = (value) => {
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${Math.abs(value).toFixed(1)}%p`
}

// Deviation Indicator (DS-0002 신규 패턴): 색상만이 아니라 부호+숫자를 항상 함께 표기한다.
const DeviationIndicator = ({ deviationPercent, band }) => {
  if (deviationPercent == null) return <span className="deviation-indicator muted">-</span>
  if (band === 'normal') {
    return <span className="deviation-indicator">{formatSignedPercentPoint(deviationPercent)}</span>
  }
  return (
    <Badge variant={band} className="deviation-indicator">
      {formatSignedPercentPoint(deviationPercent)}
    </Badge>
  )
}

const PortfolioComparisonPanel = ({ portfolio, links }) => {
  const portfolioLinks = useMemo(
    () => links.filter((l) => (l.portfolio?.id ?? l.portfolio_id) === portfolio.id),
    [links, portfolio.id]
  )

  // getPortfolioLinks()는 서버에서 -created_at 정렬로 오므로 portfolioLinks[0]이 최근 연결 계좌다
  // (PRD-0006 §6/§8 Open Question #1 확정안).
  const [selectedLinkId, setSelectedLinkId] = useState(portfolioLinks[0]?.id ?? null)
  const [accountHoldings, setAccountHoldings] = useState([])
  const [loadingHoldings, setLoadingHoldings] = useState(false)

  useEffect(() => {
    setSelectedLinkId(portfolioLinks[0]?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio.id])

  const selectedLink = portfolioLinks.find((l) => l.id === selectedLinkId) || null
  const selectedAccountId = selectedLink?.account?.id ?? null

  useEffect(() => {
    if (!selectedAccountId) {
      setAccountHoldings([])
      return
    }
    let cancelled = false
    setLoadingHoldings(true)
    dashboardAPI
      .getHoldings(selectedAccountId)
      .then((data) => {
        if (!cancelled) setAccountHoldings(data.results || data || [])
      })
      .catch((err) => {
        console.error('Comparison panel holdings load error:', err)
        if (!cancelled) setAccountHoldings([])
      })
      .finally(() => {
        if (!cancelled) setLoadingHoldings(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedAccountId])

  const accountWeights = selectedLink ? computeAccountWeights(accountHoldings) : null
  const targetRows = buildTargetComparisonRows(portfolio.holdings, accountWeights)
  const actualRows = useMemo(
    () => [...accountHoldings].sort((a, b) => parseFloat(b.total_value || 0) - parseFloat(a.total_value || 0)),
    [accountHoldings]
  )

  return (
    <div className="comparison-panel">
      {portfolioLinks.length > 1 && (
        <div className="comparison-panel-header">
          <label htmlFor="comparison-account-select" className="comparison-account-label">
            비교 계좌
          </label>
          <select
            id="comparison-account-select"
            className="comparison-account-select"
            value={selectedLinkId ?? ''}
            onChange={(e) => setSelectedLinkId(Number(e.target.value))}
          >
            {portfolioLinks.map((l) => (
              <option key={l.id} value={l.id}>
                {getAccountLabel(l.account)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="comparison-tables">
        <div className="dense-table-wrap">
          <div className="dense-table-caption">목표 구성</div>
          <div className="dense-table-scroll">
            <table className="dense-table">
              <thead>
                <tr>
                  <th scope="col">티커</th>
                  <th scope="col">종목명</th>
                  <th scope="col" className="text-right">설정비중</th>
                  <th scope="col" className="text-right">현재비중</th>
                  <th scope="col" className="text-right">괴리</th>
                </tr>
              </thead>
              <tbody>
                {targetRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="dense-table-empty">등록된 종목이 없습니다.</td>
                  </tr>
                ) : (
                  targetRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.symbol?.ticker || '-'}</td>
                      <td>{row.symbol?.name || '-'}</td>
                      <td className="text-right">{formatPercent(row.targetWeightPercent)}</td>
                      <td className="text-right">
                        {row.currentWeightPercent == null ? '-' : formatPercent(row.currentWeightPercent)}
                      </td>
                      <td className="text-right">
                        <DeviationIndicator deviationPercent={row.deviationPercent} band={row.deviationBand} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dense-table-wrap">
          <div className="dense-table-caption">
            실제 보유
            {selectedLink && (
              <span className="dense-table-caption-meta">{getAccountLabel(selectedLink.account)}</span>
            )}
          </div>
          <div className="dense-table-scroll">
            {!selectedLink ? (
              <div className="dense-table-empty-state">
                <p>연결된 계좌 없음</p>
                <p className="muted-text">구독하면 실제 보유가 표시됩니다.</p>
              </div>
            ) : (
              <table className="dense-table">
                <thead>
                  <tr>
                    <th scope="col">티커</th>
                    <th scope="col">종목명</th>
                    <th scope="col" className="text-right">수량</th>
                    <th scope="col" className="text-right">현재가</th>
                    <th scope="col" className="text-right">평가금액</th>
                    <th scope="col" className="text-right">현재비중</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingHoldings ? (
                    <tr>
                      <td colSpan={6} className="dense-table-empty">불러오는 중...</td>
                    </tr>
                  ) : actualRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="dense-table-empty">보유 종목이 없습니다.</td>
                    </tr>
                  ) : (
                    actualRows.map((h) => (
                      <tr key={h.id}>
                        <td>{h.symbol?.ticker || '-'}</td>
                        <td>{h.symbol?.name || '-'}</td>
                        <td className="text-right">{Number(h.quantity || 0).toLocaleString()}</td>
                        <td className="text-right">{Number(h.current_price || 0).toLocaleString()}</td>
                        <td className="text-right">{Number(h.total_value || 0).toLocaleString()}</td>
                        <td className="text-right">
                          {formatPercent(accountWeights?.bySymbolId.get(h.symbol?.id)?.valuePercent ?? 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioComparisonPanel
