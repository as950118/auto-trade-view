import './SummaryStats.css'
import PriceChange from '../ui/PriceChange'

const SummaryStats = ({
  summary,
  totalAssetsKrw = 0,
  totalAssetsUsd = 0,
  totalProfitLossKrw = 0,
  totalProfitLossUsd = 0,
  totalProfitRateKrw = 0,
  totalProfitRateUsd = 0,
}) => {
  const formatCurrency = (value, currency = 'KRW') => {
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'ko-KR', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: currency === 'KRW' ? 0 : 2,
    }).format(value)
  }

  const realizedProfit = parseFloat(summary?.total_realized_profit || 0)
  const hasKrw = totalAssetsKrw > 0 || totalProfitLossKrw !== 0
  const hasUsd = totalAssetsUsd > 0 || totalProfitLossUsd !== 0

  return (
    <div className="summary-stats">
      <div className="stats-grid">
        {hasKrw && (
          <>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <span className="stat-label">총 자산 (KRW)</span>
                <span className="stat-value primary">{formatCurrency(totalAssetsKrw, 'KRW')}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📉</div>
              <div className="stat-content">
                <span className="stat-label">평가손익 (KRW)</span>
                <PriceChange className="stat-value" value={totalProfitLossKrw} formatAbs={(v) => formatCurrency(v, 'KRW')} digits={0} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <span className="stat-label">수익률 (KRW)</span>
                <PriceChange className="stat-value" value={totalProfitRateKrw} />
              </div>
            </div>
          </>
        )}

        {hasUsd && (
          <>
            <div className="stat-card">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <span className="stat-label">총 자산 (USD)</span>
                <span className="stat-value primary">{formatCurrency(totalAssetsUsd, 'USD')}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📉</div>
              <div className="stat-content">
                <span className="stat-label">평가손익 (USD)</span>
                <PriceChange className="stat-value" value={totalProfitLossUsd} formatAbs={(v) => formatCurrency(v, 'USD')} digits={2} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <span className="stat-label">수익률 (USD)</span>
                <PriceChange className="stat-value" value={totalProfitRateUsd} />
              </div>
            </div>
          </>
        )}

        <div className="stat-card">
          <div className="stat-icon">🧾</div>
          <div className="stat-content">
            <span className="stat-label">총 실현 손익</span>
            <PriceChange className="stat-value" value={realizedProfit} formatAbs={(v) => formatCurrency(v, 'KRW')} digits={0} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SummaryStats
