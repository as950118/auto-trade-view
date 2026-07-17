import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import './AuthPage.css'

const OAuth2CallbackPage = () => {
  const [searchParams] = useSearchParams()
  const { googleOAuth2Callback } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (error) {
        setError('Google 로그인이 취소되었습니다.')
        setLoading(false)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
        return
      }

      if (!code) {
        setError('인증 코드를 받지 못했습니다.')
        setLoading(false)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
        return
      }

      try {
        const result = await googleOAuth2Callback(code)
        if (result.success) {
          navigate('/dashboard')
        } else {
          setError(result.error || '로그인에 실패했습니다.')
          setLoading(false)
          setTimeout(() => {
            navigate('/login')
          }, 15000)
        }
      } catch (err) {
        setError('로그인 처리 중 오류가 발생했습니다.')
        setLoading(false)
        setTimeout(() => {
          navigate('/login')
        }, 15000)
      }
    }

    handleCallback()
  }, [searchParams, googleOAuth2Callback, navigate])

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">로그인 처리 중...</h1>
            {loading && (
              <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
            )}
            {error && (
              <div className="auth-error" style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OAuth2CallbackPage
