import { useEffect, useRef } from 'react'
import './TradingViewChart.css'

/**
 * TradingView 공식 Advanced Chart 위젯 (데이터 포함, 오픈소스/무료)
 * 심볼 형식: "NASDAQ:AAPL", "BINANCE:BTCUSDT" 등
 * @param {{ symbol: string, height?: number }} props
 */
const TradingViewChart = ({ symbol, height = 500 }) => {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!symbol || !containerRef.current) return

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.type = 'text/javascript'
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      locale: 'kr',
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    })

    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current && script.parentNode) {
        containerRef.current.removeChild(script)
      }
    }
  }, [symbol])

  if (!symbol) {
    return (
      <div className="tradingview-chart-empty" style={{ height: `${height}px` }}>
        종목을 선택하세요.
      </div>
    )
  }

  return (
    <div
      className="tradingview-chart-embed"
      style={{ height: `${height}px` }}
    >
      <div ref={containerRef} className="tradingview-widget-container" style={{ height: '100%', width: '100%' }}>
        <div className="tradingview-widget-container__widget" style={{ height: 'calc(100% - 32px)', width: '100%' }} />
      </div>
    </div>
  )
}

export default TradingViewChart
