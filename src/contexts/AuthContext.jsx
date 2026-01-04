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
        // username만 사용 (user_id는 사용하지 않음)
        if (payload.username) {
          setUser({ username: payload.username })
        } else {
          // 토큰에 username이 없으면 로컬 스토리지에서 가져오기
          const savedUsername = localStorage.getItem('username')
          if (savedUsername) {
            setUser({ username: savedUsername })
          }
        }
      } catch (e) {
        console.error('Token decode error:', e)
        // 로컬 스토리지에서 username 가져오기 시도
        const savedUsername = localStorage.getItem('username')
        if (savedUsername) {
          setUser({ username: savedUsername })
        } else {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const data = await authAPI.login(username, password)
      localStorage.setItem('accessToken', data.access)
      localStorage.setItem('refreshToken', data.refresh)
      localStorage.setItem('username', username) // username 저장
      setUser({ username })
      return { success: true }
    } catch (error) {
      let errorMessage = '로그인에 실패했습니다.'
      
      if (error.response?.data) {
        const data = error.response.data
        
        if (data.detail) {
          errorMessage = data.detail
        } else if (data.non_field_errors) {
          errorMessage = data.non_field_errors[0]
        } else if (typeof data === 'string') {
          errorMessage = data
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  const signup = async (username, email, password, password2) => {
    try {
      await authAPI.signup(username, email, password, password2)
      // 회원가입 후 자동 로그인
      return await login(username, password)
    } catch (error) {
      // 에러 메시지 추출
      let errorMessage = '회원가입에 실패했습니다.'
      
      if (error.response?.data) {
        const data = error.response.data
        
        // 비밀번호 관련 에러
        if (data.password) {
          if (Array.isArray(data.password)) {
            errorMessage = data.password[0]
          } else if (typeof data.password === 'string') {
            errorMessage = data.password
          } else if (data.password.non_field_errors) {
            errorMessage = data.password.non_field_errors[0]
          }
        }
        // 사용자명 관련 에러
        else if (data.username) {
          if (Array.isArray(data.username)) {
            errorMessage = `사용자명: ${data.username[0]}`
          } else {
            errorMessage = `사용자명: ${data.username}`
          }
        }
        // 이메일 관련 에러
        else if (data.email) {
          if (Array.isArray(data.email)) {
            errorMessage = `이메일: ${data.email[0]}`
          } else {
            errorMessage = `이메일: ${data.email}`
          }
        }
        // 일반 에러 메시지
        else if (data.detail) {
          errorMessage = data.detail
        }
        // 기타 필드 에러
        else {
          const firstError = Object.values(data)[0]
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0]
          } else if (typeof firstError === 'string') {
            errorMessage = firstError
          }
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('username')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

