'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { AUTH_ENDPOINTS } from '@/lib/constants'
import { useAuthControllerLogin, useAuthControllerGetProfile } from '@/lib/api/generated/auth/auth'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { getAuthControllerGetProfileQueryKey } from '@/lib/api/generated/auth/auth'

export default function LoginPage() {
  const router = useRouter()
  // Note: the backend login doesn't seem to take role in LoginDto, but we keep the UI state
  const [role, setRole] = useState<'school_admin' | 'business_admin'>('school_admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const queryClient = useQueryClient()

  const { mutateAsync: login, isPending } = useAuthControllerLogin()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await login({
        data: {
          email,
          password
        }
      })

      // customAxiosInstance now returns response.data (unwrapped Axios response).
      // Orval typed return: { data: AuthResponseDto, status: 200, headers }
      // So response = { data: AuthResponseDto, status: 200, headers }
      // and response.data = AuthResponseDto = { accessToken, refreshToken, role, ... }
      console.log('[Login] full response:', JSON.stringify(response, null, 2))

      const authDto = (response as any)?.data
      const accessToken: string | undefined = authDto?.accessToken
      const userRole: string = authDto?.role ?? ''
      console.log('[Login] accessToken:', accessToken?.slice(0, 20), '| role:', userRole)

      if (!accessToken) {
        toast.error('Đăng nhập thất bại – không nhận được token')
        return
      }

      localStorage.setItem('auth_token', accessToken)
      toast.success('Đăng nhập thành công')

      const roleLower = userRole.toLowerCase()
      const target = roleLower === 'school_admin'
        ? '/school-admin'
        : roleLower === 'business_admin'
          ? '/business-admin'
          : role === 'school_admin' ? '/school-admin' : '/business-admin'

      console.log('[Login] routing to:', target)
      router.push(target)
    } catch (err: any) {
      console.error('Login error:', err)
      toast.error(
        err?.response?.data?.message || err?.message || 'Email hoặc mật khẩu không chính xác'
      )
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">DUT Job Fair 2025</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={role} onValueChange={(value) => setRole(value as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="school_admin">School Admin</TabsTrigger>
            <TabsTrigger value="business_admin">Business Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="school_admin" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@dut.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="business_admin" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="email-business" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email-business"
                  type="email"
                  placeholder="contact@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-business" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password-business"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Demo: Use test credentials provided by your administrator
        </div>
      </CardContent>
    </Card>
  )
}
