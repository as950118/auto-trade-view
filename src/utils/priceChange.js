/**
 * 등락 표시 규칙 (DS-0003, 아티팩트 README '콘텐츠 기준'):
 * - 양수: '+' 접두, tone 'rise'(--color-rise)
 * - 음수: '−'(U+2212, 하이픈 아님) 접두, tone 'fall'(--color-fall)
 * - 0(표시 자릿수로 반올림해 0인 경우 포함): 부호 없음, tone 'flat'(--color-text-secondary)
 */
export const MINUS = '−'

const toNumber = (value) => {
  const num = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(num) ? num : 0
}

/** 표시 자릿수 기준으로 부호를 판단한다(−0.001%를 '−0.00%'로 보이지 않게). */
export const changeTone = (value, digits = 2) => {
  const num = toNumber(value)
  const rounded = Number(Math.abs(num).toFixed(digits))
  if (rounded === 0) return 'flat'
  return num > 0 ? 'rise' : 'fall'
}

export const signPrefix = (tone) => (tone === 'rise' ? '+' : tone === 'fall' ? MINUS : '')

/** +1.71% / −0.46% / 0.00% */
export const formatSignedPercent = (value, digits = 2, suffix = '%') => {
  const num = toNumber(value)
  const tone = changeTone(num, digits)
  return `${signPrefix(tone)}${Math.abs(num).toFixed(digits)}${suffix}`
}

/** 절댓값 포맷 함수를 받아 부호를 붙인다. formatAbs(1200) → '₩1,200' 이면 '+₩1,200'. */
export const formatSignedAmount = (value, formatAbs, digits = 2) => {
  const num = toNumber(value)
  const tone = changeTone(num, digits)
  return `${signPrefix(tone)}${formatAbs(Math.abs(num))}`
}
