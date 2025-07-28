import { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import UserDashboard from './components/UserDashboard.jsx'
import CreateSession from './components/CreateSession.jsx'
import JoinSession from './components/JoinSession.jsx'
import VotingSession from './components/VotingSession.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Vote, Users, ArrowLeft, Loader2 } from 'lucide-react'
import { DarkModeProvider } from './hooks/useDarkMode.jsx'
import { DarkModeToggleCompact } from './components/ui/dark-mode-toggle.jsx'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('loading') // 'loading', 'login', 'register', 'dashboard', 'create', 'join', 'session'
  const [user, setUser] = useState(null)
  const [sessionData, setSessionData] = useState({
    sessionId: '',
    isCreator: false,
    creatorName: ''
  })

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/current-user', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setCurrentView('dashboard')
      } else {
        setCurrentView('login')
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      setCurrentView('login')
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)
    setCurrentView('dashboard')
  }

  const handleRegister = (userData) => {
    setUser(userData)
    setCurrentView('dashboard')
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      setUser(null)
      setCurrentView('login')
      setSessionData({ sessionId: '', isCreator: false, creatorName: '' })
    }
  }

  const handleSessionCreated = (sessionId) => {
    setSessionData({
      sessionId,
      isCreator: true,
      creatorName: user?.username || ''
    })
    setCurrentView('session')
  }

  const handleSessionJoined = (sessionId, isCreator = false, creatorName = '') => {
    setSessionData({
      sessionId,
      isCreator,
      creatorName
    })
    setCurrentView('session')
  }

  const goToDashboard = () => {
    setCurrentView('dashboard')
    setSessionData({ sessionId: '', isCreator: false, creatorName: '' })
  }

  const goToLogin = () => {
    setCurrentView('login')
  }

  const goToRegister = () => {
    setCurrentView('register')
  }

  // Show loading screen while checking authentication
  if (currentView === 'loading') {
    return (
      <DarkModeProvider>
        <div className="min-h-screen bg-background flex items-center justify-center transition-colors">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DarkModeProvider>
    )
  }

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <Login onLogin={handleLogin} onSwitchToRegister={goToRegister} />

      case 'register':
        return <Register onRegister={handleRegister} onSwitchToLogin={goToLogin} />

      case 'dashboard':
        return (
          <UserDashboard
            user={user}
            onLogout={handleLogout}
            onJoinSession={(sessionId) => handleSessionJoined(sessionId, false, '')}
            onCreateSession={() => setCurrentView('create')}
            onJoinBySessionId={() => setCurrentView('join')}
          />
        )

      case 'create':
        return (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={goToDashboard}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <CreateSession onSessionCreated={handleSessionCreated} />
          </div>
        )

      case 'join':
        return (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={goToDashboard}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <JoinSession onSessionJoined={handleSessionJoined} />
          </div>
        )

      case 'session':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={goToDashboard}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="text-sm text-muted-foreground">
                Session ID: <code className="bg-muted px-2 py-1 rounded">{sessionData.sessionId}</code>
              </div>
            </div>
            <VotingSession
              sessionId={sessionData.sessionId}
              isCreator={sessionData.isCreator}
              creatorName={sessionData.creatorName}
              currentUser={user}
            />
          </div>
        )

      default:
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4 relative">
              <div className="absolute top-0 right-0">
                <DarkModeToggleCompact />
              </div>
              <div className="flex justify-center">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Vote className="w-12 h-12 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-foreground">
                Jira Estimation Tool
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Collaborate with your team to estimate Jira issues using story points.
                Create sessions, vote on issues, and reach consensus together.
              </p>
            </div>

            {/* Authentication required message */}
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>
                  Please sign in to access the Jira Estimation Tool
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button onClick={goToLogin} className="flex-1">
                  Sign In
                </Button>
                <Button onClick={goToRegister} variant="outline" className="flex-1">
                  Sign Up
                </Button>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="bg-muted rounded-lg p-8 max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
                Features
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-3">
                    <Vote className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-2 text-foreground">Story Point Voting</h3>
                  <p className="text-sm text-muted-foreground">
                    Use Fibonacci sequence for accurate estimation
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-3">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-2 text-foreground">Real-time Collaboration</h3>
                  <p className="text-sm text-muted-foreground">
                    See votes from team members in real-time
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-3">
                    <ArrowLeft className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-2 text-foreground">User Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your sessions and invitations
                  </p>
                </div>
              </div>
            </div>
          </div>
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
