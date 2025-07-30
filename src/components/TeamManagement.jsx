import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import {
  Users,
  Plus,
  Settings,
  Crown,
  UserX,
  Loader2,
  ChevronRight,
  Edit,
  Trash2
} from 'lucide-react'

const TeamManagement = ({ user }) => {
  const [teams, setTeams] = useState({ owned_teams: [], member_teams: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams/my-teams', {
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setTeams(data)
        setError('')
      } else {
        setError(data.error || 'Failed to fetch teams')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamDetails = async (teamId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setSelectedTeam(data.team)
        setError('')
      } else {
        setError(data.error || 'Failed to fetch team details')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    }
  }

  const CreateTeamForm = () => {
    const [formData, setFormData] = useState({ name: '', description: '' })
    const [createLoading, setCreateLoading] = useState(false)

    const handleSubmit = async (e) => {
      e.preventDefault()
      setCreateLoading(true)

      try {
        const response = await fetch('/api/teams/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData)
        })

        const data = await response.json()

        if (response.ok) {
          await fetchTeams()
          setShowCreateForm(false)
          setFormData({ name: '', description: '' })
        } else {
          setError(data.error || 'Failed to create team')
        }
      } catch (err) {
        setError('Network error: ' + err.message)
      } finally {
        setCreateLoading(false)
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Create New Team</CardTitle>
          <CardDescription>Set up a team to collaborate on estimation sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter team name"
                required
                minLength={3}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-description">Description (Optional)</Label>
              <Textarea
                id="team-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your team's purpose"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createLoading}>
                {createLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  const TeamCard = ({ team, isOwned }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => fetchTeamDetails(team.id)}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOwned && <Crown className="w-4 h-4 text-yellow-600" />}
            <span>{team.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Users className="w-3 h-3 mr-1" />
              {team.member_count}
            </Badge>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </CardTitle>
        {team.description && (
          <CardDescription>{team.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600">
          Created by {team.creator_name} • {new Date(team.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  )

  const TeamDetails = ({ team }) => {
    const [newMemberUsername, setNewMemberUsername] = useState('')
    const [memberLoading, setMemberLoading] = useState(false)
    const isOwner = team.creator_id === user?.id

    const addMember = async () => {
      if (!newMemberUsername.trim()) return

      setMemberLoading(true)
      try {
        const response = await fetch(`/api/teams/${team.id}/add-member`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: newMemberUsername.trim() })
        })

        const data = await response.json()

        if (response.ok) {
          await fetchTeamDetails(team.id)
          setNewMemberUsername('')
        } else {
          setError(data.error || 'Failed to add member')
        }
      } catch (err) {
        setError('Network error: ' + err.message)
      } finally {
        setMemberLoading(false)
      }
    }

    const removeMember = async (userId) => {
      if (!confirm('Are you sure you want to remove this member?')) return

      try {
        const response = await fetch(`/api/teams/${team.id}/remove-member`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ user_id: userId })
        })

        const data = await response.json()

        if (response.ok) {
          await fetchTeamDetails(team.id)
        } else {
          setError(data.error || 'Failed to remove member')
        }
      } catch (err) {
        setError('Network error: ' + err.message)
      }
    }

    const deleteTeam = async () => {
      if (!confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`)) return

      try {
        const response = await fetch(`/api/teams/${team.id}/delete`, {
          method: 'DELETE',
          credentials: 'include'
        })

        const data = await response.json()

        if (response.ok) {
          await fetchTeams()
          setSelectedTeam(null)
        } else {
          setError(data.error || 'Failed to delete team')
        }
      } catch (err) {
        setError('Network error: ' + err.message)
      }
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {isOwner && <Crown className="w-5 h-5 text-yellow-600" />}
                  {team.name}
                </CardTitle>
                <CardDescription>
                  {team.description || 'No description provided'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTeam(null)}
                >
                  Back
                </Button>
                {isOwner && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditForm(true)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteTeam}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              Created by {team.creator_name} • {new Date(team.created_at).toLocaleDateString()}
              • {team.member_count} members
            </div>
          </CardContent>
        </Card>

        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Team Member</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                  placeholder="Enter username"
                  onKeyPress={(e) => e.key === 'Enter' && addMember()}
                />
                <Button onClick={addMember} disabled={memberLoading}>
                  {memberLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {team.members && team.members.length > 0 ? (
                team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.username}</span>
                      {member.id === team.creator_id && (
                        <Badge variant="secondary">
                          <Crown className="w-3 h-3 mr-1" />
                          Owner
                        </Badge>
                      )}
                    </div>
                    {isOwner && member.id !== team.creator_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(member.id)}
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No members found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Loading teams...</div>
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Team Management
        </h2>
        {!showCreateForm && !selectedTeam && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        )}
      </div>

      {error && (
        <div className="text-red-600 text-center py-4 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {showCreateForm && <CreateTeamForm />}

      {selectedTeam && <TeamDetails team={selectedTeam} />}

      {!showCreateForm && !selectedTeam && (
        <div className="space-y-6">
          {/* Owned Teams */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              <h3 className="text-xl font-medium">Your Teams</h3>
              <Badge variant="secondary">{teams.owned_teams.length}</Badge>
            </div>

            {teams.owned_teams.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  You haven't created any teams yet. Click "Create Team" to get started!
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {teams.owned_teams.map(team => (
                  <TeamCard key={team.id} team={team} isOwned={true} />
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Member Teams */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-medium">Member Of</h3>
              <Badge variant="secondary">{teams.member_teams.length}</Badge>
            </div>

            {teams.member_teams.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  You're not a member of any teams yet. Ask a team owner to add you!
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {teams.member_teams.map(team => (
                  <TeamCard key={team.id} team={team} isOwned={false} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamManagement