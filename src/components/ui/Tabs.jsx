import './Tabs.css'

/**
 * DS-0003 Tabs — 선택 컨트롤 세 가지.
 * - UnderlineTabs: 화면 영역 전환 (role="tablist")
 * - SegmentedControl: 2–4개 상호배타 보기 전환. tone="side"면 매수(빨강)/매도(파랑) 틴트를 쓴다
 * - FilterChips: 필터·정렬 기준 (선택 시 accent 틴트)
 * options: [{ value, label, tone? }]
 */
export function UnderlineTabs({ options, value, onChange, ariaLabel, className = '' }) {
  return (
    <div className={`ui-tabs ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          className="ui-tab"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function SegmentedControl({ options, value, onChange, ariaLabel, block = false, size = 'md', className = '' }) {
  const classes = ['ui-segment', `ui-segment-${size}`, block ? 'ui-segment-block' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={classes} role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          className={opt.tone ? `ui-segment-${opt.tone}` : undefined}
          disabled={opt.disabled}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function FilterChips({ options, value, onChange, ariaLabel, className = '' }) {
  return (
    <div className={`ui-chips ${className}`.trim()} role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          className="ui-chip"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
