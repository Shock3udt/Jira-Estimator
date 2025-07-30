import { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import UserDashboard from './components/UserDashboard.jsx'
import CreateSession from './components/CreateSession.jsx'
import JoinSession from './components/JoinSession.jsx'
import VotingSession from './components/VotingSession.jsx'
import GuestJoinSession from './components/GuestJoinSession.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Vote, Users, ArrowLeft, Loader2 } from 'lucide-react'
import { DarkModeProvider } from './hooks/useDarkMode.jsx'
import { DarkModeToggleCompact } from './components/ui/dark-mode-toggle.jsx'
import './App.css'

// Function to get initial user state from sessionStorage
const getInitialUserState = () => {
  try {
    const savedUser = sessionStorage.getItem('currentUser')
    return savedUser ? JSON.parse(savedUser) : null
  } catch (error) {
    console.error('Error loading user from sessionStorage:', error)
    return null
  }
}

// Function to get initial session data from sessionStorage
const getInitialSessionData = () => {
  try {
    const savedSessionData = sessionStorage.getItem('sessionData')
    return savedSessionData ? JSON.parse(savedSessionData) : {
      sessionId: null,
      isCreator: false,
      creatorName: '',
      guestUser: null
    }
  } catch (error) {
    console.error('Error loading session data from sessionStorage:', error)
    return {
      sessionId: null,
      isCreator: false,
      creatorName: '',
      guestUser: null
    }
  }
}

function App() {
  const initialUser = getInitialUserState()
  const [currentView, setCurrentView] = useState(initialUser ? 'dashboard' : 'login') // Set initial view based on stored user
  const [user, setUser] = useState(initialUser) // Initialize from sessionStorage
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState(getInitialSessionData) // Initialize from sessionStorage

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

  useEffect(() => {
    // Get session ID from URL synchronously
    const sessionIdFromUrl = getSessionIdFromUrl()
    setUrlSessionId(sessionIdFromUrl)

    // Check auth status with the session ID
    checkAuthStatus(sessionIdFromUrl)
  }, [])

  // Extract session ID from URL synchronously
  const getSessionIdFromUrl = () => {
    const path = window.location.pathname
    const sessionMatch = path.match(/^\/join\/([a-f0-9-]{36})$/i)

    if (sessionMatch) {
      const sessionId = sessionMatch[1]
      // Clear the URL to avoid confusion
      window.history.replaceState({}, '', '/')
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
        setUser(userData.user) // Extract user from response object

        // If we have a session ID from URL and user is authenticated, join directly
        if (sessionIdFromUrl) {
          handleSessionJoined(sessionIdFromUrl, false, '', null)
        } else {
          setCurrentView('dashboard')
        }
      } else {
        // User not authenticated - clear stored user data
        setUser(null)
        // Clear sessionStorage when user is not authenticated
        sessionStorage.removeItem('currentUser')
        if (sessionIdFromUrl) {
          // Show guest join with pre-filled session ID
          setCurrentView('guest-join')
        } else {
          setCurrentView('login')
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Clear stored user data on error
      setUser(null)
      sessionStorage.removeItem('currentUser')
      if (sessionIdFromUrl) {
        setCurrentView('guest-join')
      } else {
        setCurrentView('login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)

    // If we have a session ID from URL, join directly after login
    if (urlSessionId) {
      handleSessionJoined(urlSessionId, false, '', null)
    } else {
      setCurrentView('dashboard')
    }
  }

  const handleRegister = (userData) => {
    setUser(userData)

    // If we have a session ID from URL, join directly after registration
    if (urlSessionId) {
      handleSessionJoined(urlSessionId, false, '', null)
    } else {
      setCurrentView('dashboard')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      setUrlSessionId(null)
      setSessionData({
        sessionId: null,
        isCreator: false,
        creatorName: '',
        guestUser: null
      })
      setCurrentView('login')
    }
  }

  const handleSessionCreated = (sessionId) => {
    setSessionData({
      sessionId,
      isCreator: true,
      creatorName: user?.username || '',
      guestUser: null
    })
    setCurrentView('voting')
  }

  const handleSessionJoined = (sessionId, isCreator = false, creatorName = '', guestData = null) => {
    setSessionData({
      sessionId,
      isCreator,
      creatorName,
      guestUser: guestData
    })
    setCurrentView('voting')
    // Clear URL session ID once we've joined
    setUrlSessionId(null)
  }

  const goToDashboard = () => {
    setCurrentView('dashboard')
    setSessionData({
      sessionId: null,
      isCreator: false,
      creatorName: '',
      guestUser: null
    })
  }

  const goToLogin = () => {
    setCurrentView('login')
  }

  const goToRegister = () => {
    setCurrentView('register')
  }

  const goToGuestJoin = () => {
    setCurrentView('guest-join')
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
            onSwitchToRegister={() => setCurrentView('register')}
            onGuestJoin={() => setCurrentView('guest-join')}
          />
        )
      case 'register':
        return (
          <Register
            onRegister={handleRegister}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )
      case 'dashboard':
        return (
          <UserDashboard
            user={user}
            onLogout={handleLogout}
            onJoinSession={handleSessionJoined}
            onCreateSession={() => setCurrentView('create-session')}
            onJoinBySessionId={() => setCurrentView('join-session')}
          />
        )
      case 'create-session':
        return (
          <CreateSession
            onSessionCreated={handleSessionCreated}
          />
        )
      case 'join-session':
        return (
          <JoinSession
            onSessionJoined={handleSessionJoined}
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
          />
        )
      default:
        return (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView('register')}
            onGuestJoin={() => setCurrentView('guest-join')}
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
