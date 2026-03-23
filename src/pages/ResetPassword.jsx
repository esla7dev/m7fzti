import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Supabase automatically sets the session from the URL hash token
    supabase.auth.onAuthStateChange((_event) => {
      // PASSWORD_RECOVERY event means the reset link was valid
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    if (password !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      toast.success('تم تغيير كلمة المرور بنجاح')
      navigate('/login')
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error(error.message || 'خطأ في تغيير كلمة المرور')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-700 mb-2">إعادة تعيين كلمة المرور</h1>
          <p className="text-gray-600">أدخل كلمة المرور الجديدة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium mb-2">كلمة المرور الجديدة</label>
            <Input
              id="new-password"
              type="password"
              placeholder="6 أحرف على الأقل"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="confirm-new-password" className="block text-sm font-medium mb-2">تأكيد كلمة المرور</label>
            <Input
              id="confirm-new-password"
              type="password"
              placeholder="أعد إدخال كلمة المرور"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={isLoading}
          >
            {isLoading ? 'جارِ الحفظ...' : 'حفظ كلمة المرور الجديدة'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="link"
            className="text-emerald-600 hover:text-emerald-700 p-0"
            onClick={() => navigate('/login')}
          >
            العودة لتسجيل الدخول
          </Button>
        </div>
      </Card>
    </div>
  )
}
