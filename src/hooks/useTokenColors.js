import { useEffect, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

/**
 * CSS 디자인 토큰(tokens.css)의 현재 테마 값을 실제 색 문자열로 읽는다.
 * Recharts 같은 SVG 차트는 속성에 var()를 넣으면 브라우저마다 동작이 달라, 렌더 후 계산된 값을 넘긴다.
 * 테마가 바뀌면 다시 읽는다(ThemeProvider가 레이아웃 이펙트에서 data-theme을 먼저 바꾼다).
 */
export const readToken = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const readAll = (names) => Object.fromEntries(names.map((name) => [name, readToken(name)]))

export function useTokenColors(names) {
  const { theme } = useTheme()
  const key = names.join(',')
  const [colors, setColors] = useState(() => readAll(names))

  useEffect(() => {
    setColors(readAll(key.split(',')))
  }, [theme, key])

  return colors
}

const CHART_TOKENS = [
  '--color-border',
  '--color-text-secondary',
  '--color-accent',
  '--color-rise',
  '--color-fall',
  '--color-bg-subtle',
]

/** Recharts 공용 색(격자·축·툴팁·시리즈). 테마 전환 시 다시 계산된다. */
export function useChartTheme() {
  const c = useTokenColors(CHART_TOKENS)
  return {
    grid: c['--color-border'],
    axis: c['--color-text-secondary'],
    accent: c['--color-accent'],
    rise: c['--color-rise'],
    fall: c['--color-fall'],
    muted: c['--color-bg-subtle'],
    // 툴팁은 HTML이라 var()를 그대로 써도 테마를 따른다
    tooltipStyle: {
      backgroundColor: 'var(--color-bg-elevated)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)',
      borderRadius: '8px',
      boxShadow: 'var(--shadow-2)',
    },
  }
}
