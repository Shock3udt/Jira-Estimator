import { useState } from 'react'
import CreateSession from './components/CreateSession.jsx'
import JoinSession from './components/JoinSession.jsx'
import VotingSession from './components/VotingSession.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Vote, Users, ArrowLeft } from 'lucide-react'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('home') // 'home', 'create', 'join', 'session'
  const [sessionData, setSessionData] = useState({
    sessionId: '',
    isCreator: false,
    creatorName: ''
  })

  const handleSessionCreated = (sessionId) => {
    setSessionData({
      sessionId,
      isCreator: true,
      creatorName: '' // Will be set from the form
    })
    setCurrentView('session')
  }

  const handleSessionJoined = (sessionId, isCreator, creatorName) => {
    setSessionData({
      sessionId,
      isCreator,
      creatorName
    })
    setCurrentView('session')
  }

  const goHome = () => {
    setCurrentView('home')
    setSessionData({ sessionId: '', isCreator: false, creatorName: '' })
  }

  const renderContent = () => {
    switch (currentView) {
      case 'create':
        return (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={goHome}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <CreateSession onSessionCreated={handleSessionCreated} />
          </div>
        )

      case 'join':
        return (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={goHome}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
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
                onClick={goHome}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Leave Session
              </Button>
              <div className="text-sm text-gray-600">
                Session ID: <code className="bg-gray-100 px-2 py-1 rounded">{sessionData.sessionId}</code>
              </div>
            </div>
            <VotingSession
              sessionId={sessionData.sessionId}
              isCreator={sessionData.isCreator}
              creatorName={sessionData.creatorName}
            />
          </div>
        )

      default:
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Vote className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900">
                Jira Estimation Tool
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Collaborate with your team to estimate Jira issues using story points.
                Create sessions, vote on issues, and reach consensus together.
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('create')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Vote className="w-5 h-5 text-blue-600" />
                    Create Session
                  </CardTitle>
                  <CardDescription>
                    Start a new estimation session by connecting to your Jira instance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Connect to your self-hosted Jira</li>
                    <li>• Define JQL query for issues</li>
                    <li>• Manage voting session</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('join')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Join Session
                  </CardTitle>
                  <CardDescription>
                    Join an existing estimation session using a session ID
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Enter session ID</li>
                    <li>• Vote on Jira issues</li>
                    <li>• See real-time results</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Features */}
            <div className="bg-gray-50 rounded-lg p-8 max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                Features
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                    <Vote className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium mb-2">Story Point Voting</h3>
                  <p className="text-sm text-gray-600">
                    Use Fibonacci sequence for accurate estimation
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">Real-time Collaboration</h3>
                  <p className="text-sm text-gray-600">
                    See votes from team members in real-time
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-3">
                    <ArrowLeft className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium mb-2">Jira Integration</h3>
                  <p className="text-sm text-gray-600">
                    Direct connection to your Jira instance
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {renderContent()}
      </div>
    </div>
  )
}

export default App
