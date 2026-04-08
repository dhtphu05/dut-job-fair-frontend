'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Lock, Loader2, Info } from 'lucide-react'
import { useAuthControllerLogin } from '@/lib/api/generated/auth/auth'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'school_admin' | 'business_admin'>('school_admin')
  
  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { mutateAsync: login, isPending: loginPending } = useAuthControllerLogin()

  const saveAuthAndRedirect = (authDto: any, target: string) => {
    const accessToken = authDto?.accessToken
    if (!accessToken) { 
      toast.error('Không nhận được token')
      return 
    }
    localStorage.setItem('auth_token', accessToken)
    
    // Save role for Home page redirection logic
    if (authDto?.role) {
      localStorage.setItem('user_role', authDto.role)
    }
    
    // Save boothId if business admin
    if (authDto?.boothId) {
      localStorage.setItem('booth_id', authDto.boothId)
    } else {
      localStorage.removeItem('booth_id')
    }
    
    toast.success('Đăng nhập thành công!')
    router.push(target)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await login({ data: { email, password } })
      const authDto = (response as any)?.data
      const userRole: string = authDto?.role ?? ''
      const roleLower = userRole.toLowerCase()
      
      // Determine redirect target based on returned role or selected tab
      const target = roleLower === 'school_admin'
        ? '/school-admin'
        : roleLower === 'business_admin'
          ? '/business-admin'
          : role === 'school_admin' ? '/school-admin' : '/business-admin'
          
      saveAuthAndRedirect(authDto, target)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Email hoặc mật khẩu không chính xác')
    }
  }

  const renderLoginForm = (idPrefix: string) => (
    <form onSubmit={handleLogin} className="space-y-4 pt-2" autoComplete="off">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`} className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4 text-muted-foreground" /> Email
        </Label>
        <Input 
          id={`${idPrefix}-email`} 
          type="email" 
          placeholder="admin@example.com"
          name={`${idPrefix}-login-email`}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          disabled={loginPending}
          className="focus-visible:ring-blue-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-password`} className="flex items-center gap-2 text-sm font-medium">
          <Lock className="h-4 w-4 text-muted-foreground" /> Mật khẩu
        </Label>
        <Input 
          id={`${idPrefix}-password`} 
          type="password" 
          placeholder="••••••••"
          name={`${idPrefix}-login-password`}
          autoComplete="new-password"
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          disabled={loginPending}
          className="focus-visible:ring-blue-500"
        />
      </div>
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors" disabled={loginPending}>
        {loginPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang đăng nhập...</>
        ) : (
          'Đăng nhập'
        )}
      </Button>
    </form>
  )

  return (
    <Card className="shadow-xl border-border/50 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
          <Lock className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">DUT Jobfair 2026 - Checkin</CardTitle>
        <CardDescription>Hệ thống check-in và hộ chiếu điện tử</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={role} onValueChange={(value) => {
          setRole(value as any)
          setEmail('')
          setPassword('')
        }}>
          <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-muted/50">
            <TabsTrigger value="school_admin" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Nhà trường
            </TabsTrigger>
            <TabsTrigger value="business_admin" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Doanh nghiệp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="school_admin">
            {renderLoginForm('school')}
          </TabsContent>

          <TabsContent value="business_admin">
            {renderLoginForm('business')}
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100/50">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Lưu ý:</strong> Tài khoản đăng nhập được Ban Tổ Chức cấp cho các đơn vị vận hành hệ thống check-in và hộ chiếu điện tử. Vui lòng liên hệ BTC nếu bạn cần hỗ trợ truy cập.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
