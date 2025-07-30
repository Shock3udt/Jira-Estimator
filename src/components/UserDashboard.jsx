import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle.jsx'
import TeamManagement from './TeamManagement.jsx'
import JiraSettings from './JiraSettings.jsx'
import ApiKeyManagement from './ApiKeyManagement.jsx'
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
  LogOut,
  Settings,
  Key,
  Copy,
  Check,
  Link
} from 'lucide-react'

const UserDashboard = ({ user, onLogout, onJoinSession, onCreateSession, onJoinBySessionId }) => {
  const [activeTab, setActiveTab] = useState('sessions') // 'sessions', 'teams', 'jira-settings', or 'api-keys'
  const [sessions, setSessions] = useState({
    owned_sessions: [],
    invited_sessions: [],
    participated_sessions: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Share link functionality
  const [copiedLinks, setCopiedLinks] = useState({}) // Track copied state per session

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

  const deleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone and will remove all votes and data.')) {
      return
    }

    try {
      const response = await fetch('/api/delete-session', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Session deleted successfully')
        fetchUserSessions() // Refresh the list
      } else {
        alert(data.error || 'Failed to delete session')
      }
    } catch (err) {
      alert('Network error: ' + err.message)
    }
  }

  const copyShareLink = async (sessionId) => {
    const shareUrl = `${window.location.origin}/join/${sessionId}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedLinks(prev => ({ ...prev, [sessionId]: true }))

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedLinks(prev => ({ ...prev, [sessionId]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)

      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedLinks(prev => ({ ...prev, [sessionId]: true }))
        setTimeout(() => {
          setCopiedLinks(prev => ({ ...prev, [sessionId]: false }))
        }, 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  const SessionCard = ({ session, type, showJoinButton = false }) => {
    const isOwned = type === 'owned'
    const isInvited = type === 'invited'
    const isParticipated = type === 'participated'
    const isLinkCopied = copiedLinks[session.session_id]

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
                  <span className="font-mono text-sm bg-muted text-muted-foreground px-2 py-1 rounded">
                    {session.session_id.slice(0, 8)}...
                  </span>
                </div>
                {session.is_closed && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Closed
                  </Badge>
                )}
                {/* Voting progress for owned sessions */}
                {isOwned && session.voting_stats && (
                  <Badge
                    variant="outline"
                    className={`${
                      session.voting_stats.voters_count === session.voting_stats.total_invited
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    <Users className="w-3 h-3 mr-1" />
                    {session.voting_stats.voters_count}/{session.voting_stats.total_invited} voted
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Created by {session.creator_name} • {new Date(session.created_at).toLocaleDateString()}
                {/* Additional voting details for owned sessions */}
                {isOwned && session.voting_stats && (
                  <>
                    {' • '}
                    {session.voting_stats.total_invitations > 0
                      ? `${session.voting_stats.total_invitations} invited`
                      : 'No invitations sent'}
                  </>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <p><strong>Jira Query:</strong> {session.jira_query}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(session.created_at).toLocaleTimeString()}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {showJoinButton && !session.is_closed && (
                <Button
                  size="sm"
                  onClick={() => onJoinSession(session.session_id)}
                  className="flex items-center gap-1 flex-1 xs:flex-initial"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden xs:inline">Join Session</span>
                  <span className="xs:hidden">Join</span>
                </Button>
              )}
              {isOwned && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onJoinSession(session.session_id)}
                    className="flex items-center gap-1 flex-1 xs:flex-initial"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="hidden xs:inline">Manage</span>
                    <span className="xs:hidden">Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyShareLink(session.session_id)}
                    className="flex items-center gap-1 flex-1 xs:flex-initial"
                  >
                    {isLinkCopied ? (
                      <>
                        <Check className="w-3 h-3 text-green-600" />
                        <span className="hidden xs:inline text-green-600">Copied!</span>
                        <span className="xs:hidden text-green-600">✓</span>
                      </>
                    ) : (
                      <>
                        <Link className="w-3 h-3" />
                        <span className="hidden xs:inline">Share</span>
                        <span className="xs:hidden">📋</span>
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteSession(session.session_id)}
                    className="flex items-center gap-1 border-red-300 text-red-600 hover:bg-red-50 flex-1 xs:flex-initial"
                  >
                    <span className="hidden xs:inline">Delete</span>
                    <span className="xs:hidden">Del</span>
                  </Button>
                </>
              )}
              {isParticipated && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onJoinSession(session.session_id)}
                  className="flex items-center gap-1 flex-1 xs:flex-initial"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden xs:inline">View Results</span>
                  <span className="xs:hidden">View</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading dashboard...</div>
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* User Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                Welcome, {user?.username || 'User'}!
              </CardTitle>
              <CardDescription>
                {user?.email || 'Loading user information...'} • Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Verifying account...'}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <DarkModeToggle />
              <Button onClick={onCreateSession} className="flex items-center gap-2 flex-1 sm:flex-initial">
                <Vote className="w-4 h-4" />
                <span className="hidden xs:inline">Create Session</span>
                <span className="xs:hidden">Create</span>
              </Button>
              <Button variant="outline" onClick={onLogout} className="flex items-center gap-2 flex-1 sm:flex-initial">
                <LogOut className="w-4 h-4" />
                <span className="hidden xs:inline">Logout</span>
                <span className="xs:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <div className="text-destructive text-center py-4 bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'sessions' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('sessions')}
              className="flex-1 justify-start sm:justify-center"
            >
              <Vote className="w-4 h-4 mr-2" />
              Sessions
            </Button>
            <Button
              variant={activeTab === 'teams' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('teams')}
              className="flex-1 justify-start sm:justify-center"
            >
              <Users className="w-4 h-4 mr-2" />
              Teams
            </Button>
            <Button
              variant={activeTab === 'jira-settings' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('jira-settings')}
              className="flex-1 justify-start sm:justify-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Jira Settings</span>
              <span className="xs:hidden">Jira</span>
            </Button>
            <Button
              variant={activeTab === 'api-keys' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('api-keys')}
              className="flex-1 justify-start sm:justify-center"
            >
              <Key className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">API Keys</span>
              <span className="xs:hidden">API</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeTab === 'sessions' && (
        <>
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onJoinBySessionId}>
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
            <CardContent className="pt-6 text-center text-muted-foreground">
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
            <CardContent className="pt-6 text-center text-muted-foreground">
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
            <CardContent className="pt-6 text-center text-muted-foreground">
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
        </>
      )}

      {activeTab === 'teams' && (
        <TeamManagement user={user} />
      )}

      {activeTab === 'jira-settings' && (
        <JiraSettings user={user} />
      )}

      {activeTab === 'api-keys' && (
        <ApiKeyManagement user={user} />
      )}
    </div>
  )
}

export default UserDashboard