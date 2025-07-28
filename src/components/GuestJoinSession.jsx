import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { UserPlus, ArrowLeft, Loader2 } from 'lucide-react'

const GuestJoinSession = ({ onSessionJoined, onBack }) => {
  const [formData, setFormData] = useState({
    session_id: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      // Check if session exists by trying to fetch it
      const response = await fetch(`/api/session/${formData.session_id.trim()}`)
      const data = await response.json()

      if (response.ok) {
        // Session exists, join as guest
        onSessionJoined(formData.session_id.trim(), false, '', {
          isGuest: true,
          email: formData.email.trim()
        })
      } else {
        setError(data.error || 'Session not found')
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
    setError('')
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </Button>

      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle>Join Session as Guest</CardTitle>
          <CardDescription>
            Enter your email and session ID to join an estimation session as a guest
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your.email@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Your email will be used to identify your votes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_id">Session ID</Label>
              <Input
                id="session_id"
                name="session_id"
                type="text"
                placeholder="Enter session ID"
                value={formData.session_id}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Get the session ID from the session creator
              </p>
            </div>

            {error && (
              <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining Session...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Session
                </>
              )}
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="bg-muted/50 p-4 rounded-md">
            <h4 className="font-medium text-sm mb-2">Guest Voting</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• You can vote on issues without creating an account</li>
              <li>• Your votes will be identified by your email address</li>
              <li>• You won't be able to create or manage sessions</li>
              <li>• Consider creating an account for full features</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GuestJoinSession