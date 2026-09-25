import { useEffect, useState } from 'react'
import { dashboardAPI } from '../../services/dashboardAPI'
import PriceChange from '../ui/PriceChange'
import { changeTone } from '../../utils/priceChange'
import './MarketIndexCards.css'

/**
 * DS-0003 MarketIndexCard — 주요 지수 요약 카드 줄 (TASK-0018 2단계, ADR-0005).
 * 값은 백엔드 캐시(10분) 기준이고, 추이는 최근 30거래일 일봉 종가다.
 * 지수 조회가 실패하면 이 줄만 조용히 숨긴다(대시보드 본문을 막지 않는다).
 */
const formatIndex = (v) => Number(v).toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatAsOf = (iso) => {
  if (!iso) return ''
  const [, m, d] = iso.split('-').map(Number)
  return `${m}월 ${d}일 기준`
}

function Sparkline({ series, tone }) {
  if (!series || series.length < 2) return null
  const w = 120
  const h = 36
  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  const points = series
    .map((v, i) => `${((i / (series.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`)
    .join(' ')
  return (
    <svg className="market-index-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline className={`market-index-spark-line market-index-spark-${tone}`} points={points} />
    </svg>
  )
}

function MarketIndexCards() {
  const [indices, setIndices] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    dashboardAPI
      .getMarketIndices()
      .then((data) => {
        if (!cancelled) setIndices(data.indices || [])
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (failed || (indices && indices.length === 0)) return null

  if (!indices) {
    return (
      <div className="market-indices" aria-busy="true" aria-label="주요 지수 불러오는 중">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="market-index market-index-skeleton" />
        ))}
      </div>
    )
  }

  return (
    <section className="market-indices" aria-label="주요 지수">
      {indices.map((idx) => (
        <article key={idx.code} className="market-index">
          <div className="market-index-head">
            <span className="market-index-name">{idx.name}</span>
            <span className="market-index-asof">{formatAsOf(idx.as_of)}</span>
          </div>
          <div className="market-index-value">{formatIndex(idx.value)}</div>
          <span className="market-index-change">
            <PriceChange value={idx.change} formatAbs={formatIndex} />{' '}
            <PriceChange value={idx.change_rate} />
          </span>
          <Sparkline series={idx.series} tone={changeTone(idx.change)} />
        </article>
      ))}
    </section>
  )
}

export default MarketIndexCards
