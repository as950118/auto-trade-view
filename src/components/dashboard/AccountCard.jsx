import { useMemo } from 'react'
import './AccountCard.css'

const AccountCard = ({ account, onClick, onEdit, onDelete, isSelected, holdings = [] }) => {
  // 계좌의 보유 종목을 화폐단위별로 계산
  const currencyBreakdown = useMemo(() => {
    const breakdown = {
      KRW: { cash: 0, stock: 0, total: 0 },
      USD: { cash: 0, stock: 0, total: 0 },
    }

    // 계좌의 기본 정보 (백엔드에서 제공하는 경우)
    if (account.total_assets_krw !== undefined && account.total_assets_krw !== null) {
      breakdown.KRW.cash = parseFloat(account.cash_balance_krw || 0)
      breakdown.KRW.stock = parseFloat(account.stock_value_krw || 0)
      breakdown.KRW.total = parseFloat(account.total_assets_krw || 0)
    }

    if (account.total_assets_usd !== undefined && account.total_assets_usd !== null) {
      breakdown.USD.cash = parseFloat(account.cash_balance_usd || 0)
      breakdown.USD.stock = parseFloat(account.stock_value_usd || 0)
      breakdown.USD.total = parseFloat(account.total_assets_usd || 0)
    }

    // 보유 종목 데이터가 있으면 추가 계산
    if (holdings.length > 0) {
      const accountHoldings = holdings.filter(h => h.account?.id === account.id)
      
      accountHoldings.forEach(holding => {
        const currency = holding.symbol?.currency || 'KRW'
        const value = parseFloat(holding.total_value || 0)
        
        if (currency === 'KRW' || currency === '원') {
          breakdown.KRW.stock += value
          breakdown.KRW.total += value
        } else if (currency === 'USD' || currency === '달러' || currency === 'USDT' || currency === '테더') {
          const targetCurrency = currency === 'USDT' || currency === '테더' ? 'USD' : 'USD'
          breakdown.USD.stock += value
          breakdown.USD.total += value
        }
      })
    }

    // 백엔드 데이터가 없고 보유 종목만 있는 경우, 예수금은 계좌 정보에서 가져오기
    if (breakdown.KRW.total === 0 && breakdown.USD.total === 0 && account.cash_balance) {
      // 기본값으로 KRW로 간주
      breakdown.KRW.cash = parseFloat(account.cash_balance || 0)
      breakdown.KRW.stock = parseFloat(account.stock_value || 0)
      breakdown.KRW.total = parseFloat(account.total_assets || 0)
    }

    return breakdown
  }, [account, holdings])

  const formatCurrency = (value, currency = 'KRW') => {
    const currencyMap = {
      'KRW': 'ko-KR',
      'USD': 'en-US',
    }
    
    const locale = currencyMap[currency] || 'ko-KR'
    const currencyCode = currency
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: currency === 'KRW' ? 0 : 2,
    }).format(value)
  }

  const formatPercent = (value) => {
    const num = parseFloat(value || 0)
    const sign = num >= 0 ? '+' : ''
    return `${sign}${num.toFixed(2)}%`
  }

  const profitRate = parseFloat(account.profit_rate || 0)
  const isPositive = profitRate >= 0

  // 총 자산이 있는 화폐단위만 표시
  const hasKRW = currencyBreakdown.KRW.total > 0
  const hasUSD = currencyBreakdown.USD.total > 0

  return (
    <div
      className={`account-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="account-card-header">
        <div className="account-broker">
          <span className="broker-name">{account.broker?.name || '알 수 없음'}</span>
          {account.broker?.is_crypto_exchange && (
            <span className="crypto-badge">암호화폐</span>
          )}
        </div>
        <div className="account-number">{account.account_number}</div>
      </div>

      <div className="account-card-body">
        {/* 원화 자산 */}
        {hasKRW && (
          <div className="currency-section">
            <div className="currency-label">원화 (KRW)</div>
            <div className="account-stat">
              <span className="stat-label">총 자산</span>
              <span className="stat-value total-assets">
                {formatCurrency(currencyBreakdown.KRW.total, 'KRW')}
              </span>
            </div>
            <div className="account-stats-row">
              <div className="account-stat">
                <span className="stat-label">예수금</span>
                <span className="stat-value">
                  {formatCurrency(currencyBreakdown.KRW.cash, 'KRW')}
                </span>
              </div>
              <div className="account-stat">
                <span className="stat-label">보유종목</span>
                <span className="stat-value">
                  {formatCurrency(currencyBreakdown.KRW.stock, 'KRW')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 달러 자산 */}
        {hasUSD && (
          <div className="currency-section">
            <div className="currency-label">달러 (USD)</div>
            <div className="account-stat">
              <span className="stat-label">총 자산</span>
              <span className="stat-value total-assets">
                {formatCurrency(currencyBreakdown.USD.total, 'USD')}
              </span>
            </div>
            <div className="account-stats-row">
              <div className="account-stat">
                <span className="stat-label">예수금</span>
                <span className="stat-value">
                  {formatCurrency(currencyBreakdown.USD.cash, 'USD')}
                </span>
              </div>
              <div className="account-stat">
                <span className="stat-label">보유종목</span>
                <span className="stat-value">
                  {formatCurrency(currencyBreakdown.USD.stock, 'USD')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 원화와 달러 둘 다 없는 경우 (레거시 호환) */}
        {!hasKRW && !hasUSD && (
          <>
            <div className="account-stat">
              <span className="stat-label">총 자산</span>
              <span className="stat-value total-assets">
                {formatCurrency(account.total_assets || 0, 'KRW')}
              </span>
            </div>
            <div className="account-stats-row">
              <div className="account-stat">
                <span className="stat-label">예수금</span>
                <span className="stat-value">
                  {formatCurrency(account.cash_balance || 0, 'KRW')}
                </span>
              </div>
              <div className="account-stat">
                <span className="stat-label">보유종목</span>
                <span className="stat-value">
                  {formatCurrency(account.stock_value || 0, 'KRW')}
                </span>
              </div>
            </div>
          </>
        )}

        <div className="account-profit">
          <span className="stat-label">수익률</span>
          <span className={`stat-value profit-rate ${isPositive ? 'positive' : 'negative'}`}>
            {formatPercent(profitRate)}
          </span>
        </div>
      </div>

      <div className="account-card-footer">
        <div className="account-status">
          <span className={`status-badge ${account.buy_enabled ? 'enabled' : 'disabled'}`}>
            매수 {account.buy_enabled ? '활성' : '비활성'}
          </span>
          <span className={`status-badge ${account.sell_enabled ? 'enabled' : 'disabled'}`}>
            매도 {account.sell_enabled ? '활성' : '비활성'}
          </span>
        </div>
        <div className="account-actions">
          {onEdit && (
            <button
              className="action-button edit-button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              title="수정"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              className="action-button delete-button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              title="삭제"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AccountCard
