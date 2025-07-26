import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { ExternalLink, Users, Clock, CheckCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const STORY_POINTS = ['1', '2', '3', '5', '8', '13', '21', '?']

const VotingSession = ({ sessionId, isCreator, creatorName }) => {
  const [session, setSession] = useState(null)
  const [issues, setIssues] = useState([])
  const [votes, setVotes] = useState({})
  const [voterName, setVoterName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submittingVote, setSubmittingVote] = useState(false)

  useEffect(() => {
    fetchSession()
    const interval = setInterval(fetchSession, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}`)
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
    if (!voterName.trim()) {
      alert('Please enter your name first')
      return
    }

    setSubmittingVote(true)
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          issue_key: issueKey,
          voter_name: voterName.trim(),
          estimation: estimation
        }),
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
      const response = await fetch('/api/close-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          creator_name: creatorName
        }),
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
    return issueVotes.find(v => v.voter_name === voterName.trim())
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
            {isCreator && !session.is_closed && (
              <Button onClick={closeSession} variant="destructive">
                Close Session
              </Button>
            )}
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
        </CardContent>
      </Card>

      {/* Voter Name Input */}
      {!session.is_closed && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="voter_name">Your Name:</Label>
              <Input
                id="voter_name"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="Enter your name to vote"
                className="max-w-xs"
              />
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
                </div>
              </CardHeader>
              <CardContent>
                {issue.issue_description && (
                  <>
                    <div className="text-sm text-gray-700 mb-4 prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Customize rendering for better Tailwind integration
                          h1: ({node, ...props}) => <h1 className="text-lg font-semibold mb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-semibold mb-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-1" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          code: ({node, inline, ...props}) =>
                            inline ?
                              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono" {...props} /> :
                              <code className="block bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto" {...props} />,
                          pre: ({node, ...props}) => <pre className="bg-gray-100 p-2 rounded mb-2 overflow-x-auto" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2" {...props} />,
                          table: ({node, ...props}) => <table className="table-auto border-collapse border border-gray-300 mb-2" {...props} />,
                          th: ({node, ...props}) => <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold" {...props} />,
                          td: ({node, ...props}) => <td className="border border-gray-300 px-2 py-1" {...props} />,
                          a: ({node, ...props}) => <a className="text-blue-600 underline hover:text-blue-800" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                          em: ({node, ...props}) => <em className="italic" {...props} />
                        }}
                      >
                        {issue.issue_description}
                      </ReactMarkdown>
                    </div>
                    <Separator className="mb-4" />
                  </>
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
                            disabled={submittingVote || !voterName.trim()}
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