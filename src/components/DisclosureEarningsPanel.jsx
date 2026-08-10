import { useEffect, useState } from 'react'
import { dashboardAPI } from '../services/dashboardAPI'
import Badge from './ui/Badge'
import './DisclosureEarningsPanel.css'

const REPORT_LABELS = {
  '11013': '1분기',
  '11012': '반기',
  '11014': '3분기',
  '11011': '사업(연간)',
}

const formatAmount = (value) => {
  if (value === null || value === undefined) return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  // 억원 단위로 표시 (KrFinancialFact.revenue 등은 원 단위 정수로 저장됨)
  return `${(num / 100_000_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억`
}

const YoyBadge = ({ pct }) => {
  if (pct === null || pct === undefined) {
    return <span className="kr-yoy-empty">—</span>
  }
  // DS-0001: 수익률류 지표는 국내 증시 관례(상승=--color-rise, 하락=--color-fall)를 따른다.
  // Badge의 success/danger(일반 상태색)는 의미가 달라 그대로 쓰지 않고 rise/fall로 오버라이드한다.
  const rising = pct >= 0
  return (
    <Badge
      variant={rising ? 'success' : 'danger'}
      className={rising ? 'ui-badge kr-yoy-rise' : 'ui-badge kr-yoy-fall'}
    >
      {rising ? '+' : ''}{pct.toFixed(1)}%
    </Badge>
  )
}

/**
 * 국내(KR) 종목 공시·실적 패널 (PRD-0004, ARCH-0002).
 * symbol.broker.country === 'KR'일 때만 부모(SymbolChartPage)에서 마운트한다.
 */
const DisclosureEarningsPanel = ({ symbol }) => {
  const [disclosures, setDisclosures] = useState([])
  const [facts, setFacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!symbol?.id) return

    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [disclosureRes, factRes] = await Promise.all([
          dashboardAPI.getKrDisclosures(symbol.id),
          dashboardAPI.getKrFinancialFacts(symbol.id),
        ])
        if (cancelled) return
        setDisclosures(Array.isArray(disclosureRes) ? disclosureRes : [])
        setFacts(Array.isArray(factRes) ? factRes : [])
      } catch (err) {
        if (cancelled) return
        console.error('KR disclosure/earnings load error:', err)
        setError('공시·실적 정보를 불러오는데 실패했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [symbol?.id])

  if (!symbol) return null

  return (
    <section className="kr-disclosure-earnings-panel">
      <h2 className="kr-panel-title">국내 공시·실적</h2>

      {loading && <p className="kr-panel-hint">불러오는 중…</p>}
      {error && <p className="kr-panel-hint kr-panel-error">{error}</p>}

      {!loading && !error && (
        <div className="kr-panel-grid">
          <div className="kr-panel-column">
            <h3 className="kr-panel-subtitle">최근 공시</h3>
            {disclosures.length === 0 ? (
              <p className="kr-panel-empty">등록된 공시 정보가 없습니다.</p>
            ) : (
              <ul className="kr-disclosure-list">
                {disclosures.map((d) => (
                  <li key={d.id} className="kr-disclosure-item">
                    <a href={d.source_url} target="_blank" rel="noopener noreferrer">
                      {d.report_name}
                    </a>
                    <span className="kr-disclosure-date">{d.rcept_dt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="kr-panel-column">
            <h3 className="kr-panel-subtitle">최근 분기 실적</h3>
            {facts.length === 0 ? (
              <p className="kr-panel-empty">등록된 실적 정보가 없습니다.</p>
            ) : (
              <table className="kr-earnings-table">
                <thead>
                  <tr>
                    <th>기간</th>
                    <th>매출액</th>
                    <th>영업이익</th>
                    <th>순이익</th>
                  </tr>
                </thead>
                <tbody>
                  {facts.map((f) => (
                    <tr key={f.id}>
                      <td>{f.bsns_year} {REPORT_LABELS[f.reprt_code] || f.reprt_code}</td>
                      <td>
                        {formatAmount(f.revenue)}
                        <YoyBadge pct={f.revenue_yoy_pct} />
                      </td>
                      <td>
                        {formatAmount(f.operating_profit)}
                        <YoyBadge pct={f.operating_profit_yoy_pct} />
                      </td>
                      <td>
                        {formatAmount(f.net_profit)}
                        <YoyBadge pct={f.net_profit_yoy_pct} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default DisclosureEarningsPanel
