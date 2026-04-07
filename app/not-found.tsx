'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('user_role'))
    }
  }, [])

  const handleGoHome = () => {
    // Determine the safest home based on role
    if (role === 'SCHOOL_ADMIN') {
      router.push('/school-admin')
    } else if (role === 'BUSINESS_ADMIN') {
      router.push('/business-admin')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <span className="text-[12rem] font-black pointer-events-none">404</span>
          </div>
          <div className="relative z-10 flex justify-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center animate-bounce shadow-xl shadow-blue-200">
              <Search className="h-10 w-10 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Trang không tồn tại</h1>
          <p className="text-slate-500 font-medium">
            Có vẻ như đường dẫn bạn đang truy cập không tồn tại hoặc đã bị gỡ bỏ trong hệ thống DUT Job Fair.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            className="w-full sm:w-auto h-12 px-6 flex items-center gap-2 border-slate-200 hover:bg-white hover:border-blue-600 hover:text-blue-600 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang trước
          </Button>
          
          <Button
            size="lg"
            onClick={handleGoHome}
            className="w-full sm:w-auto h-12 px-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all"
          >
            <Home className="h-4 w-4" />
            {role ? 'Về Dashboard' : 'Về trang chủ'}
          </Button>
        </div>

        <div className="pt-8">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">DUT Job Fair 2026</p>
        </div>
      </div>
    </div>
  )
}
