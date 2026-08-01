import { useState, useEffect } from 'react'
import { dashboardAPI } from '../../services/dashboardAPI'
import './PortfolioFormModal.css'

const ORDER_TYPES = [
  { value: 'MARKET', label: '시장가' },
  { value: 'LIMIT', label: '지정가' },
]

const PortfolioFormModal = ({ isOpen, onClose, onSuccess, portfolio = null, isStaff = false }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState('PRIVATE')
  const [orderType, setOrderType] = useState('MARKET')
  const [enabled, setEnabled] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setError('')
    if (portfolio) {
      setTitle(portfolio.title || '')
      setDescription(portfolio.description || '')
      setVisibility(portfolio.visibility || 'PRIVATE')
      setOrderType(portfolio.order_type || 'MARKET')
      setEnabled(portfolio.enabled !== false)
    } else {
      setTitle('')
      setDescription('')
      setVisibility('PRIVATE')
      setOrderType('MARKET')
      setEnabled(true)
    }
  }, [isOpen, portfolio])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) {
      setError('제목을 입력해 주세요.')
      return
    }
    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        visibility: isStaff ? visibility : 'PRIVATE',
        order_type: orderType,
        enabled,
      }
      if (portfolio) {
        await dashboardAPI.updatePortfolio(portfolio.id, payload)
      } else {
        await dashboardAPI.createPortfolio(payload)
      }
      onSuccess()
      onClose()
    } catch (err) {
      const data = err.response?.data
      setError(
        typeof data === 'string'
          ? data
          : data?.detail || JSON.stringify(data) || '저장에 실패했습니다.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="portfolio-modal-overlay" onClick={onClose}>
      <div className="portfolio-modal" onClick={(e) => e.stopPropagation()}>
        <div className="portfolio-modal-header">
          <h2>{portfolio ? '포트폴리오 수정' : '포트폴리오 추가'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="portfolio-form">
          {error && <div className="form-error">{error}</div>}

          <label className="form-field">
            <span>제목</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="form-field">
            <span>설명</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </label>
          {isStaff && (
            <label className="form-field">
              <span>공개 범위</span>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <option value="PRIVATE">비공개</option>
                <option value="PUBLIC">공개</option>
              </select>
            </label>
          )}
          <label className="form-field">
            <span>주문 타입</span>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
              {ORDER_TYPES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="form-checkbox">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span>활성</span>
          </label>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>취소</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PortfolioFormModal
