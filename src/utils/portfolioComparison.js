// PRD-0006: 포트폴리오 "목표 구성 vs 실제 보유" 비교 패널 전용 계산 유틸.
// 전량 클라이언트 계산(백엔드 변경 없음, PRD-0006 §5 Out of Scope).

export const DEVIATION_WARNING_THRESHOLD = 3
export const DEVIATION_DANGER_THRESHOLD = 7

export const getDeviationBand = (deviationPercent) => {
  const abs = Math.abs(deviationPercent)
  if (abs > DEVIATION_DANGER_THRESHOLD) return 'danger'
  if (abs >= DEVIATION_WARNING_THRESHOLD) return 'warning'
  return 'normal'
}

// 계좌 총평가금액 대비 각 보유 종목의 현재비중(%)을 계산한다.
// 한 계좌가 여러 통화를 섞어 보유할 수 있으나 환율 변환은 PRD-0006 범위 밖이라
// total_value를 그대로 합산한다(단일 통화 계좌 기준으로 정확).
export const computeAccountWeights = (accountHoldings) => {
  const totalValue = accountHoldings.reduce((sum, h) => sum + parseFloat(h.total_value || 0), 0)
  const bySymbolId = new Map()
  accountHoldings.forEach((h) => {
    const symbolId = h.symbol?.id
    if (symbolId == null) return
    const value = parseFloat(h.total_value || 0)
    bySymbolId.set(symbolId, {
      holding: h,
      valuePercent: totalValue > 0 ? (value / totalValue) * 100 : 0,
    })
  })
  return { totalValue, bySymbolId }
}

// 목표 구성(PortfolioHolding[]) 각 행에 현재비중/괴리를 덧붙인다.
// accountWeights가 null이면(비교할 연결 계좌 없음) 현재비중/괴리는 null로 남긴다.
export const buildTargetComparisonRows = (targetHoldings, accountWeights) =>
  (targetHoldings || []).map((h) => {
    const symbolId = h.symbol?.id
    const targetWeightPercent = parseFloat(h.target_weight_percent || 0)
    const currentWeightPercent = accountWeights
      ? accountWeights.bySymbolId.get(symbolId)?.valuePercent ?? 0
      : null
    const deviationPercent = currentWeightPercent == null ? null : currentWeightPercent - targetWeightPercent
    return {
      id: h.id,
      symbol: h.symbol,
      targetWeightPercent,
      currentWeightPercent,
      deviationPercent,
      deviationBand: deviationPercent == null ? null : getDeviationBand(deviationPercent),
    }
  })
