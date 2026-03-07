import api from './api.js'

export const dashboardAPI = {
  // 계좌 목록 조회
  getAccounts: async () => {
    const response = await api.get('/api/accounts/')
    return response.data
  },

  // 계좌 생성
  createAccount: async (accountData) => {
    const response = await api.post('/api/accounts/', accountData)
    return response.data
  },

  // 계좌 수정
  updateAccount: async (accountId, accountData) => {
    const response = await api.patch(`/api/accounts/${accountId}/`, accountData)
    return response.data
  },

  // 계좌 삭제
  deleteAccount: async (accountId) => {
    const response = await api.delete(`/api/accounts/${accountId}/`)
    return response.data
  },

  // 종목 목록 조회 (매수용 검색)
  getSymbols: async (params = {}) => {
    const response = await api.get('/api/symbols/', { params })
    return response.data
  },

  // 브로커 목록 조회
  getBrokers: async () => {
    const response = await api.get('/api/brokers/')
    return response.data.results || response.data
  },

  // 주문 생성 (매수/매도)
  createOrder: async (orderData) => {
    const response = await api.post('/api/orders/', orderData)
    return response.data
  },

  // 주문 목록 조회
  getOrders: async (params = {}) => {
    const response = await api.get('/api/orders/', { params })
    return response.data
  },

  // 계좌별 주문 조회
  getOrdersByAccount: async (accountId) => {
    const response = await api.get('/api/orders/', {
      params: { account_id: accountId }
    })
    return response.data
  },

  // 보유 종목 조회
  getHoldings: async (accountId = null) => {
    const params = {}
    if (accountId) {
      params.account_id = accountId
    }
    const response = await api.get('/api/holdings/', { params })
    return response.data
  },

  // 계좌별 보유 종목 조회
  getHoldingsByAccount: async (accountId) => {
    const response = await api.get('/api/holdings/by_account/', {
      params: { account_id: accountId }
    })
    return response.data
  },

  // 체결된 주문만 조회 (보유종목) - 레거시, Holding API 사용 권장
  getFilledOrders: async (accountId = null) => {
    const params = { status: 'FILLED' }
    if (accountId) {
      params.account_id = accountId
    }
    const response = await api.get('/api/orders/', { params })
    return response.data
  },

  // 일일 실현 손익 조회
  getDailyProfits: async (params = {}) => {
    const response = await api.get('/api/daily-profits/', { params })
    return response.data
  },

  // 계좌별 일일 실현 손익
  getDailyProfitsByAccount: async (accountId) => {
    const response = await api.get('/api/daily-profits/by_account/', {
      params: { account_id: accountId }
    })
    return response.data
  },

  // 특정 날짜 실현 손익
  getDailyProfitByDate: async (date = null) => {
    const params = date ? { date } : {}
    const response = await api.get('/api/daily-profits/by_date/', { params })
    return response.data
  },

  // 최근 30일 요약
  getProfitSummary: async () => {
    const response = await api.get('/api/daily-profits/summary/')
    return response.data
  },
}
