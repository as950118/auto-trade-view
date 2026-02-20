import { useMemo, useState, useEffect } from 'react'
import './AccountCard.css'

const AccountCard = ({ account, onClick, onEdit, onDelete, isSelected, holdings = [] }) => {
  // 표시할 통화 선택 (KRW 또는 USD)
  // 초기값은 null로 설정하고, useMemo에서 계산된 기본값 사용
  const [displayCurrency, setDisplayCurrency] = useState(null)
  // 계좌의 보유 종목을 화폐단위별로 계산
  const currencyBreakdown = useMemo(() => {
    const breakdown = {
      KRW: { cash: 0, stock: 0, total: 0 },
      USD: { cash: 0, stock: 0, total: 0 },
    }

    // 계좌의 기본 정보 (백엔드에서 제공하는 경우)
    // total_assets = cash_balance + stock_value
    if (account.cash_balance_krw !== undefined && account.cash_balance_krw !== null) {
      breakdown.KRW.cash = parseFloat(account.cash_balance_krw || '0')
    }
    if (account.stock_value_krw !== undefined && account.stock_value_krw !== null) {
      breakdown.KRW.stock = parseFloat(account.stock_value_krw || '0')
    }
    // total은 cash + stock의 합으로 계산 (API의 total_assets_krw를 우선 사용하되, 없으면 계산)
    if (account.total_assets_krw !== undefined && account.total_assets_krw !== null) {
      breakdown.KRW.total = parseFloat(account.total_assets_krw || '0')
    } else {
      breakdown.KRW.total = breakdown.KRW.cash + breakdown.KRW.stock
    }

    if (account.cash_balance_usd !== undefined && account.cash_balance_usd !== null) {
      breakdown.USD.cash = parseFloat(account.cash_balance_usd || '0')
    }
    if (account.stock_value_usd !== undefined && account.stock_value_usd !== null) {
      breakdown.USD.stock = parseFloat(account.stock_value_usd || '0')
    }
    // total은 cash + stock의 합으로 계산 (API의 total_assets_usd를 우선 사용하되, 없으면 계산)
    if (account.total_assets_usd !== undefined && account.total_assets_usd !== null) {
      breakdown.USD.total = parseFloat(account.total_assets_usd || '0')
    } else {
      breakdown.USD.total = breakdown.USD.cash + breakdown.USD.stock
    }

    // // 보유 종목 데이터가 있으면 추가 계산
    // if (holdings.length > 0) {
    //   const accountHoldings = holdings.filter(h => h.account?.id === account.id)
      
    //   accountHoldings.forEach(holding => {
    //     const currency = holding.symbol?.currency || 'KRW'
    //     const value = parseFloat(holding.total_value || 0)
        
    //     if (currency === 'KRW' || currency === '원') {
    //       breakdown.KRW.stock += value
    //       breakdown.KRW.total += value
    //     } else if (currency === 'USD' || currency === '달러' || currency === 'USDT' || currency === '테더') {
    //       breakdown.USD.stock += value
    //       breakdown.USD.total += value
    //     }
    //   })
    // }

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

  // 필드가 존재하는지 확인
  const hasKRWField = account.total_assets_krw !== undefined && account.total_assets_krw !== null
  const hasUSDField = account.total_assets_usd !== undefined && account.total_assets_usd !== null
  
  // 실제 값이 있는지 확인 (0보다 큰 경우)
  const hasKRWValue = currencyBreakdown.KRW.total > 0
  const hasUSDValue = currencyBreakdown.USD.total > 0
  
  // 필드가 있고 값이 0보다 크면 표시 (값이 0이면 표시하지 않음)
  const hasKRW = hasKRWField && hasKRWValue
  const hasUSD = hasUSDField && hasUSDValue
  
  // 둘 다 있는 경우에만 통화 전환 버튼 표시
  const showCurrencyToggle = hasKRW && hasUSD
  
  // 표시할 통화 결정 (기본값: 브로커 국가에 따라 결정, 없으면 원화 우선)
  const brokerCountry = account.broker?.country
  const defaultCurrency = useMemo(() => {
    if (brokerCountry === 'US' && hasUSD) {
      return 'USD'
    } else if (hasKRW) {
      return 'KRW'
    } else if (hasUSD) {
      return 'USD'
    }
    return 'KRW'
  }, [brokerCountry, hasKRW, hasUSD])
  
  // displayCurrency 초기화
  useEffect(() => {
    if (displayCurrency === null) {
      setDisplayCurrency(defaultCurrency)
    } else if ((displayCurrency === 'KRW' && !hasKRW) || (displayCurrency === 'USD' && !hasUSD)) {
      // 현재 선택된 통화가 유효하지 않으면 기본값으로 변경
      setDisplayCurrency(defaultCurrency)
    }
  }, [displayCurrency, defaultCurrency, hasKRW, hasUSD])
  
  // 현재 표시할 통화 결정
  const currentDisplayCurrency = displayCurrency || defaultCurrency
  
  // 표시할 통화 결정
  const shouldShowKRW = currentDisplayCurrency === 'KRW' && hasKRW
  const shouldShowUSD = currentDisplayCurrency === 'USD' && hasUSD

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
        <div className="account-number">{account.account_number || '-'}</div>
      </div>

      <div className="account-card-body">
        {/* 통화 전환 버튼 (원화와 달러 둘 다 있을 때만) */}
        {showCurrencyToggle && (
          <div className="currency-toggle-buttons">
            <button
              className={`currency-toggle-btn ${currentDisplayCurrency === 'KRW' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setDisplayCurrency('KRW')
              }}
            >
              원화
            </button>
            <button
              className={`currency-toggle-btn ${currentDisplayCurrency === 'USD' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setDisplayCurrency('USD')
              }}
            >
              달러
            </button>
          </div>
        )}

        {/* 원화 자산 */}
        {hasKRW && shouldShowKRW && (
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
        {hasUSD && shouldShowUSD && (
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
