import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import './PriceChart.css'

const PriceChart = () => {
  // 샘플 차트 데이터 생성 (실제 가격 변동 시뮬레이션)
  const generateChartData = () => {
    const data = []
    let price = 100
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() - 30)
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() + i)
      
      // 랜덤 워크로 가격 변동 시뮬레이션
      const change = (Math.random() - 0.48) * 3
      price = Math.max(80, Math.min(120, price + change))
      
      data.push({
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        price: Math.round(price * 100) / 100,
        volume: Math.floor(Math.random() * 1000000 + 500000)
      })
    }
    return data
  }

  const chartData = generateChartData()
  const currentPrice = chartData[chartData.length - 1].price
  const startPrice = chartData[0].price
  const change = ((currentPrice - startPrice) / startPrice * 100).toFixed(2)
  const isPositive = change >= 0

  return (
    <div className="price-chart-container">
      <div className="chart-header">
        <div className="chart-title">
          <h3>실시간 수익률 추이</h3>
          <span className="chart-subtitle">최근 30일간의 자동매매 성과</span>
        </div>
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-label">현재 수익률</span>
            <span className={`stat-value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{change}%
            </span>
          </div>
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
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
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value) => [`${value}%`, '수익률']}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#dc2626" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default PriceChart

