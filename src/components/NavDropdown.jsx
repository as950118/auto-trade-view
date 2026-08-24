import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './NavDropdown.css'

const NavDropdown = ({ label, items, onNavigate }) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const location = useLocation()
  const isActive = items.some((item) => location.pathname === item.to)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleSelect = () => {
    setOpen(false)
    onNavigate?.()
  }

  return (
    <div className="nav-dropdown" ref={containerRef}>
      <button
        type="button"
        className={`nav-dropdown-trigger${isActive ? ' is-active' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {label}
        <span className="nav-dropdown-caret" aria-hidden="true" />
      </button>
      <div className={`nav-dropdown-menu${open ? ' is-open' : ''}`}>
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="nav-dropdown-item"
            onClick={handleSelect}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default NavDropdown
