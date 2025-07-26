import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Loader2, Shield, Save, Settings } from 'lucide-react'

const CreateSession = ({ onSessionCreated }) => {
  const [formData, setFormData] = useState({
    jira_url: '',
    jira_token: '',
    jira_query: ''
  })
  const [savedSettings, setSavedSettings] = useState({
    jira_url: '',
    has_jira_token: false
  })
  const [useSavedCredentials, setUseSavedCredentials] = useState(false)
  const [saveCredentials, setSaveCredentials] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSavedSettings()
  }, [])

  const fetchSavedSettings = async () => {
    try {
      const response = await fetch('/api/auth/jira-settings', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setSavedSettings({
          jira_url: data.jira_url || '',
          has_jira_token: data.has_jira_token
        })

        // If user has saved credentials, offer to use them
        if (data.jira_url && data.has_jira_token) {
          setUseSavedCredentials(true)
          setFormData(prev => ({
            ...prev,
            jira_url: data.jira_url
          }))
        }
      }
    } catch (err) {
      console.error('Failed to fetch saved settings:', err)
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Prepare the request payload
      const payload = {
        ...formData,
        use_saved_credentials: useSavedCredentials
      }

      // If using saved credentials, don't send URL/token if they're empty
      if (useSavedCredentials) {
        if (!formData.jira_url && savedSettings.jira_url) {
          delete payload.jira_url
        }
        if (!formData.jira_token && savedSettings.has_jira_token) {
          delete payload.jira_token
        }
      }

      const response = await fetch('/api/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        // Save credentials if requested and not using saved ones
        if (saveCredentials && !useSavedCredentials && formData.jira_url && formData.jira_token) {
          try {
            await fetch('/api/auth/jira-settings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                jira_url: formData.jira_url,
                jira_token: formData.jira_token
              }),
            })
          } catch (saveErr) {
            console.error('Failed to save credentials:', saveErr)
            // Don't fail session creation if saving credentials fails
          }
        }

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

  if (loadingSettings) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p>Loading your settings...</p>
        </CardContent>
      </Card>
    )
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
        {/* Saved Credentials Option */}
        {savedSettings.jira_url && savedSettings.has_jira_token && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Use Saved Credentials</span>
              </div>
              <Badge variant="secondary">
                <Settings className="w-3 h-3 mr-1" />
                Saved
              </Badge>
            </div>
            <div className="text-sm text-blue-700 mb-3">
              <p><strong>URL:</strong> {savedSettings.jira_url}</p>
              <p><strong>Token:</strong> ••••••••••••</p>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useSavedCredentials}
                onChange={(e) => {
                  setUseSavedCredentials(e.target.checked)
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      jira_url: savedSettings.jira_url,
                      jira_token: ''
                    }))
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      jira_url: '',
                      jira_token: ''
                    }))
                  }
                }}
                className="rounded"
              />
              <span className="text-sm text-blue-800">Use my saved Jira credentials</span>
            </label>
          </div>
        )}

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
              required={!useSavedCredentials}
              disabled={useSavedCredentials && savedSettings.jira_url}
            />
            {useSavedCredentials && savedSettings.jira_url && (
              <p className="text-xs text-gray-600">Using saved URL</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="jira_token">Jira API Token</Label>
            <Input
              id="jira_token"
              name="jira_token"
              type="password"
              placeholder={useSavedCredentials && savedSettings.has_jira_token ? "Using saved token" : "Your Jira API token"}
              value={formData.jira_token}
              onChange={handleChange}
              required={!useSavedCredentials}
              disabled={useSavedCredentials && savedSettings.has_jira_token}
            />
            {useSavedCredentials && savedSettings.has_jira_token && (
              <p className="text-xs text-gray-600">Using saved token</p>
            )}
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
            <div className="text-xs text-gray-600">
              <p>Examples:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>project = MYPROJECT AND status = "To Do"</li>
                <li>assignee = currentUser() AND status != Done</li>
                <li>project in (PROJ1, PROJ2) AND priority = High</li>
              </ul>
            </div>
          </div>

          {/* Save Credentials Option */}
          {!useSavedCredentials && formData.jira_url && formData.jira_token && (
            <div className="p-3 bg-gray-50 rounded-md">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={saveCredentials}
                  onChange={(e) => setSaveCredentials(e.target.checked)}
                  className="rounded"
                />
                <div className="flex items-center gap-2 text-sm">
                  <Save className="w-4 h-4" />
                  <span>Save these credentials for future sessions</span>
                </div>
              </label>
              <p className="text-xs text-gray-600 mt-1 ml-6">
                Your credentials will be encrypted and stored securely
              </p>
            </div>
          )}

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