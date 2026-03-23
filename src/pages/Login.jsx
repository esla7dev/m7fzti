import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      toast.success('Logged in successfully!')
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        toast.error('يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد.')
      } else if (error.message?.toLowerCase().includes('invalid login credentials')) {
        toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      } else {
        toast.error(error.message || 'فشل تسجيل الدخول')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-700 mb-2">Financial App</h1>
          <p className="text-gray-600">Personal Finance Tracker</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium mb-2">Email</label>
            <Input
              id="login-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium mb-2">Password</label>
            <Input
              id="login-password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            className="text-gray-500 hover:text-emerald-600 p-0 text-sm"
            onClick={() => navigate('/forgot-password')}
          >
            نسيت كلمة المرور؟
          </Button>
        </div>

        <div className="mt-2 text-center">
          <p className="text-gray-600">Don't have an account?</p>
          <Button
            variant="link"
            className="text-emerald-600 hover:text-emerald-700 p-0"
            onClick={() => navigate('/signup')}
          >
            Sign up here
          </Button>
        </div>
      </Card>
    </div>
  )
}
