import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { ExternalLink, Users, Clock, CheckCircle, UserPlus, Copy, Link, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const STORY_POINTS = ['1', '2', '3', '5', '8', '13', '21', '?']

const VotingSession = ({ sessionId, isCreator, creatorName, currentUser, guestUser }) => {
  const [session, setSession] = useState(null)
  const [issues, setIssues] = useState([])
  const [votes, setVotes] = useState({})
  const [voterName, setVoterName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submittingVote, setSubmittingVote] = useState(false)
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [userTeams, setUserTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [teamInviteLoading, setTeamInviteLoading] = useState(false)

  // Share link functionality
  const [showShareLink, setShowShareLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Determine effective voter name and type
  const getVoterInfo = () => {
    if (currentUser) {
      return {
        name: currentUser.username,
        type: 'authenticated',
        isGuest: false
      }
    } else if (guestUser && guestUser.isGuest) {
      return {
        name: guestUser.email,
        type: 'guest',
        isGuest: true
      }
    } else if (voterName) {
      return {
        name: voterName,
        type: 'legacy',
        isGuest: false
      }
    }
    return null
  }

  const voterInfo = getVoterInfo()
  const effectiveVoterName = voterInfo ? voterInfo.name : ''

  useEffect(() => {
    fetchSession()
    if (currentUser) {
      fetchUserTeams()
    }
    const interval = setInterval(fetchSession, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [sessionId])

  const fetchUserTeams = async () => {
    if (!currentUser) return

    try {
      const response = await fetch('/api/teams/my-teams', {
        credentials: 'include'
      })
      const data = await response.json()

      if (response.ok) {
        // Combine owned and member teams
        const allTeams = [...data.owned_teams, ...data.member_teams]
        setUserTeams(allTeams)
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err)
    }
  }

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (response.ok) {
        setSession(data.session)
        setIssues(data.issues)
        setVotes(data.votes)
        setError('')
      } else {
        setError(data.error || 'Failed to fetch session')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const submitVote = async (issueKey, estimation) => {
    if (!voterInfo) {
      alert('Please provide your identification to vote')
      return
    }

    setSubmittingVote(true)
    try {
      const voteData = {
        session_id: sessionId,
        issue_key: issueKey,
        estimation: estimation
      }

      // Add appropriate identification based on voter type
      if (voterInfo.type === 'authenticated') {
        // For authenticated users, credentials are handled by session
      } else if (voterInfo.type === 'guest') {
        voteData.guest_email = voterInfo.name
      } else if (voterInfo.type === 'legacy') {
        voteData.voter_name = voterInfo.name
      }

      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(voteData),
      })

      const data = await response.json()

      if (response.ok) {
        fetchSession() // Refresh data
      } else {
        alert(data.error || 'Failed to submit vote')
      }
    } catch (err) {
      alert('Network error: ' + err.message)
    } finally {
      setSubmittingVote(false)
    }
  }

  const closeSession = async () => {
    if (!confirm('Are you sure you want to close this voting session?')) {
      return
    }

    try {
      const closeData = {
        session_id: sessionId
      }

      // For backward compatibility
      if (!currentUser) {
        closeData.creator_name = voterInfo ? voterInfo.name : ''
      }

      const response = await fetch('/api/close-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(closeData),
      })

      const data = await response.json()

      if (response.ok) {
        fetchSession() // Refresh data
      } else {
        alert(data.error || 'Failed to close session')
      }
    } catch (err) {
      alert('Network error: ' + err.message)
    }
  }

  const deleteSession = async () => {
    if (!confirm('Are you sure you want to delete this voting session? This action cannot be undone and will remove all votes and data.')) {
      return
    }

    try {
      const deleteData = {
        session_id: sessionId
      }

      // For backward compatibility
      if (!currentUser) {
        deleteData.creator_name = voterInfo ? voterInfo.name : ''
      }

      const response = await fetch('/api/delete-session', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(deleteData),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Session deleted successfully')
        // Redirect to dashboard or home page
        window.location.href = '/'
      } else {
        alert(data.error || 'Failed to delete session')
      }
    } catch (err) {
      alert('Network error: ' + err.message)
    }
  }

  const removeIssue = async (issueKey) => {
    if (!confirm(`Are you sure you want to remove issue ${issueKey} from this session? This will delete all votes for this issue.`)) {
      return
    }

    try {
      const removeData = {
        session_id: sessionId,
        issue_key: issueKey
      }

      // For backward compatibility
      if (!currentUser) {
        removeData.creator_name = voterInfo ? voterInfo.name : ''
      }

      const response = await fetch('/api/remove-issue', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(removeData),
      })

      const data = await response.json()

      if (response.ok) {
        fetchSession() // Refresh data
      } else {
        alert(data.error || 'Failed to remove issue')
      }
    } catch (err) {
      alert('Network error: ' + err.message)
    }
  }

  const inviteUser = async () => {
    if (!inviteUsername.trim()) {
      alert('Please enter a username')
      return
    }

    setInviteLoading(true)
    try {
      const response = await fetch('/api/auth/invite-to-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          username: inviteUsername.trim()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`User ${inviteUsername} invited successfully!`)
        setInviteUsername('')
      } else {
        alert(data.error || 'Failed to invite user')
      }
    } catch (err) {
      alert('Network error: ' + err.message)
    } finally {
      setInviteLoading(false)
    }
  }

  const inviteTeam = async () => {
    if (!selectedTeam) {
      alert('Please select a team')
      return
    }

    setTeamInviteLoading(true)
    try {
      const response = await fetch('/api/auth/invite-team-to-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          team_id: parseInt(selectedTeam)
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Team "${data.team_name}" invited successfully! ${data.invited_count} members invited, ${data.already_invited_count} already invited.`)
        setSelectedTeam('')
      } else {
        alert(data.error || 'Failed to invite team')
      }
    } catch (err) {
      alert('Network error: ' + err.message)
    } finally {
      setTeamInviteLoading(false)
    }
  }

  const getVoteStats = (issueKey) => {
    const issueVotes = votes[issueKey] || []
    const voteCount = issueVotes.length
    const voterNames = [...new Set(issueVotes.map((v) => v.voter_name))]
    const uniqueVoters = voterNames.length
    const estimations = issueVotes.reduce((acc, vote) => {
      acc[vote.estimation] = (acc[vote.estimation] || 0) + 1
      return acc
    }, {})

    return { voteCount, uniqueVoters, estimations, voterNames }
  }

  const getUserVote = (issueKey) => {
    const issueVotes = votes[issueKey] || []
    return issueVotes.find(v => v.voter_name === effectiveVoterName)
  }

  const canUserCloseSession = () => {
    if (!session) return false

    // Check if current user can manage the session (from API response)
    if (session.user_can_manage) return true

    // Fallback for backward compatibility
    if (!currentUser && session.creator_name === effectiveVoterName) return true

    return false
  }

  const copyShareLink = async () => {
    const shareUrl = `${window.location.origin}/join/${sessionId}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setLinkCopied(false)
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
        setLinkCopied(true)
        setTimeout(() => {
          setLinkCopied(false)
        }, 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  const getShareUrl = () => {
    return `${window.location.origin}/join/${sessionId}`
  }

  if (loading) {
    return <div className="text-center py-8">Loading session...</div>
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>
  }

  if (!session) {
    return <div className="text-center py-8">Session not found</div>
  }

  const voterNames = [...new Set(Object.values(votes).flat().map((v) => v.voter_name))];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                Estimation Session
                {session.is_closed && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Closed
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Created by {session.creator_name} • {issues.length} issues
              </CardDescription>
            </div>
            <div className="flex gap-2 items-start">
              {/* Share Link Button */}
              <Button
                onClick={() => setShowShareLink(!showShareLink)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Link className="w-4 h-4" />
                Share Link
              </Button>

              {canUserCloseSession() && (
                <>
                  {!session.is_closed && (
                    <Button onClick={closeSession} variant="destructive">
                      Close Session
                    </Button>
                  )}
                  <Button onClick={deleteSession} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                    Delete Session
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(session.created_at).toLocaleString()}
            </div>
            <div
              className="flex items-center gap-1 cursor-pointer"
              title={`Voters: ${voterNames.join(', ')}`}
            >
              <Users className="w-4 h-4" />
              {voterNames.length} voters
            </div>
          </div>

          {/* Share Link Section */}
          {showShareLink && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Share this session</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can join the session. Authenticated users will join directly,
                while unauthenticated users will be prompted to provide their email for guest access.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={getShareUrl()}
                  readOnly
                  className="text-sm font-mono"
                />
                <Button
                  onClick={copyShareLink}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 min-w-[100px]"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Actions */}
      {!session.is_closed && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Voter Identification Display */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">Voting as:</span>
                {voterInfo ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={voterInfo.isGuest ? "bg-blue-100 text-blue-800" : ""}>
                      {voterInfo.name}
                      {voterInfo.isGuest && " (Guest)"}
                    </Badge>
                    {voterInfo.isGuest && (
                      <span className="text-xs text-muted-foreground">
                        Guest voting with email
                      </span>
                    )}
                  </div>
                ) : currentUser === null && !guestUser ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Loading...</Badge>
                    <span className="text-xs text-muted-foreground">
                      Checking authentication status
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Label htmlFor="voter_name">Enter your name:</Label>
                    <Input
                      id="voter_name"
                      value={voterName}
                      onChange={(e) => setVoterName(e.target.value)}
                      placeholder="Enter your name to vote"
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>

              {/* Invite Users (only for authenticated session creators) */}
              {currentUser && canUserCloseSession() && (
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Invite Individual User</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value)}
                        placeholder="Enter username to invite"
                        className="max-w-xs"
                      />
                      <Button
                        onClick={inviteUser}
                        disabled={inviteLoading}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        {inviteLoading ? 'Inviting...' : 'Invite'}
                      </Button>
                    </div>
                  </div>

                  {userTeams.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Invite Entire Team</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <select
                          value={selectedTeam}
                          onChange={(e) => setSelectedTeam(e.target.value)}
                          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select a team</option>
                          {userTeams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name} ({team.member_count} members)
                            </option>
                          ))}
                        </select>
                        <Button
                          onClick={inviteTeam}
                          disabled={teamInviteLoading || !selectedTeam}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Users className="w-3 h-3" />
                          {teamInviteLoading ? 'Inviting...' : 'Invite Team'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues */}
      <div className="space-y-4">
        {issues.map((issue) => {
          const stats = getVoteStats(issue.issue_key)
          const userVote = getUserVote(issue.issue_key)

          return (
            <Card key={issue.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {issue.issue_key}
                      <a
                        href={issue.issue_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </CardTitle>
                    <CardDescription className="text-base">
                      {issue.issue_title}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {(userVote || session.is_closed) && (
                      <div className="text-right">
                        <div
                          className="text-sm text-gray-600 cursor-pointer"
                          title={`Voters: ${stats.voterNames.join(', ')}`}
                        >
                          {stats.voteCount} votes
                        </div>
                      </div>
                    )}
                    {canUserCloseSession() && !session.is_closed && (
                      <Button
                        onClick={() => removeIssue(issue.issue_key)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {issue.issue_description && (
                  <>
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2 text-foreground">Description</h4>
                      <div className="text-sm text-foreground prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Customize rendering for better Tailwind integration
                            h1: ({node, ...props}) => <h1 className="text-lg font-semibold mb-2 text-foreground" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-semibold mb-2 text-foreground" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-1 text-foreground" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 text-foreground" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 text-foreground" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 text-foreground" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1 text-foreground" {...props} />,
                            code: ({node, inline, ...props}) =>
                              inline ?
                                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground" {...props} /> :
                                <code className="block bg-muted p-2 rounded text-sm font-mono overflow-x-auto text-foreground" {...props} />,
                            pre: ({node, ...props}) => <pre className="bg-muted p-2 rounded mb-2 overflow-x-auto" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-border pl-4 italic mb-2 text-muted-foreground" {...props} />,
                            table: ({node, ...props}) => <table className="table-auto border-collapse border border-border mb-2" {...props} />,
                            th: ({node, ...props}) => <th className="border border-border px-2 py-1 bg-muted font-semibold text-foreground" {...props} />,
                            td: ({node, ...props}) => <td className="border border-border px-2 py-1 text-foreground" {...props} />,
                            a: ({node, ...props}) => <a className="text-primary underline hover:text-primary/80" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                            em: ({node, ...props}) => <em className="italic text-foreground" {...props} />
                          }}
                        >
                          {issue.issue_description}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </>
                )}

                {issue.acceptance_criteria && (
                  <>
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2 text-foreground">Acceptance Criteria</h4>
                      <div className="text-sm text-foreground prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Customize rendering for better Tailwind integration
                            h1: ({node, ...props}) => <h1 className="text-lg font-semibold mb-2 text-foreground" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-semibold mb-2 text-foreground" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-1 text-foreground" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 text-foreground" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 text-foreground" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 text-foreground" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1 text-foreground" {...props} />,
                            code: ({node, inline, ...props}) =>
                              inline ?
                                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground" {...props} /> :
                                <code className="block bg-muted p-2 rounded text-sm font-mono overflow-x-auto text-foreground" {...props} />,
                            pre: ({node, ...props}) => <pre className="bg-muted p-2 rounded mb-2 overflow-x-auto" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-border pl-4 italic mb-2 text-muted-foreground" {...props} />,
                            table: ({node, ...props}) => <table className="table-auto border-collapse border border-border mb-2" {...props} />,
                            th: ({node, ...props}) => <th className="border border-border px-2 py-1 bg-muted font-semibold text-foreground" {...props} />,
                            td: ({node, ...props}) => <td className="border border-border px-2 py-1 text-foreground" {...props} />,
                            a: ({node, ...props}) => <a className="text-primary underline hover:text-primary/80" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                            em: ({node, ...props}) => <em className="italic text-foreground" {...props} />
                          }}
                        >
                          {issue.acceptance_criteria}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </>
                )}

                {(issue.issue_description || issue.acceptance_criteria) && (
                  <Separator className="mb-4" />
                )}

                {/* Voting Buttons */}
                {!session.is_closed && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {STORY_POINTS.map((point) => {
                        const isSelected = userVote?.estimation === point
                        return (
                          <Button
                            key={point}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => submitVote(issue.issue_key, point)}
                            disabled={submittingVote || !voterInfo}
                            className={isSelected ? "bg-blue-600 hover:bg-blue-700" : ""}
                          >
                            {point}
                          </Button>
                        )
                      })}
                    </div>
                    {userVote && (
                      <p className="text-sm text-green-600 mt-2">
                        Your vote: {userVote.estimation}
                      </p>
                    )}
                  </div>
                )}

                {/* Vote Results */}
                {(userVote || session.is_closed) && stats.voteCount > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Votes:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats.estimations).map(([estimation, count]) => (
                        <Badge key={estimation} variant="secondary">
                          {estimation}: {count}
                        </Badge>
                      ))}
                    </div>
                    {session.is_closed && (
                      <div className="mt-2">
                        <h5 className="font-medium text-sm mb-1">Voters:</h5>
                        <div className="text-sm text-gray-600">
                          {(votes[issue.issue_key] || []).map(vote =>
                            `${vote.voter_name} (${vote.estimation})`
                          ).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default VotingSession