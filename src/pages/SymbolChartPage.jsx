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
  const symbolIdFromUrl = searchParams.get('symbol')

  const [symbols, setSymbols] = useState([])
  const [selectedSymbol, setSelectedSymbol] = useState(null)
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
        setError(err.response?.data?.detail || '종목 목록을 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
    loadSymbols()
  }, [])

  useEffect(() => {
    if (!symbolIdFromUrl || !symbols.length) return
    const id = parseInt(symbolIdFromUrl, 10)
    const found = symbols.find((s) => s.id === id)
    if (found) setSelectedSymbol(found)
  }, [symbolIdFromUrl, symbols])

  const handleSymbolChange = (e) => {
    const id = e.target.value
    if (!id) {
      setSelectedSymbol(null)
      setSearchParams({})
      return
    }
    const sym = symbols.find((s) => String(s.id) === id)
    setSelectedSymbol(sym || null)
    setSearchParams(sym ? { symbol: sym.id } : {})
  }

  // TradingView 심볼: "거래소:TICKER" 형식 권장. ticker에 이미 ":" 있으면 그대로 사용
  const tvSymbol = selectedSymbol ? selectedSymbol.ticker : ''

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
            <label className="chart-control-label">종목 선택</label>
            <select
              className="chart-symbol-select"
              value={selectedSymbol ? selectedSymbol.id : ''}
              onChange={handleSymbolChange}
              disabled={loading}
            >
              <option value="">-- 종목 선택 --</option>
              {symbols.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ticker} - {s.name}
                </option>
              ))}
            </select>
            {selectedSymbol && (
              <div className="chart-stats-inline">
                <span className="chart-symbol-name">
                  {selectedSymbol.ticker} {selectedSymbol.name}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="chart-message error">{error}</div>
          )}

          <div className="chart-wrapper">
            <TradingViewChart key={tvSymbol || 'empty'} symbol={tvSymbol} height={500} />
          </div>

          {!loading && !selectedSymbol && (
            <p className="chart-hint">위에서 종목을 선택하면 TradingView 차트가 표시됩니다.</p>
          )}
        </section>
      </div>
    </div>
  )
}

export default SymbolChartPage
