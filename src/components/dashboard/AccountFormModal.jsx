import { useState, useEffect } from 'react'
import { dashboardAPI } from '../../services/dashboardAPI'
import Button from '../ui/Button'
import './AccountFormModal.css'

const AccountFormModal = ({ isOpen, onClose, onSuccess, account = null }) => {
  const [brokers, setBrokers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    broker_id: '',
    account_number: '',
    account_password: '',
    api_key: '',
    api_secret: '',
    investment_limit: '',
    buy_enabled: true,
    sell_enabled: true,
    unified_margin: false,
    overseas_etp_enabled: false,
    derivative_etf_enabled: false,
  })

  useEffect(() => {
    if (isOpen) {
      loadBrokers()
      if (account) {
        // 수정 모드
        setFormData({
          broker_id: account.broker?.id || '',
          account_number: account.account_number || '',
          account_password: '', // 비밀번호는 비워둠
          api_key: account.api_key || '',
          api_secret: account.api_secret || '',
          investment_limit: account.investment_limit || '',
          buy_enabled: account.buy_enabled !== undefined ? account.buy_enabled : true,
          sell_enabled: account.sell_enabled !== undefined ? account.sell_enabled : true,
          unified_margin: account.unified_margin || false,
          overseas_etp_enabled: account.overseas_etp_enabled || false,
          derivative_etf_enabled: account.derivative_etf_enabled || false,
        })
      } else {
        // 생성 모드
        setFormData({
          broker_id: '',
          account_number: '',
          account_password: '',
          api_key: '',
          api_secret: '',
          investment_limit: '',
          buy_enabled: true,
          sell_enabled: true,
          unified_margin: false,
          overseas_etp_enabled: false,
          derivative_etf_enabled: false,
        })
      }
      setError('')
    }
  }, [isOpen, account])

  const loadBrokers = async () => {
    try {
      const brokersData = await dashboardAPI.getBrokers()
      setBrokers(brokersData)
    } catch (err) {
      console.error('Failed to load brokers:', err)
      setError('브로커 목록을 불러오는데 실패했습니다.')
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 빈 필드 제거
      const submitData = { ...formData }
      if (!submitData.api_key) delete submitData.api_key
      if (!submitData.api_secret) delete submitData.api_secret
      if (!submitData.investment_limit) delete submitData.investment_limit
      if (!submitData.account_password && account) delete submitData.account_password
      
      // 암호화폐 거래소인 경우 계좌번호와 계좌비밀번호 제거
      if (isCryptoExchange) {
        delete submitData.account_number
        delete submitData.account_password
      }

      if (account) {
        // 수정
        await dashboardAPI.updateAccount(account.id, submitData)
      } else {
        // 생성
        await dashboardAPI.createAccount(submitData)
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Account save error:', err)
      const errorData = err.response?.data
      if (errorData) {
        // 에러 메시지 추출
        const errorMessages = []
        Object.keys(errorData).forEach(key => {
          if (Array.isArray(errorData[key])) {
            errorMessages.push(`${key}: ${errorData[key][0]}`)
          } else if (typeof errorData[key] === 'string') {
            errorMessages.push(`${key}: ${errorData[key]}`)
          } else {
            errorMessages.push(`${key}: ${JSON.stringify(errorData[key])}`)
          }
        })
        setError(errorMessages.join(', ') || '계좌 저장에 실패했습니다.')
      } else {
        setError('계좌 저장에 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const selectedBroker = brokers.find(b => b.id === parseInt(formData.broker_id))
  const isCryptoExchange = selectedBroker?.is_crypto_exchange || false

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {account ? '계좌 수정' : '계좌 등록'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="account-form">
          <div className="form-group">
            <label htmlFor="broker_id">브로커 *</label>
            <select
              id="broker_id"
              name="broker_id"
              value={formData.broker_id}
              onChange={handleChange}
              required
              disabled={!!account} // 수정 시 브로커 변경 불가
            >
              <option value="">브로커를 선택하세요</option>
              {brokers.map(broker => (
                <option key={broker.id} value={broker.id}>
                  {broker.name} {broker.is_crypto_exchange ? '(암호화폐)' : '(증권사)'}
                </option>
              ))}
            </select>
          </div>

          {/* 계좌번호와 계좌비밀번호 - 암호화폐 거래소가 아닐 때만 표시 */}
          {!isCryptoExchange && (
            <>
              <div className="form-group">
                <label htmlFor="account_number">계좌번호 *</label>
                <input
                  type="text"
                  id="account_number"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  required
                  placeholder="계좌번호를 입력하세요"
                />
              </div>

              <div className="form-group">
                <label htmlFor="account_password">
                  계좌 비밀번호 {account ? '' : '*'}
                </label>
                <input
                  type="password"
                  id="account_password"
                  name="account_password"
                  value={formData.account_password}
                  onChange={handleChange}
                  required={!account}
                  placeholder={account ? '변경하려면 입력하세요 (비워두면 유지)' : '계좌 비밀번호를 입력하세요'}
                />
              </div>
            </>
          )}

          {/* API Key/Secret - 암호화폐 거래소 또는 한국투자증권(KIS) 등 API가 필요한 브로커 */}
          {(isCryptoExchange || selectedBroker?.code === 'KIS') && (
            <>
              <div className="form-group">
                <label htmlFor="api_key">API Key</label>
                <input
                  type="text"
                  id="api_key"
                  name="api_key"
                  value={formData.api_key}
                  onChange={handleChange}
                  placeholder="API Key (선택사항)"
                />
                {selectedBroker?.code === 'KIS' && (
                  <small className="form-hint">한국투자증권 Open API Key</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="api_secret">API Secret</label>
                <input
                  type="password"
                  id="api_secret"
                  name="api_secret"
                  value={formData.api_secret}
                  onChange={handleChange}
                  placeholder="API Secret (선택사항)"
                />
                {selectedBroker?.code === 'KIS' && (
                  <small className="form-hint">한국투자증권 Open API Secret</small>
                )}
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="investment_limit">투자 상한선</label>
            <input
              type="number"
              id="investment_limit"
              name="investment_limit"
              value={formData.investment_limit}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="투자 상한선 (선택사항)"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="buy_enabled"
                checked={formData.buy_enabled}
                onChange={handleChange}
              />
              매수 동작 활성화
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="sell_enabled"
                checked={formData.sell_enabled}
                onChange={handleChange}
              />
              매도 동작 활성화
            </label>
          </div>

          {!isCryptoExchange && (
            <>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="unified_margin"
                    checked={formData.unified_margin}
                    onChange={handleChange}
                  />
                  통합증거금
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="overseas_etp_enabled"
                    checked={formData.overseas_etp_enabled}
                    onChange={handleChange}
                  />
                  해외 ETP 거래 가능
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="derivative_etf_enabled"
                    checked={formData.derivative_etf_enabled}
                    onChange={handleChange}
                  />
                  파생 ETF 거래 가능
                </label>
              </div>
            </>
          )}

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onClose}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
            >
              {loading ? '저장 중...' : account ? '수정' : '등록'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AccountFormModal

