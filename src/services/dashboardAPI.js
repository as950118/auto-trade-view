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

  // 목표 비율 자동매매 계획
  getTargetAllocationPlans: async (params = {}) => {
    const response = await api.get('/api/target-allocation-plans/', { params })
    return response.data
  },

  createTargetAllocationPlan: async (data) => {
    const response = await api.post('/api/target-allocation-plans/', data)
    return response.data
  },

  updateTargetAllocationPlan: async (id, data) => {
    const response = await api.patch(`/api/target-allocation-plans/${id}/`, data)
    return response.data
  },

  deleteTargetAllocationPlan: async (id) => {
    const response = await api.delete(`/api/target-allocation-plans/${id}/`)
    return response.data
  },

  // 전략 템플릿
  getStrategies: async (params = {}) => {
    const response = await api.get('/api/strategies/', { params })
    return response.data
  },

  createStrategy: async (data) => {
    const response = await api.post('/api/strategies/', data)
    return response.data
  },

  updateStrategy: async (id, data) => {
    const response = await api.patch(`/api/strategies/${id}/`, data)
    return response.data
  },

  deleteStrategy: async (id) => {
    const response = await api.delete(`/api/strategies/${id}/`)
    return response.data
  },

  regenerateStrategyToken: async (id) => {
    const response = await api.post(`/api/strategies/${id}/regenerate_token/`)
    return response.data
  },

  // 전략 연동
  getStrategyLinks: async (params = {}) => {
    const response = await api.get('/api/strategy-links/', { params })
    return response.data
  },

  createStrategyLink: async (data) => {
    const response = await api.post('/api/strategy-links/', data)
    return response.data
  },

  updateStrategyLink: async (id, data) => {
    const response = await api.patch(`/api/strategy-links/${id}/`, data)
    return response.data
  },

  deleteStrategyLink: async (id) => {
    const response = await api.delete(`/api/strategy-links/${id}/`)
    return response.data
  },

  getAlertEvents: async (params = {}) => {
    const response = await api.get('/api/alert-events/', { params })
    return response.data
  },

  getAlertTradePlans: async (params = {}) => {
    const response = await api.get('/api/alert-trade-plans/', { params })
    return response.data
  },

  // 거래소 수수료 환급(페이백) 목록 조회
  getFeeRebates: async (params = {}) => {
    const response = await api.get('/api/fee-rebates/', { params })
    return response.data
  },
}
