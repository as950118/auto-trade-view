import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import './AuthPage.css'

/** StrictMode/리렌더로 같은 code가 두 번 교환되는 것 방지 */
const handledCodes = new Set()

const OAuth2CallbackPage = () => {
  const [searchParams] = useSearchParams()
  const { googleOAuth2Callback } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')

  useEffect(() => {
    if (oauthError) {
      setError('Google 로그인이 취소되었습니다.')
      setLoading(false)
      const t = setTimeout(() => navigate('/login'), 2000)
      return () => clearTimeout(t)
    }

    if (!code) {
      setError('인증 코드를 받지 못했습니다.')
      setLoading(false)
      const t = setTimeout(() => navigate('/login'), 2000)
      return () => clearTimeout(t)
    }

    // 이미 처리한 code면 스킵 (StrictMode 이중 mount 포함)
    if (handledCodes.has(code)) {
      return
    }
    handledCodes.add(code)

    const handleCallback = async () => {
      try {
        const result = await googleOAuth2Callback(code)
        if (result.success) {
          navigate('/dashboard', { replace: true })
        } else {
          handledCodes.delete(code)
          setError(result.error || '로그인에 실패했습니다.')
          setLoading(false)
          setTimeout(() => navigate('/login'), 15000)
        }
      } catch (err) {
        handledCodes.delete(code)
        setError('로그인 처리 중 오류가 발생했습니다.')
        setLoading(false)
        setTimeout(() => navigate('/login'), 15000)
      }
    }

    handleCallback()
    // code만 의존 — callback 함수 참조 변경으로 재호출 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, oauthError, navigate])

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
