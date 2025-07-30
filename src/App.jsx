import { useState, useEffect } from 'react'
import { DarkModeProvider } from './hooks/useDarkMode.jsx'

// Import components
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import UserDashboard from './components/UserDashboard.jsx'
import CreateSession from './components/CreateSession.jsx'
import JoinSession from './components/JoinSession.jsx'
import GuestJoinSession from './components/GuestJoinSession.jsx'
import VotingSession from './components/VotingSession.jsx'
import './App.css'

// Utility functions for sessionStorage
const getInitialUserState = () => {
  try {
    const storedUser = sessionStorage.getItem('currentUser')
    return storedUser ? JSON.parse(storedUser) : null
  } catch (error) {
    console.error('Error parsing stored user:', error)
    return null
  }
}

const getInitialSessionData = () => {
  try {
    const storedSessionData = sessionStorage.getItem('sessionData')
    return storedSessionData ? JSON.parse(storedSessionData) : {
      sessionId: null,
      isCreator: false,
      creatorName: '',
      guestUser: null
    }
  } catch (error) {
    console.error('Error parsing stored session data:', error)
    return {
      sessionId: null,
      isCreator: false,
      creatorName: '',
      guestUser: null
    }
  }
}

const getInitialViewState = () => {
  try {
    const storedView = localStorage.getItem('currentView')
    const storedUser = sessionStorage.getItem('currentUser')
    const user = storedUser ? JSON.parse(storedUser) : null

    // If no stored view or user state has changed, determine based on user
    if (!storedView || (storedView !== 'login' && storedView !== 'register' && storedView !== 'guest-join' && !user)) {
      return user ? 'dashboard' : 'login'
    }

    return storedView
  } catch (error) {
    console.error('Error parsing stored view:', error)
    const storedUser = sessionStorage.getItem('currentUser')
    const user = storedUser ? JSON.parse(storedUser) : null
    return user ? 'dashboard' : 'login'
  }
}

// Navigation history management
class NavigationHistory {
  constructor() {
    this.history = []
    this.currentIndex = -1
  }

  push(view, data = {}) {
    // Remove any future history if we're not at the end
    this.history = this.history.slice(0, this.currentIndex + 1)

    // Add new entry
    this.history.push({ view, data, timestamp: Date.now() })
    this.currentIndex = this.history.length - 1

    // Limit history size
    if (this.history.length > 50) {
      this.history = this.history.slice(-50)
      this.currentIndex = this.history.length - 1
    }
  }

  back() {
    if (this.currentIndex > 0) {
      this.currentIndex--
      return this.history[this.currentIndex]
    }
    return null
  }

  canGoBack() {
    return this.currentIndex > 0
  }

  getCurrentEntry() {
    return this.currentIndex >= 0 ? this.history[this.currentIndex] : null
  }
}

function App() {
  const initialUser = getInitialUserState()
  const [currentView, setCurrentView] = useState(getInitialViewState())
  const [user, setUser] = useState(initialUser)
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState(getInitialSessionData)
  const [navigationHistory] = useState(new NavigationHistory())

  // URL parameter handling for session sharing
  const [urlSessionId, setUrlSessionId] = useState(null)

  // Save user to sessionStorage whenever it changes
  useEffect(() => {
    try {
      if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user))
      } else {
        sessionStorage.removeItem('currentUser')
      }
    } catch (error) {
      console.error('Error saving user to sessionStorage:', error)
    }
  }, [user])

  // Save session data to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem('sessionData', JSON.stringify(sessionData))
    } catch (error) {
      console.error('Error saving session data to sessionStorage:', error)
    }
  }, [sessionData])

  // Save current view to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('currentView', currentView)
    } catch (error) {
      console.error('Error saving view to localStorage:', error)
    }
  }, [currentView])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault() // Prevent default browser navigation

      const previousEntry = navigationHistory.back()
      if (previousEntry) {
        setCurrentView(previousEntry.view)
        if (previousEntry.data.sessionData) {
          setSessionData(previousEntry.data.sessionData)
        }
      } else {
        // If no history, go to appropriate default view
        if (user) {
          navigateToView('dashboard')
        } else {
          navigateToView('login')
        }
      }
    }

    // Add custom state to prevent external navigation history
    if (window.location.pathname === '/') {
      window.history.replaceState({ internal: true }, '', '/')
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [navigationHistory, user])

  useEffect(() => {
    // Get session ID from URL synchronously
    const sessionIdFromUrl = getSessionIdFromUrl()
    setUrlSessionId(sessionIdFromUrl)

    // Check auth status with the session ID
    checkAuthStatus(sessionIdFromUrl)
  }, [])

  // Helper function to navigate with history tracking
  const navigateToView = (newView, data = {}) => {
    // Add current state to history before navigating
    navigationHistory.push(currentView, {
      sessionData: { ...sessionData },
      ...data
    })

    // Push a new history state to prevent external back navigation
    window.history.pushState({ internal: true, view: newView }, '', '/')

    setCurrentView(newView)
  }

  // Extract session ID from URL synchronously
  const getSessionIdFromUrl = () => {
    const path = window.location.pathname
    const sessionMatch = path.match(/^\/join\/([a-f0-9-]{36})$/i)

    if (sessionMatch) {
      const sessionId = sessionMatch[1]
      // Clear the URL to avoid confusion
      window.history.replaceState({ internal: true }, '', '/')
      return sessionId
    }
    return null
  }

  const checkAuthStatus = async (sessionIdFromUrl = null) => {
    try {
      const response = await fetch('/api/auth/current-user', {
        credentials: 'include'
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)

        // If we have a session ID from URL and user is authenticated, go to guest join
        if (sessionIdFromUrl) {
          navigateToView('guest-join')
        } else if (currentView === 'login' || currentView === 'register') {
          // Only navigate to dashboard if currently on login/register
          navigateToView('dashboard')
        }
      } else {
        // User not authenticated
        setUser(null)

        // If we have a session ID from URL, go to guest join
        if (sessionIdFromUrl) {
          navigateToView('guest-join')
        } else if (currentView !== 'login' && currentView !== 'register' && currentView !== 'guest-join') {
          // Only navigate to login if not already on auth-related views
          navigateToView('login')
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)

      if (sessionIdFromUrl) {
        navigateToView('guest-join')
      } else if (currentView !== 'login' && currentView !== 'register' && currentView !== 'guest-join') {
        navigateToView('login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)

    // Check if we should redirect to a session from URL
    if (urlSessionId) {
      navigateToView('guest-join')
    } else {
      navigateToView('dashboard')
    }
  }

  const handleRegister = (userData) => {
    setUser(userData)

    // Check if we should redirect to a session from URL
    if (urlSessionId) {
      navigateToView('guest-join')
    } else {
      navigateToView('dashboard')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    }

    setUser(null)
    setSessionData({
      sessionId: null,
      isCreator: false,
      creatorName: '',
      guestUser: null
    })

    // Clear history and navigate to login
    navigationHistory.history = []
    navigationHistory.currentIndex = -1
    navigateToView('login')
  }

  const handleSessionCreated = (sessionId) => {
    setSessionData({
      sessionId,
      isCreator: true,
      creatorName: user?.username || '',
      guestUser: null
    })
    navigateToView('voting')
  }

  const handleSessionJoined = (sessionId, isCreator = false, creatorName = '', guestData = null) => {
    setSessionData({
      sessionId,
      isCreator,
      creatorName,
      guestUser: guestData
    })
    navigateToView('voting')
    // Clear URL session ID once we've joined
    setUrlSessionId(null)
  }

  const goToDashboard = () => {
    setSessionData({
      sessionId: null,
      isCreator: false,
      creatorName: '',
      guestUser: null
    })
    navigateToView('dashboard')
  }

  const goToLogin = () => {
    navigateToView('login')
  }

  const goToRegister = () => {
    navigateToView('register')
  }

  const goToGuestJoin = () => {
    navigateToView('guest-join')
  }

  // Function to go back in internal navigation history
  const goBack = () => {
    const previousEntry = navigationHistory.back()
    if (previousEntry) {
      setCurrentView(previousEntry.view)
      if (previousEntry.data.sessionData) {
        setSessionData(previousEntry.data.sessionData)
      }
      // Update browser history
      window.history.pushState({ internal: true, view: previousEntry.view }, '', '/')
    } else {
      // If no history, go to appropriate default view
      if (user) {
        goToDashboard()
      } else {
        goToLogin()
      }
    }
  }

  if (loading) {
    return (
      <DarkModeProvider>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DarkModeProvider>
    )
  }

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => navigateToView('register')}
            onGuestJoin={() => navigateToView('guest-join')}
          />
        )
      case 'register':
        return (
          <Register
            onRegister={handleRegister}
            onSwitchToLogin={() => navigateToView('login')}
          />
        )
      case 'dashboard':
        return (
          <UserDashboard
            user={user}
            onLogout={handleLogout}
            onJoinSession={handleSessionJoined}
            onCreateSession={() => navigateToView('create-session')}
            onJoinBySessionId={() => navigateToView('join-session')}
          />
        )
      case 'create-session':
        return (
          <CreateSession
            onSessionCreated={handleSessionCreated}
            onBack={goToDashboard}
          />
        )
      case 'join-session':
        return (
          <JoinSession
            onSessionJoined={handleSessionJoined}
            onBack={goToDashboard}
          />
        )
      case 'guest-join':
        return (
          <GuestJoinSession
            onSessionJoined={handleSessionJoined}
            onBack={goToLogin}
            prefilledSessionId={urlSessionId}
          />
        )
      case 'voting':
        return (
          <VotingSession
            sessionId={sessionData.sessionId}
            isCreator={sessionData.isCreator}
            creatorName={sessionData.creatorName}
            currentUser={user}
            guestUser={sessionData.guestUser}
            onBack={user ? goToDashboard : goToLogin}
          />
        )
      default:
        return (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => navigateToView('register')}
            onGuestJoin={() => navigateToView('guest-join')}
          />
        )
    }
  }

  return (
    <DarkModeProvider>
      <div className="min-h-screen bg-background transition-colors">
        <div className="container mx-auto px-4 py-8">
          {renderContent()}
        </div>
      </div>
    </DarkModeProvider>
  )
}

export default App
