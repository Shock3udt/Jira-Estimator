import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import {
  Vote,
  Users,
  Clock,
  CheckCircle,
  Mail,
  History,
  Crown,
  UserPlus,
  ExternalLink,
  LogOut
} from 'lucide-react'

const UserDashboard = ({ user, onLogout, onJoinSession, onCreateSession }) => {
  const [sessions, setSessions] = useState({
    owned_sessions: [],
    invited_sessions: [],
    participated_sessions: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUserSessions()
  }, [])

  const fetchUserSessions = async () => {
    try {
      const response = await fetch('/api/auth/user-sessions', {
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setSessions(data)
        setError('')
      } else {
        setError(data.error || 'Failed to fetch sessions')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const SessionCard = ({ session, type, showJoinButton = false }) => {
    const isOwned = type === 'owned'
    const isInvited = type === 'invited'
    const isParticipated = type === 'participated'

    return (
      <Card key={session.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {isOwned && <Crown className="w-4 h-4 text-yellow-600" />}
                  {isInvited && <Mail className="w-4 h-4 text-blue-600" />}
                  {isParticipated && <History className="w-4 h-4 text-gray-600" />}
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {session.session_id.slice(0, 8)}...
                  </span>
                </div>
                {session.is_closed && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Closed
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Created by {session.creator_name} • {new Date(session.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p><strong>Jira Query:</strong> {session.jira_query}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(session.created_at).toLocaleTimeString()}
              </div>
            </div>

            <div className="flex gap-2">
              {showJoinButton && !session.is_closed && (
                <Button
                  size="sm"
                  onClick={() => onJoinSession(session.session_id)}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Join Session
                </Button>
              )}
              {isOwned && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onJoinSession(session.session_id)}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Manage
                </Button>
              )}
              {isParticipated && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onJoinSession(session.session_id)}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Results
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* User Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                Welcome, {user.username}!
              </CardTitle>
              <CardDescription>
                {user.email} • Member since {new Date(user.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={onCreateSession} className="flex items-center gap-2">
                <Vote className="w-4 h-4" />
                Create Session
              </Button>
              <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <div className="text-red-600 text-center py-4 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onCreateSession}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="w-5 h-5 text-blue-600" />
              Create New Session
            </CardTitle>
            <CardDescription>
              Start a new estimation session with your Jira issues
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Join by Session ID
            </CardTitle>
            <CardDescription>
              Join an existing session using its ID
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Owned Sessions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-600" />
          <h2 className="text-2xl font-semibold">Your Sessions</h2>
          <Badge variant="secondary">{sessions.owned_sessions.length}</Badge>
        </div>

        {sessions.owned_sessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              You haven't created any sessions yet. Click "Create Session" to get started!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.owned_sessions.map(session => (
              <SessionCard key={session.id} session={session} type="owned" />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Invited Sessions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          <h2 className="text-2xl font-semibold">Invited Sessions</h2>
          <Badge variant="secondary">{sessions.invited_sessions.length}</Badge>
        </div>

        {sessions.invited_sessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No pending invitations. You'll see sessions you've been invited to here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.invited_sessions.map(session => (
              <SessionCard key={session.id} session={session} type="invited" showJoinButton={true} />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Participated Sessions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          <h2 className="text-2xl font-semibold">Participated Sessions</h2>
          <Badge variant="secondary">{sessions.participated_sessions.length}</Badge>
        </div>

        {sessions.participated_sessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No completed sessions yet. Sessions you've participated in will appear here once closed.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.participated_sessions.map(session => (
              <SessionCard key={session.id} session={session} type="participated" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard