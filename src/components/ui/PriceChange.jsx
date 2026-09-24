import { changeTone, formatSignedAmount, formatSignedPercent } from '../../utils/priceChange'
import './PriceChange.css'

/**
 * 등락(수익·손실)을 부호 + 색으로 함께 표시한다 (DS-0003 PriceChange).
 *
 * - 비율: <PriceChange value={1.71} />                       → +1.71%
 * - 금액: <PriceChange value={-1200} formatAbs={fmtKrw} />    → −₩1,200 (절댓값 포맷은 호출부 규칙을 그대로 쓴다)
 * - chip: 옅은 틴트 바탕(순위·배지 자리)
 * 0은 부호 없이 보조 텍스트 색이다. 색만 바꾸고 부호를 빼는 변형은 두지 않는다.
 */
function PriceChange({ value, formatAbs, digits = 2, suffix = '%', chip = false, className = '', as: Tag = 'span' }) {
  const tone = changeTone(value, digits)
  const text = formatAbs ? formatSignedAmount(value, formatAbs, digits) : formatSignedPercent(value, digits, suffix)
  const classes = ['price-change', `price-change--${tone}`, chip ? 'price-change--chip' : '', className]
    .filter(Boolean)
    .join(' ')
  return <Tag className={classes}>{text}</Tag>
}

export default PriceChange
