import { useEffect, useRef } from 'react'
import './Modal.css'

const SIZES = ['sm', 'md', 'lg']

// 계좌 목록 Modal 안에서 계좌 등록 Modal을 여는 것처럼 여러 Modal이 동시에 열릴 수 있어,
// 모든 인스턴스가 열려 있는 동안 이 스택에 자신을 등록한다. ESC는 항상 가장 마지막(최상단)
// 모달만 닫아야 하고, body 스크롤 잠금은 스택이 완전히 비었을 때만 풀어야 한다 — 그렇지
// 않으면 안쪽 모달을 닫을 때 바깥쪽 모달이 아직 열려 있어도 스크롤이 풀리거나, ESC 한 번에
// 두 모달이 동시에 닫혀버린다.
let modalStack = []

function Modal({ isOpen, onClose, title, size = 'md', children }) {
  const idRef = useRef()
  if (!idRef.current) idRef.current = Symbol('modal')

  useEffect(() => {
    if (!isOpen) return undefined

    const id = idRef.current
    modalStack.push(id)
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalStack[modalStack.length - 1] === id) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      modalStack = modalStack.filter((stackId) => stackId !== id)
      if (modalStack.length === 0) {
        document.body.style.overflow = ''
      }
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
