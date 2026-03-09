import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import TradingViewChart from '../components/chart/TradingViewChart'
import { dashboardAPI } from '../services/dashboardAPI'
import './SymbolChartPage.css'

const SymbolChartPage = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [symbols, setSymbols] = useState([])
  const [tickerInput, setTickerInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadSymbols = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await dashboardAPI.getSymbols({})
        const list = res.results || res
        setSymbols(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('Symbols load error:', err)
        const isUnauth = err.response?.status === 401
        setError(
          isUnauth
            ? null
            : err.response?.data?.detail || '종목 목록을 불러오는데 실패했습니다.'
        )
      } finally {
        setLoading(false)
      }
    }
    loadSymbols()
  }, [])

  // URL 반영: ?symbol=id → 해당 종목 티커, ?ticker=XXX → 그대로
  useEffect(() => {
    const tickerFromUrl = searchParams.get('ticker')
    const symbolIdFromUrl = searchParams.get('symbol')
    if (tickerFromUrl) {
      setTickerInput(tickerFromUrl)
      return
    }
    if (symbolIdFromUrl && symbols.length) {
      const id = parseInt(symbolIdFromUrl, 10)
      const found = symbols.find((s) => s.id === id)
      if (found) setTickerInput(found.ticker)
    }
  }, [symbols, searchParams])

  const handleTickerChange = (e) => {
    const value = e.target.value
    setTickerInput(value)
    if (value.trim()) setSearchParams({ ticker: value.trim() })
    else setSearchParams({})
  }

  const tvSymbol = tickerInput.trim()

  return (
    <div className="symbol-chart-page">
      <Navbar />
      <div className="symbol-chart-container">
        <header className="symbol-chart-header">
          <h1 className="symbol-chart-title">종목 주가 차트</h1>
          <p className="symbol-chart-subtitle">
            TradingView 위젯으로 제공되는 실시간 차트입니다. 종목을 선택하세요.
          </p>
        </header>

        <section className="symbol-chart-section">
          <div className="chart-controls">
            <label className="chart-control-label" htmlFor="chart-ticker-input">
              종목
            </label>
            <input
              id="chart-ticker-input"
              type="text"
              list="symbol-datalist"
              className="chart-ticker-input"
              placeholder="목록에서 선택하거나 티커 입력 (예: NASDAQ:AAPL, BINANCE:BTCUSDT)"
              value={tickerInput}
              onChange={handleTickerChange}
              disabled={loading}
            />
            <datalist id="symbol-datalist">
              {symbols.map((s) => (
                <option key={s.id} value={s.ticker}>
                  {s.ticker} - {s.name}
                </option>
              ))}
            </datalist>
          </div>

          {error && (
            <div className="chart-message error">{error}</div>
          )}

          <div className="chart-wrapper">
            <TradingViewChart key={tvSymbol || 'empty'} symbol={tvSymbol} height={500} />
          </div>

          {!loading && !tvSymbol && (
            <p className="chart-hint">
              종목을 선택하거나 티커를 직접 입력하면 TradingView 차트가 표시됩니다.
              {symbols.length === 0 && !error && (
                <> 로그인하면 등록된 종목 목록을 불러올 수 있습니다.</>
              )}
            </p>
          )}
          {tvSymbol && (
            <p className="chart-hint">
              차트 티커: <strong>{tvSymbol}</strong>
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

export default SymbolChartPage
