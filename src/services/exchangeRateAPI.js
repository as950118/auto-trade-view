// 환율 정보를 가져오는 유틸리티
// 한국은행 API 또는 공개 환율 API 사용

const EXCHANGE_RATE_CACHE_KEY = 'exchange_rate_cache'
const CACHE_DURATION = 60 * 60 * 1000 // 1시간

export const exchangeRateAPI = {
  // 환율 정보 가져오기 (캐시 사용)
  getExchangeRate: async () => {
    // 캐시 확인
    const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY)
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached)
      const now = Date.now()
      if (now - timestamp < CACHE_DURATION) {
        return rate
      }
    }

    try {
      // 한국은행 환율 API 또는 공개 API 사용
      // 여기서는 간단하게 ExchangeRate-API 사용 (무료)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      const data = await response.json()
      const krwRate = data.rates?.KRW || 1300 // 기본값 1300원
      
      // 캐시 저장
      localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify({
        rate: krwRate,
        timestamp: Date.now()
      }))
      
      return krwRate
    } catch (error) {
      console.error('환율 조회 실패:', error)
      // 캐시된 값이 있으면 사용
      if (cached) {
        const { rate } = JSON.parse(cached)
        return rate
      }
      // 기본값 반환
      return 1300
    }
  },

  // KRW를 USD로 변환
  krwToUsd: async (krwAmount) => {
    const rate = await exchangeRateAPI.getExchangeRate()
    return krwAmount / rate
  },

  // USD를 KRW로 변환
  usdToKrw: async (usdAmount) => {
    const rate = await exchangeRateAPI.getExchangeRate()
    return usdAmount * rate
  },
}

