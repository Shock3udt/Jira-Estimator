import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import {
  Settings,
  Save,
  Trash2,
  TestTube,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Link,
  Key
} from 'lucide-react'

const JiraSettings = ({ user }) => {
  const [settings, setSettings] = useState({
    jira_url: '',
    jira_token: '',
    has_jira_token: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchJiraSettings()
  }, [])

  const fetchJiraSettings = async () => {
    try {
      const response = await fetch('/api/auth/jira-settings', {
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setSettings({
          jira_url: data.jira_url || '',
          jira_token: '', // Never pre-fill token for security
          has_jira_token: data.has_jira_token
        })
        setError('')
      } else {
        setError(data.error || 'Failed to fetch Jira settings')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveJiraSettings = async () => {
    if (!settings.jira_url.trim()) {
      setError('Jira URL is required')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/jira-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          jira_url: settings.jira_url.trim(),
          jira_token: settings.jira_token.trim()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSettings(prev => ({
          ...prev,
          jira_token: '', // Clear token field after saving
          has_jira_token: data.has_jira_token
        }))
        setSuccess('Jira settings saved successfully!')

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to save Jira settings')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const clearJiraSettings = async () => {
    if (!confirm('Are you sure you want to clear your saved Jira settings?')) {
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/jira-settings', {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setSettings({
          jira_url: '',
          jira_token: '',
          has_jira_token: false
        })
        setSuccess('Jira settings cleared successfully!')

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to clear Jira settings')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const testJiraConnection = async () => {
    if (!settings.jira_url.trim()) {
      setError('Please enter a Jira URL first')
      return
    }

    if (!settings.jira_token.trim() && !settings.has_jira_token) {
      setError('Please enter a Jira API token first')
      return
    }

    setTesting(true)
    setError('')
    setSuccess('')

    try {
      // Test connection by trying to create a session with a simple query
      const response = await fetch('/api/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          jira_url: settings.jira_url.trim(),
          jira_token: settings.jira_token.trim() || undefined,
          jira_query: 'ORDER BY created DESC',
          use_saved_credentials: !settings.jira_token.trim(), // Use saved if no new token provided
          test_connection: true
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('✅ Jira connection test successful!')
      } else {
        setError('Connection test failed: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      setError('Connection test failed: ' + err.message)
    } finally {
      setTesting(false)
    }
  }

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
    setSuccess('')
  }

  if (loading) {
    return <div className="text-center py-8">Loading Jira settings...</div>
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-6 h-6" />
        <h2 className="text-2xl font-semibold">Jira Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Save Your Jira Credentials
          </CardTitle>
          <CardDescription>
            Save your Jira URL and API token to avoid entering them every time you create a session.
            Your token is encrypted and stored securely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="jira_url" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Jira URL
            </Label>
            <Input
              id="jira_url"
              type="url"
              placeholder="https://your-company.atlassian.net"
              value={settings.jira_url}
              onChange={(e) => handleChange('jira_url', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="jira_token" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Jira API Token
              </Label>
              {settings.has_jira_token && (
                <Badge variant="secondary" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Token Saved
                </Badge>
              )}
            </div>
            <Input
              id="jira_token"
              type="password"
              placeholder={settings.has_jira_token ? "Leave empty to keep current token" : "Enter your Jira API token"}
              value={settings.jira_token}
              onChange={(e) => handleChange('jira_token', e.target.value)}
            />
            <div className="text-xs text-gray-600">
              <p>To create an API token:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Go to your Jira Account Settings → Security → API tokens</li>
                <li>Click "Create API token"</li>
                <li>Copy the generated token and paste it here</li>
              </ol>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={saveJiraSettings}
              disabled={saving || !settings.jira_url.trim()}
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>

            <Button
              onClick={testJiraConnection}
              disabled={testing || !settings.jira_url.trim()}
              variant="outline"
              className="flex items-center gap-2"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>

            {(settings.jira_url || settings.has_jira_token) && (
              <Button
                onClick={clearJiraSettings}
                disabled={saving}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Settings
              </Button>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Security Note</p>
                <p className="text-blue-700 mt-1">
                  Your Jira API token is encrypted before being stored. However, for maximum security,
                  consider using API tokens with limited scopes and rotating them regularly.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default JiraSettings