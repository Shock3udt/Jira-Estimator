import { Sun, Moon } from 'lucide-react'
import { Button } from './button.jsx'
import { useDarkMode } from '../../hooks/useDarkMode.jsx'

export const DarkModeToggle = ({ variant = "outline", size = "sm", className = "" }) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleDarkMode}
      className={`flex items-center gap-2 ${className}`}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <>
          <Sun className="w-4 h-4" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </Button>
  )
}

// Compact version without text (icon only)
export const DarkModeToggleCompact = ({ className = "" }) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-md hover:bg-accent transition-colors ${className}`}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 text-muted-foreground" />
      ) : (
        <Moon className="w-5 h-5 text-muted-foreground" />
      )}
    </button>
  )
}