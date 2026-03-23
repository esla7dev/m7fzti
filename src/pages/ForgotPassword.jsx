import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      setSent(true)
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور')
    } catch (error) {
      console.error('Reset error:', error)
      toast.error(error.message || 'حدث خطأ أثناء إرسال الرابط')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-700 mb-2">نسيت كلمة المرور</h1>
          <p className="text-gray-600">أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">📧</span>
            </div>
            <p className="text-gray-700">تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني</p>
            <p className="text-sm text-gray-500">تحقق من صندوق الوارد (والرسائل غير المرغوبة)</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/login')}
            >
              العودة لتسجيل الدخول
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
              <Input
                id="reset-email"
                name="email"
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? 'جارِ الإرسال...' : 'إرسال رابط إعادة التعيين'}
            </Button>
          </form>
        )}

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
