// PRD-0003: 포트폴리오/종목 자산군(주식·코인)과 계좌 브로커 자산군 간 정합성 판단 공용 유틸.
// PortfolioLinkFormModal / TargetAllocationPlan 생성 폼 / BuyOrderModal에서 공유한다.

export const getAssetType = (portfolio) => {
  const holdings = portfolio.holdings || []
  if (holdings.length === 0) return 'EMPTY'
  const hasCrypto = holdings.some((h) => h.symbol?.is_crypto)
  const hasStock = holdings.some((h) => !h.symbol?.is_crypto)
  if (hasCrypto && hasStock) return 'MIXED'
  return hasCrypto ? 'CRYPTO' : 'STOCK'
}

// MIXED 포트폴리오는 단일 브로커 계좌와 호환될 수 없다(PRD-0003 §6 Assumptions).
export const isAccountCompatibleWithAssetType = (account, assetType) => {
  if (!account) return false
  const isCryptoAccount = !!account.broker?.is_crypto_exchange
  if (assetType === 'CRYPTO') return isCryptoAccount
  if (assetType === 'STOCK') return !isCryptoAccount
  if (assetType === 'EMPTY') return true
  return false
}

export const isAccountCompatibleWithSymbol = (account, symbol) => {
  if (!account || !symbol) return false
  return !!account.broker?.is_crypto_exchange === !!symbol.is_crypto
}
