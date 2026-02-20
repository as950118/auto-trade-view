import { useState, useMemo, useEffect } from 'react'
import { exchangeRateAPI } from '../../services/exchangeRateAPI'
import SellOrderModal from './SellOrderModal'
import './HoldingsTable.css'

const HoldingsTable = ({ holdings, accounts, selectedAccount, onClearAccountFilter, onSellSuccess }) => {
  const [displayCurrency, setDisplayCurrency] = useState('original') // 'original', 'KRW', 'USD'
  const [exchangeRate, setExchangeRate] = useState(1300) // USD/KRW 환율
  const [loadingRate, setLoadingRate] = useState(false)
  
  // 정렬 상태
  const [sortField, setSortField] = useState('totalValue') // 기본값: 총 가치
  const [sortDirection, setSortDirection] = useState('desc') // 'asc' | 'desc'
  
  // 필터 상태
  const [filters, setFilters] = useState({
    currency: 'all', // 'all', 'KRW', 'USD', 'USDT', 'BTC', 'ETH', etc.
    isCrypto: 'all', // 'all', 'crypto', 'stock'
    searchText: '', // 종목명/티커 검색
  })

  // 매도 모달
  const [sellModalOpen, setSellModalOpen] = useState(false)
  const [sellModalHolding, setSellModalHolding] = useState(null)
  const [sellModalCurrency, setSellModalCurrency] = useState('KRW')

  const openSellModal = (holdingGroup, currency) => {
    setSellModalHolding(holdingGroup)
    setSellModalCurrency(currency || 'KRW')
    setSellModalOpen(true)
  }

  const closeSellModal = () => {
    setSellModalOpen(false)
    setSellModalHolding(null)
  }

  useEffect(() => {
    // 환율 로드
    const loadExchangeRate = async () => {
      setLoadingRate(true)
      try {
        const rate = await exchangeRateAPI.getExchangeRate()
        setExchangeRate(rate)
      } catch (error) {
        console.error('환율 로드 실패:', error)
      } finally {
        setLoadingRate(false)
      }
    }
    loadExchangeRate()
  }, [])

  // 화폐단위별로 그룹화하고, 각 화폐단위 내에서 종목별로 그룹화
  const groupedByCurrency = useMemo(() => {
    const currencyGroups = {}
    
    holdings.forEach((holding) => {
      // 필터링: 계좌 (클라이언트 사이드 필터링)
      if (selectedAccount && holding.account?.id !== selectedAccount) {
        return
      }
      
      const currency = holding.symbol?.currency || 'KRW'
      const currencyDisplay = holding.symbol?.currency_display || currency
      
      // 필터링: 화폐단위
      if (filters.currency !== 'all' && currency !== filters.currency) {
        return
      }
      
      // 필터링: 암호화폐 여부
      if (filters.isCrypto !== 'all') {
        const isCrypto = holding.symbol?.is_crypto || false
        if (filters.isCrypto === 'crypto' && !isCrypto) return
        if (filters.isCrypto === 'stock' && isCrypto) return
      }
      
      // 필터링: 검색어
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase()
        const ticker = (holding.symbol?.ticker || '').toLowerCase()
        const name = (holding.symbol?.name || '').toLowerCase()
        if (!ticker.includes(searchLower) && !name.includes(searchLower)) {
          return
        }
      }
      
      if (!currencyGroups[currency]) {
        currencyGroups[currency] = {
          currency,
          currencyDisplay,
          holdings: {},
        }
      }
      
      const symbolKey = holding.symbol?.ticker || 'unknown'
      const group = currencyGroups[currency].holdings
      
      if (!group[symbolKey]) {
        group[symbolKey] = {
          symbol: holding.symbol,
          totalQuantity: 0,
          totalCost: 0,
          totalValue: 0,
          totalProfitLoss: 0,
          accounts: new Set(),
          holdings: [],
        }
      }
      
      const quantity = parseFloat(holding.quantity || 0)
      const averagePrice = parseFloat(holding.average_price || 0)
      const currentPrice = parseFloat(holding.current_price || 0)
      const totalValue = parseFloat(holding.total_value || 0)
      const profitLoss = parseFloat(holding.profit_loss || 0)
      const cost = quantity * averagePrice
      
      group[symbolKey].totalQuantity += quantity
      group[symbolKey].totalCost += cost
      group[symbolKey].totalValue += totalValue
      group[symbolKey].totalProfitLoss += profitLoss
      group[symbolKey].accounts.add(holding.account?.id)
      group[symbolKey].holdings.push(holding)
    })
    
    // 각 화폐단위별로 평균 수익률 계산
    Object.values(currencyGroups).forEach(currencyGroup => {
      Object.values(currencyGroup.holdings).forEach(group => {
        if (group.totalCost > 0) {
          group.averageProfitRate = (group.totalProfitLoss / group.totalCost) * 100
        } else {
          group.averageProfitRate = 0
        }
      })
      
      // 정렬 적용
      const holdingsList = Object.values(currencyGroup.holdings)
      holdingsList.sort((a, b) => {
        let aValue, bValue
        
        switch (sortField) {
          case 'ticker':
            aValue = (a.symbol?.ticker || '').toLowerCase()
            bValue = (b.symbol?.ticker || '').toLowerCase()
            break
          case 'name':
            aValue = (a.symbol?.name || '').toLowerCase()
            bValue = (b.symbol?.name || '').toLowerCase()
            break
          case 'quantity':
            aValue = a.totalQuantity
            bValue = b.totalQuantity
            break
          case 'averagePrice':
            aValue = a.totalCost > 0 ? a.totalCost / a.totalQuantity : 0
            bValue = b.totalCost > 0 ? b.totalCost / b.totalQuantity : 0
            break
          case 'currentPrice':
            aValue = a.holdings.length > 0 ? (a.holdings[0].current_price || 0) : 0
            bValue = b.holdings.length > 0 ? (b.holdings[0].current_price || 0) : 0
            break
          case 'totalValue':
            aValue = a.totalValue
            bValue = b.totalValue
            break
          case 'profitLoss':
            aValue = a.totalProfitLoss
            bValue = b.totalProfitLoss
            break
          case 'profitRate':
            aValue = a.averageProfitRate
            bValue = b.averageProfitRate
            break
          default:
            aValue = a.totalValue
            bValue = b.totalValue
        }
        
        if (typeof aValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        } else {
          return sortDirection === 'asc' 
            ? aValue - bValue
            : bValue - aValue
        }
      })
      
      // 정렬된 순서로 다시 객체로 변환
      currencyGroup.holdings = {}
      holdingsList.forEach(holding => {
        const symbolKey = holding.symbol?.ticker || 'unknown'
        currencyGroup.holdings[symbolKey] = holding
      })
    })
    
    return Object.values(currencyGroups)
  }, [holdings, filters, sortField, sortDirection, selectedAccount]) // selectedAccount 의존성 추가

  // 환율 변환 함수
  const convertValue = (value, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return value
    
    // KRW -> USD
    if (fromCurrency === 'KRW' && toCurrency === 'USD') {
      return value / exchangeRate
    }
    // USD -> KRW
    if (fromCurrency === 'USD' && toCurrency === 'KRW') {
      return value * exchangeRate
    }
    // USDT -> USD (거의 동일)
    if (fromCurrency === 'USDT' && toCurrency === 'USD') {
      return value
    }
    // USDT -> KRW
    if (fromCurrency === 'USDT' && toCurrency === 'KRW') {
      return value * exchangeRate
    }
    
    return value
  }

  const formatCurrency = (value, currency = 'KRW') => {
    const currencyMap = {
      'KRW': 'ko-KR',
      'USD': 'en-US',
      'USDT': 'en-US',
      'BTC': 'en-US',
      'ETH': 'en-US',
    }
    
    const locale = currencyMap[currency] || 'ko-KR'
    const currencyCode = currency === 'USDT' ? 'USD' : currency
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: currency === 'KRW' ? 0 : 2,
    }).format(value)
  }

  const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  const formatPercent = (value) => {
    const num = parseFloat(value || 0)
    const sign = num >= 0 ? '+' : ''
    return `${sign}${num.toFixed(2)}%`
  }

  const getAccountName = (accountId) => {
    const account = accounts.find((acc) => acc.id === accountId)
    return account ? `${account.broker?.name} (${account.account_number})` : '알 수 없음'
  }

  // 정렬 핸들러
  const handleSort = (field) => {
    if (sortField === field) {
      // 같은 필드면 방향 전환
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // 다른 필드면 내림차순으로 설정
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // 필터 핸들러
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  // 사용 가능한 화폐단위 목록 추출
  const availableCurrencies = useMemo(() => {
    const currencies = new Set()
    holdings.forEach(holding => {
      const currency = holding.symbol?.currency || 'KRW'
      currencies.add(currency)
    })
    return Array.from(currencies).sort()
  }, [holdings])

  // 정렬 아이콘 표시
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <span className="sort-icon">↕</span>
    }
    return sortDirection === 'asc' 
      ? <span className="sort-icon">↑</span>
      : <span className="sort-icon">↓</span>
  }

  // 모든 화폐단위를 하나의 통화로 변환해서 합산
  const calculateTotalInCurrency = (targetCurrency) => {
    let totalValue = 0
    let totalProfitLoss = 0
    let totalCost = 0

    groupedByCurrency.forEach(currencyGroup => {
      const holdingsList = Object.values(currencyGroup.holdings)
      holdingsList.forEach(holding => {
        const value = convertValue(holding.totalValue, currencyGroup.currency, targetCurrency)
        const profit = convertValue(holding.totalProfitLoss, currencyGroup.currency, targetCurrency)
        const cost = convertValue(holding.totalCost, currencyGroup.currency, targetCurrency)
        
        totalValue += value
        totalProfitLoss += profit
        totalCost += cost
      })
    })

    return {
      totalValue,
      totalProfitLoss,
      totalCost,
      profitRate: totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0
    }
  }

  return (
    <div className="holdings-table-container">
      {/* 필터 및 환율 변환 컨트롤 - 항상 표시 */}
      <div className="holdings-controls">
        {/* 계좌 필터 배지 (선택된 계좌가 있을 때) */}
        {selectedAccount && onClearAccountFilter && (
          <div className="account-filter-badge">
            <span className="badge-label">
              계좌 필터: {accounts.find(acc => acc.id === selectedAccount)?.broker?.name || '알 수 없음'} 
              ({accounts.find(acc => acc.id === selectedAccount)?.account_number || ''})
            </span>
            <button
              className="clear-filter-btn"
              onClick={onClearAccountFilter}
              title="계좌 필터 해제"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* 필터 섹션 */}
        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="currency-filter">화폐단위:</label>
            <select
              id="currency-filter"
              value={filters.currency}
              onChange={(e) => handleFilterChange('currency', e.target.value)}
              className="filter-select"
            >
              <option value="all">전체</option>
              {availableCurrencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="crypto-filter">종류:</label>
            <select
              id="crypto-filter"
              value={filters.isCrypto}
              onChange={(e) => handleFilterChange('isCrypto', e.target.value)}
              className="filter-select"
            >
              <option value="all">전체</option>
              <option value="crypto">암호화폐</option>
              <option value="stock">주식</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="search-filter">검색:</label>
            <input
              id="search-filter"
              type="text"
              placeholder="종목명 또는 티커 검색"
              value={filters.searchText}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
        
        {/* 환율 변환 컨트롤 */}
        <div className="currency-converter-toggle">
          <div className="toggle-group">
            <button
              className={`toggle-btn ${displayCurrency === 'original' ? 'active' : ''}`}
              onClick={() => setDisplayCurrency('original')}
              title="원래 화폐단위로 표시"
            >
              원래 화폐
            </button>
            <button
              className={`toggle-btn ${displayCurrency === 'KRW' ? 'active' : ''}`}
              onClick={() => setDisplayCurrency('KRW')}
              title="모든 종목을 원화로 변환"
            >
              원화
            </button>
            <button
              className={`toggle-btn ${displayCurrency === 'USD' ? 'active' : ''}`}
              onClick={() => setDisplayCurrency('USD')}
              title="모든 종목을 달러로 변환"
            >
              달러
            </button>
          </div>
          {loadingRate ? (
            <span className="exchange-rate-badge">환율 로딩 중...</span>
          ) : (
            <span className="exchange-rate-badge">
              1 USD = {formatCurrency(exchangeRate, 'KRW')}
            </span>
          )}
          {(displayCurrency === 'KRW' || displayCurrency === 'USD') && (
            <div className="converted-summary">
              <span className="summary-text">
                전체 합계: <strong>{formatCurrency(calculateTotalInCurrency(displayCurrency).totalValue, displayCurrency)}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {groupedByCurrency.map((currencyGroup) => {
        const holdingsList = Object.values(currencyGroup.holdings)
        
        if (holdingsList.length === 0) return null
        
        // 표시할 화폐 결정
        const displayCurr = displayCurrency === 'original' 
          ? currencyGroup.currency === 'USDT' ? 'USD' : currencyGroup.currency
          : displayCurrency
        
        // 해당 화폐단위의 총 가치 계산
        const totalValue = holdingsList.reduce((sum, h) => {
          if (displayCurrency === 'original') {
            return sum + h.totalValue
          }
          return sum + convertValue(h.totalValue, currencyGroup.currency, displayCurr)
        }, 0)
        
        const totalProfitLoss = holdingsList.reduce((sum, h) => {
          if (displayCurrency === 'original') {
            return sum + h.totalProfitLoss
          }
          return sum + convertValue(h.totalProfitLoss, currencyGroup.currency, displayCurr)
        }, 0)
        
        const totalCost = holdingsList.reduce((sum, h) => {
          if (displayCurrency === 'original') {
            return sum + h.totalCost
          }
          return sum + convertValue(h.totalCost, currencyGroup.currency, displayCurr)
        }, 0)
        
        const totalProfitRate = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0

        return (
          <div key={currencyGroup.currency} className="currency-section">
            <div className="currency-header">
              <h3 className="currency-title">
                {currencyGroup.currencyDisplay} 보유 종목
                {displayCurrency !== 'original' && (
                  <span className="converted-badge">
                    ({displayCurr}로 변환)
                  </span>
                )}
              </h3>
              <div className="currency-summary">
                <span className="summary-label">총 가치:</span>
                <span className="summary-value">
                  {formatCurrency(totalValue, displayCurr)}
                </span>
                <span className="summary-label">평가 손익:</span>
                <span className={`summary-value ${totalProfitRate >= 0 ? 'profit' : 'loss'}`}>
                  {formatCurrency(totalProfitLoss, displayCurr)}
                </span>
                <span className="summary-label">수익률:</span>
                <span className={`summary-value ${totalProfitRate >= 0 ? 'profit' : 'loss'}`}>
                  {formatPercent(totalProfitRate)}
                </span>
              </div>
            </div>
            
            <table className="holdings-table">
              <thead>
                <tr>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('ticker')}
                  >
                    종목 {getSortIcon('ticker')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('quantity')}
                  >
                    보유 수량 {getSortIcon('quantity')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('averagePrice')}
                  >
                    평균 단가 {getSortIcon('averagePrice')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('currentPrice')}
                  >
                    현재가 {getSortIcon('currentPrice')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('totalValue')}
                  >
                    총 가치 {getSortIcon('totalValue')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('profitLoss')}
                  >
                    평가 손익 {getSortIcon('profitLoss')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('profitRate')}
                  >
                    수익률 {getSortIcon('profitRate')}
                  </th>
                  <th>보유 계좌</th>
                  <th className="th-action">매도</th>
                </tr>
              </thead>
              <tbody>
                {holdingsList.map((holding, index) => {
                  const avgPrice = holding.totalQuantity > 0 
                    ? holding.totalCost / holding.totalQuantity 
                    : 0
                  const isPositive = holding.averageProfitRate >= 0

                  // 변환된 값 계산
                  const displayAvgPrice = displayCurrency === 'original'
                    ? avgPrice
                    : convertValue(avgPrice, currencyGroup.currency, displayCurr)
                  
                  const displayCurrentPrice = holding.holdings.length > 0 && holding.holdings[0].current_price
                    ? (displayCurrency === 'original'
                        ? holding.holdings[0].current_price
                        : convertValue(holding.holdings[0].current_price, currencyGroup.currency, displayCurr))
                    : null
                  
                  const displayTotalValue = displayCurrency === 'original'
                    ? holding.totalValue
                    : convertValue(holding.totalValue, currencyGroup.currency, displayCurr)
                  
                  const displayProfitLoss = displayCurrency === 'original'
                    ? holding.totalProfitLoss
                    : convertValue(holding.totalProfitLoss, currencyGroup.currency, displayCurr)

                  return (
                    <tr key={index}>
                      <td>
                        <div className="symbol-info">
                          <span className="symbol-ticker">
                            {holding.symbol?.ticker || 'N/A'}
                          </span>
                          <span className="symbol-name">
                            {holding.symbol?.name || '알 수 없음'}
                          </span>
                          {holding.symbol?.is_crypto && (
                            <span className="crypto-tag">암호화폐</span>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        {formatNumber(holding.totalQuantity, 4)}
                      </td>
                      <td className="text-right">
                        {formatCurrency(displayAvgPrice, displayCurr)}
                        {displayCurrency !== 'original' && (
                          <span className="original-value">
                            ({formatCurrency(avgPrice, currencyGroup.currency)})
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        {displayCurrentPrice
                          ? (
                            <>
                              {formatCurrency(displayCurrentPrice, displayCurr)}
                              {displayCurrency !== 'original' && (
                                <span className="original-value">
                                  ({formatCurrency(holding.holdings[0].current_price, currencyGroup.currency)})
                                </span>
                              )}
                            </>
                          )
                          : '-'}
                      </td>
                      <td className="text-right total-value">
                        {formatCurrency(displayTotalValue, displayCurr)}
                        {displayCurrency !== 'original' && (
                          <span className="original-value">
                            ({formatCurrency(holding.totalValue, currencyGroup.currency)})
                          </span>
                        )}
                      </td>
                      <td className={`text-right ${isPositive ? 'profit' : 'loss'}`}>
                        {formatCurrency(displayProfitLoss, displayCurr)}
                        {displayCurrency !== 'original' && (
                          <span className="original-value">
                            ({formatCurrency(holding.totalProfitLoss, currencyGroup.currency)})
                          </span>
                        )}
                      </td>
                      <td className={`text-right ${isPositive ? 'profit' : 'loss'}`}>
                        {formatPercent(holding.averageProfitRate)}
                      </td>
                      <td>
                        <div className="accounts-list">
                          {Array.from(holding.accounts).map((accountId) => (
                            <span key={accountId} className="account-tag">
                              {getAccountName(accountId)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="td-sell">
                        <button
                          type="button"
                          className="btn-sell-row"
                          onClick={() => openSellModal(holding, currencyGroup.currency)}
                          title="매도 주문"
                        >
                          매도
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
      
      {/* 필터 결과가 없을 때 메시지 표시 */}
      {groupedByCurrency.length === 0 && (
        <div className="holdings-empty">
          <p>필터 조건에 맞는 보유 종목이 없습니다.</p>
          <p className="empty-hint">필터를 변경하여 다시 검색해보세요.</p>
        </div>
      )}

      <SellOrderModal
        isOpen={sellModalOpen}
        onClose={closeSellModal}
        onSuccess={onSellSuccess}
        holdingGroup={sellModalHolding}
        accounts={accounts}
        currency={sellModalCurrency}
      />
    </div>
  )
}

export default HoldingsTable
