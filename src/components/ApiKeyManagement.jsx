import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  Clock,
  Activity
} from 'lucide-react'

const ApiKeyManagement = ({ user }) => {
  const [apiKeys, setApiKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKey, setNewKey] = useState(null) // Store newly created key
  const [showNewKey, setShowNewKey] = useState(false) // Toggle key visibility

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    scopes: 'read',
    expires_in_days: ''
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/api-keys/', {
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setApiKeys(data.api_keys)
        setError('')
      } else {
        setError(data.error || 'Failed to fetch API keys')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!formData.name.trim()) {
      setError('API key name is required')
      return
    }

    setCreating(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/api-keys/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setNewKey(data.api_key)
        setShowNewKey(true)
        setSuccess('API key created successfully!')
        setShowCreateForm(false)
        setFormData({ name: '', scopes: 'read', expires_in_days: '' })
        fetchApiKeys() // Refresh the list
      } else {
        setError(data.error || 'Failed to create API key')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const deleteApiKey = async (keyId, keyName) => {
    if (!confirm(`Are you sure you want to delete the API key "${keyName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('API key deleted successfully!')
        fetchApiKeys() // Refresh the list
      } else {
        setError(data.error || 'Failed to delete API key')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess('API key copied to clipboard!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to copy to clipboard')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never expires'
    return new Date(dateString).toLocaleDateString()
  }

  const getScopeColor = (scopes) => {
    if (scopes.includes('admin')) return 'bg-red-100 text-red-800'
    if (scopes.includes('write')) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading API keys...
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="w-6 h-6" />
          <h2 className="text-2xl font-semibold">API Key Management</h2>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create API Key
        </Button>
      </div>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Your API Keys
          </CardTitle>
          <CardDescription>
            Manage your API keys for programmatic access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No API keys created yet</p>
              <p className="text-sm">Create your first API key to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className={`border rounded-lg p-4 ${
                    !apiKey.is_active || apiKey.is_expired
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{apiKey.name}</h3>
                        <Badge variant="secondary" className={getScopeColor(apiKey.scopes)}>
                          {apiKey.scopes}
                        </Badge>
                        {!apiKey.is_active && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            Revoked
                          </Badge>
                        )}
                        {apiKey.is_expired && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Expired
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-4">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            {apiKey.key_prefix}...
                          </span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Created: {formatDate(apiKey.created_at)}
                          </div>
                          {apiKey.expires_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires: {formatDate(apiKey.expires_at)}
                            </div>
                          )}
                        </div>
                        {apiKey.last_used_at && (
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Last used: {formatDate(apiKey.last_used_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteApiKey(apiKey.id, apiKey.name)}
                        className="flex items-center gap-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            API Documentation
          </CardTitle>
          <CardDescription>
            Use your API keys to programmatically interact with the Jira Estimation Tool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-2">Authentication</h4>
              <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                <p className="mb-1">Header: <code className="bg-gray-200 px-1 rounded">X-API-Key: your_api_key_here</code></p>
                <p>Or: <code className="bg-gray-200 px-1 rounded">Authorization: Bearer your_api_key_here</code></p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm mb-2">Available Endpoints</h4>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">POST</Badge>
                    <code>/api/create-session</code>
                  </div>
                  <p className="text-gray-600 text-xs">Create a new estimation session</p>
                  <div className="mt-2 bg-white p-2 rounded border text-xs font-mono">
                    {`{
  "jira_url": "https://company.atlassian.net",
  "jira_token": "your_jira_token",
  "jira_query": "project = PROJ AND status = 'To Do'"
}`}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">GET</Badge>
                    <code>/api/session/&lt;session_id&gt;</code>
                  </div>
                  <p className="text-gray-600 text-xs">Get session details, issues, and votes</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">POST</Badge>
                    <code>/api/vote</code>
                  </div>
                  <p className="text-gray-600 text-xs">Submit a vote for an issue</p>
                  <div className="mt-2 bg-white p-2 rounded border text-xs font-mono">
                    {`{
  "session_id": "session_uuid",
  "issue_key": "PROJ-123",
  "estimation": "5"
}`}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">POST</Badge>
                    <code>/api/close-session</code>
                  </div>
                  <p className="text-gray-600 text-xs">Close session and update Jira with final estimations</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm mb-2">Example Usage</h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded-md font-mono text-sm overflow-x-auto">
                {`curl -X POST https://your-domain.com/api/create-session \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: jira_est_xxxxxxxxxxxxxxxx" \\
  -d '{
    "jira_url": "https://company.atlassian.net",
    "jira_token": "ATATT3xFfGF...",
    "jira_query": "project = MYPROJ AND status = \\"To Do\\""
  }'`}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">API Key Scopes</p>
                  <ul className="text-blue-700 mt-1 space-y-1">
                    <li><strong>read:</strong> View sessions, issues, and votes</li>
                    <li><strong>write:</strong> Create sessions, submit votes</li>
                    <li><strong>admin:</strong> Full access including session management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
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

      {/* New API Key Display */}
      {newKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Shield className="w-5 h-5" />
              New API Key Created
            </CardTitle>
            <CardDescription className="text-green-700">
              This is the only time you'll see the full API key. Store it safely!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-green-800">API Key</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type={showNewKey ? "text" : "password"}
                    value={newKey.key}
                    readOnly
                    className="font-mono text-sm bg-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewKey(!showNewKey)}
                  >
                    {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(newKey.key)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-green-700">
                <span><strong>Name:</strong> {newKey.name}</span>
                <span><strong>Scopes:</strong> {newKey.scopes}</span>
                {newKey.expires_at && (
                  <span><strong>Expires:</strong> {formatDate(newKey.expires_at)}</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewKey(null)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
            <CardDescription>
              Generate a new API key for programmatic access to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., My Integration Key"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="scopes">Permissions</Label>
                <select
                  id="scopes"
                  value={formData.scopes}
                  onChange={(e) => setFormData({ ...formData, scopes: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="read">Read - View sessions and votes</option>
                  <option value="write">Write - Create and manage sessions</option>
                  <option value="read,write">Read & Write - Full session management</option>
                  <option value="admin">Admin - All permissions</option>
                </select>
              </div>

              <div>
                <Label htmlFor="expires_in_days">Expires in (days)</Label>
                <Input
                  id="expires_in_days"
                  type="number"
                  value={formData.expires_in_days}
                  onChange={(e) => setFormData({ ...formData, expires_in_days: e.target.value })}
                  placeholder="Leave empty for no expiration"
                  min="1"
                  max="365"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Maximum 365 days. Leave empty for keys that never expire.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={createApiKey}
                  disabled={creating}
                  className="flex items-center gap-2"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {creating ? 'Creating...' : 'Create API Key'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ApiKeyManagement