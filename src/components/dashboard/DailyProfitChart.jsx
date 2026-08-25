import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import './DailyProfitChart.css'

const DailyProfitChart = ({ data, selectedAccount }) => {
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
          <span className={`stat-value ${totalProfit >= 0 ? 'positive' : 'negative'}`}>
            {new Intl.NumberFormat('ko-KR', {
              style: 'currency',
              currency: 'KRW',
            }).format(totalProfit)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">평균 수익률</span>
          <span className={`stat-value ${avgProfitRate >= 0 ? 'positive' : 'negative'}`}>
            {avgProfitRate >= 0 ? '+' : ''}{avgProfitRate.toFixed(2)}%
          </span>
        </div>
      </div>
      
      {chartData.length > 0 ? (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                  return value.toString()
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
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
                stroke="#dc2626" 
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

