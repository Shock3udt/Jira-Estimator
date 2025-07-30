import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { ArrowLeft, Users } from 'lucide-react'

const JoinSession = ({ onSessionJoined, onBack }) => {
  const [sessionId, setSessionId] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (sessionId.trim()) {
      onSessionJoined(sessionId.trim(), false, '')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
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
              <Users className="mr-2 h-4 w-4" />
              Join Session
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default JoinSession