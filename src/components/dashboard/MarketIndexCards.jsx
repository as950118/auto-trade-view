import { useEffect, useState } from 'react'
import { dashboardAPI } from '../../services/dashboardAPI'
import PriceChange from '../ui/PriceChange'
import { changeTone } from '../../utils/priceChange'
import './MarketIndexCards.css'

/**
 * DS-0003 MarketIndexCard — 주요 지수 요약 카드 줄 (TASK-0018 2단계, ADR-0005).
 * 값은 백엔드 스케줄러가 10분마다 갱신한 캐시 기준이고, 추이는 최근 30거래일 일봉 종가다.
 * 갱신에 실패한 지수(stale)는 직전 값에 '지연'을 붙여 보여준다.
 * 불러오는 중이거나 조회가 실패하거나 결과가 비면 이 줄 자체를 그리지 않는다(대시보드 본문을 막지 않고,
 * 스켈레톤이 곧 사라져 생기는 레이아웃 흔들림도 피한다).
 */
const formatIndex = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'
}

const formatAsOf = (iso) => {
  if (!iso || typeof iso !== 'string') return ''
  const [, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!m || !d) return ''
  return `${m}월 ${d}일 기준`
}

function Sparkline({ series, tone }) {
  if (!series || series.length < 2) return null
  const w = 120
  const h = 36
  const min = Math.min(...series)
  const max = Math.max(...series)
  const flat = max === min
  const span = flat ? 1 : max - min
  const points = series
    .map((v, i) => {
      const y = flat ? h / 2 : h - 2 - ((v - min) / span) * (h - 4)
      return `${((i / (series.length - 1)) * w).toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg className="market-index-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline className={`market-index-spark-line market-index-spark-${tone}`} points={points} />
    </svg>
  )
}

function MarketIndexCards() {
  const [indices, setIndices] = useState([])

  useEffect(() => {
    let cancelled = false
    dashboardAPI
      .getMarketIndices()
      .then((data) => {
        if (!cancelled) setIndices(data.indices || [])
      })
      .catch(() => {
        // 조회 실패는 빈 배열과 동일하게 취급한다 — 이 줄만 조용히 숨긴다
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (indices.length === 0) return null

  return (
    <section className="market-indices" aria-label="주요 지수">
      {indices.map((idx) => (
        <article key={idx.code} className="market-index">
          <div className="market-index-head">
            <span className="market-index-name">{idx.name}</span>
            <span className="market-index-asof">
              {formatAsOf(idx.as_of)}
              {/* 백엔드 갱신이 실패해 직전 값을 보여주는 중(ADR-0005) */}
              {idx.stale && ' · 지연'}
            </span>
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
