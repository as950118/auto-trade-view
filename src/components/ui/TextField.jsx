import { useId } from 'react'
import './TextField.css'

/**
 * DS-0003 TextField — 숫자(수량·가격·금액)를 단위와 함께 입력받는다.
 * 라벨 → 입력(오른쪽 정렬, tabular-nums, 단위 접미) → 도움말/오류. 나머지 props는 <input>으로 전달된다.
 */
function TextField({ label, unit, help, error, align = 'right', className = '', id, ...inputProps }) {
  const autoId = useId()
  const inputId = id || autoId
  const messageId = `${inputId}-msg`
  const message = error || help
  const classes = ['ui-field', error ? 'ui-field-error' : '', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {label && (
        <label className="ui-field-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="ui-field-box">
        <input
          id={inputId}
          className={`ui-field-input ui-field-input-${align}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...inputProps}
        />
        {unit && <span className="ui-field-unit">{unit}</span>}
      </div>
      {message && (
        <p id={messageId} className="ui-field-help">
          {message}
        </p>
      )}
    </div>
  )
}

export default TextField
