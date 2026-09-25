import PriceChange from './PriceChange'
import './TickerRow.css'

/**
 * DS-0003 TickerRow — 종목 하나를 이름·코드·가격·등락으로 보여주는 리스트 행.
 * 아바타는 로고 대신 종목명 첫 글자. onClick이 있으면 행 전체가 버튼이다.
 * price는 이미 포맷된 문자열, change는 { value, formatAbs? } 또는 { rate } (PriceChange에 그대로 전달).
 */
function TickerRow({ name, code, meta, price, change, rate, rank, trailing, selected = false, onClick }) {
  const initial = (name || code || '?').trim().charAt(0).toUpperCase()
  const body = (
    <>
      <span className="ui-ticker-lead">
        {rank != null && <span className="ui-ticker-rank">{rank}</span>}
        <span className="ui-ticker-avatar" aria-hidden="true">{initial}</span>
      </span>
      <span className="ui-ticker-main">
        <span className="ui-ticker-name">{name || code}</span>
        <span className="ui-ticker-meta">{[code && name ? code : null, meta].filter(Boolean).join(' · ')}</span>
      </span>
      <span className="ui-ticker-side">
        {price != null && <span className="ui-ticker-price">{price}</span>}
        {change && <PriceChange className="ui-ticker-change" {...change} />}
        {rate != null && !change && <PriceChange className="ui-ticker-change" value={rate} />}
        {trailing}
      </span>
    </>
  )

  if (onClick) {
    return (
      <button type="button" className={`ui-ticker ui-ticker-button ${selected ? 'is-selected' : ''}`.trim()} onClick={onClick} aria-pressed={selected || undefined}>
        {body}
      </button>
    )
  }
  return <div className={`ui-ticker ${selected ? 'is-selected' : ''}`.trim()}>{body}</div>
}

export default TickerRow
