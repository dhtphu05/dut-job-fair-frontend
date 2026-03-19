'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Lock, Loader2, User } from 'lucide-react'
import { useAuthControllerLogin, useAuthControllerRegister } from '@/lib/api/generated/auth/auth'
import { RegisterDtoRole } from '@/lib/api/generated/model'
import { toast } from 'sonner'
import { customAxiosInstance } from '@/lib/axios-instance'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'school_admin' | 'business_admin'>('school_admin')
  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Register state (business_admin only)
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regBusinessId, setRegBusinessId] = useState('')
  const [businessMode, setBusinessMode] = useState<'login' | 'register'>('login')

  const { mutateAsync: login, isPending: loginPending } = useAuthControllerLogin()
  const { mutateAsync: register, isPending: registerPending } = useAuthControllerRegister()

  // Fetch available businesses for registration dropdown
  const { data: bizListData } = useQuery({
    queryKey: ['public-businesses'],
    queryFn: () => customAxiosInstance<{ data: Array<{ id: string; name: string; industry: string; registered: boolean }> }>('/api/auth/businesses', { method: 'GET' }),
    staleTime: 60_000,
  })
  const businesses: Array<{ id: string; name: string; industry: string; registered: boolean }> =
    (bizListData as any)?.data ?? []

  const saveAuthAndRedirect = (authDto: any, target: string) => {
    const accessToken = authDto?.accessToken
    if (!accessToken) { toast.error('Không nhận được token'); return }
    localStorage.setItem('auth_token', accessToken)
    if (authDto?.boothId) {
      localStorage.setItem('booth_id', authDto.boothId)
    } else {
      localStorage.removeItem('booth_id')
    }
    toast.success('Thành công!')
    router.push(target)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await login({ data: { email, password } })
      const authDto = (response as any)?.data
      const userRole: string = authDto?.role ?? ''
      const roleLower = userRole.toLowerCase()
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regBusinessId) { toast.error('Vui lòng chọn doanh nghiệp của bạn'); return }
    try {
      const response = await register({
        data: {
          name: regName,
          email: regEmail,
          password: regPassword,
          role: RegisterDtoRole.business_admin,
          businessId: regBusinessId,
        }
      })
      const authDto = (response as any)?.data
      saveAuthAndRedirect(authDto, '/business-admin')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Đăng ký thất bại')
    }
  }

  const loginForm = (idPrefix: string) => (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`} className="flex items-center gap-2">
          <Mail className="h-4 w-4" /> Email
        </Label>
        <Input id={`${idPrefix}-email`} type="email" placeholder="email@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loginPending} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-password`} className="flex items-center gap-2">
          <Lock className="h-4 w-4" /> Mật khẩu
        </Label>
        <Input id={`${idPrefix}-password`} type="password" placeholder="••••••••"
          value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loginPending} />
      </div>
      <Button type="submit" className="w-full" disabled={loginPending}>
        {loginPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang đăng nhập...</> : 'Đăng nhập'}
      </Button>
    </form>
  )

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">DUT Job Fair 2025</CardTitle>
        <CardDescription>Đăng nhập hoặc tạo tài khoản</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={role} onValueChange={(value) => setRole(value as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="school_admin">School Admin</TabsTrigger>
            <TabsTrigger value="business_admin">Business Admin</TabsTrigger>
          </TabsList>

          {/* ── School Admin: login only ── */}
          <TabsContent value="school_admin" className="space-y-4">
            {loginForm('school')}
          </TabsContent>

          {/* ── Business Admin: login + register ── */}
          <TabsContent value="business_admin" className="space-y-4">
            <Tabs value={businessMode} onValueChange={(v) => setBusinessMode(v as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                <TabsTrigger value="register">Đăng ký</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {loginForm('business')}
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Họ và tên
                    </Label>
                    <Input id="reg-name" type="text" placeholder="Nguyễn Văn A"
                      value={regName} onChange={(e) => setRegName(e.target.value)} required disabled={registerPending} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </Label>
                    <Input id="reg-email" type="email" placeholder="contact@company.com"
                      value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required disabled={registerPending} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Mật khẩu
                    </Label>
                    <Input id="reg-password" type="password" placeholder="••••••••"
                      value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required disabled={registerPending} minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label>Doanh nghiệp của bạn</Label>
                    <Select value={regBusinessId} onValueChange={setRegBusinessId} disabled={registerPending}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn doanh nghiệp…" />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses.length === 0 && (
                          <SelectItem value="_empty" disabled>Chưa có doanh nghiệp nào</SelectItem>
                        )}
                        {businesses.map((b) => (
                          <SelectItem key={b.id} value={b.id} disabled={b.registered}>
                            {b.name}{b.industry ? ` – ${b.industry}` : ''}{b.registered ? ' (Đã có tài khoản)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={registerPending}>
                    {registerPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang đăng ký...</> : 'Tạo tài khoản'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Thông tin đăng nhập do quản trị viên cung cấp
        </div>
      </CardContent>
    </Card>
  )
}
