import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import './PerformanceChart.css'

const PerformanceChart = () => {
  // 일별 수익률 데이터
  const dailyData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const profit = (Math.random() - 0.3) * 5 // -1.5% ~ 3.5% 범위
    dailyData.push({
      day: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
      profit: Math.round(profit * 100) / 100,
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    })
  }

  return (
    <div className="performance-chart-container">
      <div className="chart-header">
        <h3>주간 수익률 분석</h3>
        <span className="chart-subtitle">최근 7일간 일별 수익률</span>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="day" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: '수익률 (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value) => [`${value > 0 ? '+' : ''}${value}%`, '수익률']}
              labelFormatter={(label, payload) => payload[0]?.payload.date || label}
            />
            <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
              {dailyData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.profit >= 0 ? '#dc2626' : '#059669'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default PerformanceChart

