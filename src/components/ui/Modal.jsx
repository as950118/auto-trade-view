import { useEffect } from 'react'
import './Modal.css'

const SIZES = ['sm', 'md', 'lg']

function Modal({ isOpen, onClose, title, size = 'md', children }) {
  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClass = SIZES.includes(size) ? size : 'md'

  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div
        className={`ui-modal-content ui-modal-${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-modal-header">
          <h2 className="ui-modal-title">{title}</h2>
          <button type="button" className="ui-modal-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Modal
