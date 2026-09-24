import { createContext, useContext, useState, useLayoutEffect } from 'react'

const ThemeContext = createContext(null)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

const getInitialTheme = () => {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme)

  // 레이아웃 이펙트로 속성을 먼저 바꿔, 자식의 useEffect(useTokenColors)가 새 테마의 토큰 값을 읽게 한다
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
