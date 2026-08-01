import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import './PortfolioWeightChart.css'

const COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d']

const PortfolioWeightChart = ({ holdings = [] }) => {
  const chartData = useMemo(() => {
    const data = (holdings || []).map((h) => ({
      name: h.symbol?.ticker || `#${h.symbol_id}`,
      value: parseFloat(h.target_weight_percent || 0),
    }))
    const weightSum = data.reduce((sum, item) => sum + item.value, 0)
    const cashWeight = Math.max(0, 100 - weightSum)
    if (cashWeight > 0.01) {
      data.push({ name: '현금', value: cashWeight, isCash: true })
    }
    return data
  }, [holdings])

  if (chartData.length === 0) {
    return (
      <div className="portfolio-weight-chart-empty">
        <p>등록된 종목이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="portfolio-weight-chart-container">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={entry.isCash ? '#e5e7eb' : COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PortfolioWeightChart
