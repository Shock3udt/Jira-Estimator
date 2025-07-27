import { useState, useEffect, createContext, useContext } from 'react'

// Create Dark Mode Context
const DarkModeContext = createContext()

// Dark Mode Provider Component
export const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('darkMode')
    if (savedTheme !== null) {
      return JSON.parse(savedTheme)
    }

    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Apply dark mode class to document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Save to localStorage
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('darkMode')
      if (savedTheme === null) {
        setIsDarkMode(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev)
  }

  const value = {
    isDarkMode,
    toggleDarkMode,
    setDarkMode: setIsDarkMode
  }

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  )
}

// Hook to use dark mode context
export const useDarkMode = () => {
  const context = useContext(DarkModeContext)
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  }
  return context
}