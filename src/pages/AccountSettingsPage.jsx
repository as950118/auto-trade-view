import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { authAPI } from '../services/api'
import './AuthPage.css'

const AccountSettingsPage = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authAPI.getMe()
        setProfile(data)
      } catch (err) {
        setError('프로필을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatErrors = (data) => {
    if (!data) return '저장에 실패했습니다.'
    if (typeof data === 'string') return data
    if (data.detail) return data.detail
    return Object.entries(data)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\n')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (password !== password2) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    setSaving(true)
    try {
      const data = await authAPI.setPassword({
        password,
        password2,
        current_password: profile?.has_usable_password ? currentPassword : undefined,
      })
      setSuccess(data.message || '비밀번호가 설정되었습니다.')
      setProfile(data.user)
      setCurrentPassword('')
      setPassword('')
      setPassword2('')
    } catch (err) {
      setError(formatErrors(err.response?.data))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">계정 설정</h1>
            <p className="auth-subtitle">
              Google로 가입한 경우 비밀번호를 설정하면 ID/비밀번호로도 로그인할 수 있습니다.
            </p>
          </div>

          {loading && <p className="auth-subtitle">불러오는 중...</p>}
          {error && (
            <div className="auth-error" style={{ whiteSpace: 'pre-wrap' }}>
              {error}
            </div>
          )}
          {success && (
            <div
              className="auth-error"
              style={{
                backgroundColor: 'var(--color-status-success-bg)',
                color: 'var(--color-status-success-fg)',
                borderColor: 'var(--color-status-success-fg)',
              }}
            >
              {success}
            </div>
          )}

          {profile && (
            <>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>로그인 ID (사용자명)</label>
                <input type="text" value={profile.username} readOnly />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>이메일</label>
                <input type="text" value={profile.email || '-'} readOnly />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>표시 이름</label>
                <input type="text" value={profile.display_name || '-'} readOnly />
              </div>
              <p className="auth-subtitle" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                비밀번호 상태:{' '}
                {profile.has_usable_password
                  ? '설정됨 (변경 가능)'
                  : '미설정 (Google 전용 → 아래에서 설정)'}
              </p>

              <form onSubmit={handleSubmit} className="auth-form">
                {profile.has_usable_password && (
                  <div className="form-group">
                    <label htmlFor="currentPassword">현재 비밀번호</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="password">
                    {profile.has_usable_password ? '새 비밀번호' : '비밀번호 설정'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password2">비밀번호 확인</label>
                  <input
                    type="password"
                    id="password2"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <button type="submit" className="auth-button" disabled={saving}>
                  {saving
                    ? '저장 중...'
                    : profile.has_usable_password
                      ? '비밀번호 변경'
                      : '비밀번호 설정'}
                </button>
              </form>
            </>
          )}

          <p className="auth-subtitle" style={{ marginTop: '1.5rem' }}>
            <Link to="/dashboard">대시보드로 돌아가기</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AccountSettingsPage
