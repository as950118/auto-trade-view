import './SummaryStats.css'

const SummaryStats = ({ summary, totalAssets, totalProfitRate }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value) => {
    const num = parseFloat(value || 0)
    const sign = num >= 0 ? '+' : ''
    return `${sign}${num.toFixed(2)}%`
  }

  const totalProfit = parseFloat(summary?.total_realized_profit || 0)
  const avgProfitRate = parseFloat(summary?.average_profit_rate || 0)

  return (
    <div className="summary-stats">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-label">총 자산</span>
            <span className="stat-value primary">{formatCurrency(totalAssets)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <span className="stat-label">총 수익률</span>
            <span className={`stat-value ${totalProfitRate >= 0 ? 'positive' : 'negative'}`}>
              {formatPercent(totalProfitRate)}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <span className="stat-label">총 실현 손익</span>
            <span className={`stat-value ${totalProfit >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(totalProfit)}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-label">평균 수익률</span>
            <span className={`stat-value ${avgProfitRate >= 0 ? 'positive' : 'negative'}`}>
              {formatPercent(avgProfitRate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SummaryStats

