import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api.js'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 토큰이 있으면 사용자 정보 확인
    const token = localStorage.getItem('accessToken')
    if (token) {
      // 토큰에서 사용자 정보 추출 (간단한 디코딩)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({ username: payload.username || payload.user_id })
      } catch (e) {
        console.error('Token decode error:', e)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const data = await authAPI.login(username, password)
      localStorage.setItem('accessToken', data.access)
      localStorage.setItem('refreshToken', data.refresh)
      setUser({ username })
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || '로그인에 실패했습니다.',
      }
    }
  }

  const signup = async (username, email, password) => {
    try {
      await authAPI.signup(username, email, password)
      // 회원가입 후 자동 로그인
      return await login(username, password)
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.password?.[0] || '회원가입에 실패했습니다.',
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

