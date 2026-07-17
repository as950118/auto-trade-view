import axios from 'axios'

const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'https://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터: 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터: 토큰 갱신 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
            refresh: refreshToken,
          })

          const { access } = response.data
          localStorage.setItem('accessToken', access)
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const authAPI = {
  login: async (username, password) => {
    try {
    const response = await api.post('/api/token/', { username, password })
    return response.data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },
  signup: async (username, email, password, password2) => {
    try {
    const response = await api.post('/api/users/', {
      username,
      email,
      password,
        password2: password2 || password, // 비밀번호 확인
    })
    return response.data
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  },
  refreshToken: async (refreshToken) => {
    try {
    const response = await api.post('/api/token/refresh/', {
      refresh: refreshToken,
    })
    return response.data
    } catch (error) {
      console.error('Refresh token error:', error)
      throw error
    }
  },
  getGoogleOAuth2Url: async () => {
    try {
      const response = await api.get('/api/oauth2/google/login/')
      return response.data
    } catch (error) {
      console.error('Get Google OAuth2 URL error:', error)
      throw error
    }
  },
  googleOAuth2Callback: async (code) => {
    try {
      const response = await api.post('/api/oauth2/google/callback/', { code })
      return response.data
    } catch (error) {
      console.error('Google OAuth2 callback error:', error)
      throw error
    }
  },
  getMe: async () => {
    const response = await api.get('/api/users/me/')
    return response.data
  },
  setPassword: async ({ password, password2, current_password }) => {
    const body = { password, password2 }
    if (current_password) {
      body.current_password = current_password
    }
    const response = await api.post('/api/users/me/password/', body)
    return response.data
  },
}

export default api

