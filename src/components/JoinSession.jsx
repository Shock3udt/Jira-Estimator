import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'

const JoinSession = ({ onSessionJoined }) => {
  const [sessionId, setSessionId] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (sessionId.trim()) {
      onSessionJoined(sessionId.trim(), false, '')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Join Estimation Session</CardTitle>
        <CardDescription>
          Enter the session ID to join an existing estimation session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session_id">Session ID</Label>
            <Input
              id="session_id"
              type="text"
              placeholder="Enter session ID"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Join Session
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default JoinSession