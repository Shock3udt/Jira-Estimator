import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { DarkModeToggleCompact } from '@/components/ui/dark-mode-toggle.jsx'
import { Loader2, LogIn } from 'lucide-react'

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username_or_email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        onLogin(data.user)
      } else {
        setError(data.error || 'Login failed')
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
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-end mb-4">
        <DarkModeToggleCompact />
      </div>
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <LogIn className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to access your estimation sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username_or_email">Username or Email</Label>
              <Input
                id="username_or_email"
                name="username_or_email"
                type="text"
                placeholder="Enter your username or email"
                value={formData.username_or_email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
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
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Button
                variant="link"
                onClick={onSwitchToRegister}
                className="p-0 h-auto font-normal"
              >
                Sign up here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login