import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Loader2 } from 'lucide-react'

const CreateSession = ({ onSessionCreated }) => {
  const [formData, setFormData] = useState({
    jira_url: '',
    jira_token: '',
    jira_query: '',
    creator_name: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        onSessionCreated(data.session_id)
      } else {
        setError(data.error || 'Failed to create session')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Estimation Session</CardTitle>
        <CardDescription>
          Set up a new Jira estimation session for your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jira_url">Jira URL</Label>
            <Input
              id="jira_url"
              name="jira_url"
              type="url"
              placeholder="https://your-company.atlassian.net"
              value={formData.jira_url}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jira_token">Jira API Token</Label>
            <Input
              id="jira_token"
              name="jira_token"
              type="password"
              placeholder="Your Jira API token"
              value={formData.jira_token}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jira_query">JQL Query</Label>
            <Textarea
              id="jira_query"
              name="jira_query"
              placeholder="project = PROJ AND status = 'To Do'"
              value={formData.jira_query}
              onChange={handleChange}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="creator_name">Your Name</Label>
            <Input
              id="creator_name"
              name="creator_name"
              type="text"
              placeholder="Enter your name"
              value={formData.creator_name}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Session...
              </>
            ) : (
              'Create Session'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default CreateSession