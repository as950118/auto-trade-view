import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import './DailyProfitChart.css'
import PriceChange from '../ui/PriceChange'
import { useChartTheme } from '../../hooks/useTokenColors'

const DailyProfitChart = ({ data, selectedAccount }) => {
  const chart = useChartTheme()
  const chartData = useMemo(() => {
    // 최근 30일 데이터만 사용
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    ).slice(-30)

    return sortedData.map((item) => ({
      date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      fullDate: item.date,
      profit: parseFloat(item.realized_profit || 0),
      profitRate: parseFloat(item.realized_profit_rate || 0),
      account: item.account?.account_number || '전체',
    }))
  }, [data, selectedAccount])

  const totalProfit = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.profit, 0)
  }, [chartData])

  const avgProfitRate = useMemo(() => {
    if (chartData.length === 0) return 0
    const sum = chartData.reduce((sum, item) => sum + item.profitRate, 0)
    return sum / chartData.length
  }, [chartData])

  return (
    <div className="daily-profit-chart-container">
      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">총 실현 손익</span>
          <PriceChange
            className="stat-value"
            value={totalProfit}
            formatAbs={(v) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(v)}
            digits={0}
          />
        </div>
        <div className="stat-item">
          <span className="stat-label">평균 수익률</span>
          <PriceChange className="stat-value" value={avgProfitRate} />
        </div>
      </div>
      
      {chartData.length > 0 ? (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chart.accent} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chart.accent} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis 
                dataKey="date" 
                stroke={chart.axis}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={chart.axis}
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                  return value.toString()
                }}
              />
              <Tooltip 
                contentStyle={chart.tooltipStyle}
                formatter={(value, name) => {
                  if (name === 'profit') {
                    return [
                      new Intl.NumberFormat('ko-KR', {
                        style: 'currency',
                        currency: 'KRW',
                      }).format(value),
                      '실현 손익'
                    ]
                  }
                  return [value, name]
                }}
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke={chart.accent} 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-empty">
          <p>데이터가 없습니다.</p>
        </div>
      )}
    </div>
  )
}

export default DailyProfitChart

