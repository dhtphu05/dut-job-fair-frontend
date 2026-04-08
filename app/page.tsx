'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  LogIn, 
  Users, 
  QrCode, 
  Gift, 
  Star,
  Globe,
  BarChart3,
  Menu,
  Mail
} from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [dashboardPath, setDashboardPath] = useState('/login')

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      setIsLoggedIn(true)
      // Check role to determine where to send them
      const role = (localStorage.getItem('user_role') || '').toUpperCase()
      if (role === 'SCHOOL_ADMIN') setDashboardPath('/school-admin')
      else if (role === 'BUSINESS_ADMIN') setDashboardPath('/business-admin')
      else setDashboardPath('/login') // Default fallback
    }
  }, [])

  return (
    <main className="min-h-screen bg-[#F1F5F9] font-sans">
      {/* Navigation Header */}
      <header className="fixed top-0 z-50 w-full bg-white/90 backdrop-blur-sm border-b border-slate-100">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo_dut.webp" 
              alt="DUT Logo" 
              width={32} 
              height={32} 
              className="object-contain"
            />
            <span className="text-lg font-black tracking-tight text-blue-700 uppercase">
              DUT JOB FAIR 2026
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <Button 
                variant="ghost" 
                onClick={() => router.push(dashboardPath)}
                className="text-blue-600 font-bold text-xs uppercase tracking-widest border border-blue-100 hover:bg-blue-50"
              >
                Trang quản trị
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-gradient-to-b from-blue-100 via-blue-50 to-transparent">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            {/* Pill Badge */}
            <div className="px-4 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-white text-[10px] font-bold tracking-widest text-blue-600 uppercase mb-8 shadow-sm">
              ● TRƯỜNG ĐẠI HỌC BÁCH KHOA - ĐẠI HỌC ĐÀ NẴNG
            </div>

            {/* Title */}
            <h1 className="text-[32px] sm:text-[48px] font-extrabold text-slate-900 leading-[1.2] mb-6">
              Hệ Thống Check-in Và <br className="hidden sm:block" />
              <span className="text-blue-600 italic">Hộ Chiếu Điện Tử</span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-10 px-4">
              Nền tảng phục vụ Ngày hội việc làm Bách khoa 2026, hỗ trợ check-in bằng mã QR, ghi nhận hành trình tham gia của sinh viên và vận hành hộ chiếu điện tử xuyên suốt sự kiện tại Trường Đại học Bách khoa - Đại học Đà Nẵng.
            </p>

            {/* Main Action Button */}
            <Button 
              size="lg"
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto min-w-[280px] h-[64px] rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
            >
              Truy cập hệ thống
              <LogIn className="h-6 w-6" />
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center border border-slate-50">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-2xl font-black text-slate-900 mb-1">3,000+</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider text-center">Sinh viên tham dự</span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center border border-slate-50">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-3">
                <Globe className="h-5 w-5 text-teal-500" />
              </div>
              <span className="text-2xl font-black text-slate-900 mb-1">60+</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider text-center">Doanh nghiệp</span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center border border-slate-50">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                <Star className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-2xl font-black text-slate-900 mb-1">7,200+</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider text-center">Vị trí tuyển dụng</span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center border border-slate-50">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3">
                <QrCode className="h-5 w-5 text-red-500" />
              </div>
              <span className="text-2xl font-black text-slate-900 mb-1 leading-tight">Đang cập nhật</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider text-center">Lượt quét QR</span>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Quy trình tham gia</h2>
          <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full mb-16" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Module 1 */}
            <div className="flex flex-col items-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <QrCode className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Quét QR Check-in</h3>
              <p className="text-blue-600 text-[11px] font-bold uppercase tracking-widest mb-3">Ghi nhận người tham gia</p>
              <p className="text-slate-500 text-sm leading-relaxed px-4">
                Hỗ trợ quét mã QR để xác nhận sinh viên tham gia sự kiện nhanh chóng, đồng bộ dữ liệu theo thời gian thực và hạn chế trùng lặp check-in.
              </p>
            </div>

            {/* Module 2 */}
            <div className="flex flex-col items-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-[#00697d] rounded-2xl flex items-center justify-center shadow-lg shadow-teal-100">
                  <Users className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Hộ chiếu điện tử</h3>
              <p className="text-teal-600 text-[11px] font-bold uppercase tracking-widest mb-3">Theo dõi hành trình tham gia</p>
              <p className="text-slate-500 text-sm leading-relaxed px-4">
                Ghi nhận các điểm đến, lượt tương tác và các mốc hoàn thành trong ngày hội để sinh viên sử dụng hộ chiếu điện tử xuyên suốt chương trình.
              </p>
            </div>

            {/* Module 3 */}
            <div className="flex flex-col items-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-[#B91C1C] rounded-2xl flex items-center justify-center shadow-lg shadow-red-100">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Điều hành sự kiện</h3>
              <p className="text-red-600 text-[11px] font-bold uppercase tracking-widest mb-3">Dành cho ban tổ chức</p>
              <p className="text-slate-500 text-sm leading-relaxed px-4">
                Theo dõi lượt check-in, dữ liệu quét QR, tiến độ các mốc hoạt động và hỗ trợ vận hành tập trung cho toàn bộ ngày hội việc làm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[#F8FAFC]">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-4">
            <h4 className="text-blue-700 font-bold tracking-tight mb-2 uppercase">DUT JOB FAIR 2026</h4>
            <p className="text-[10px] font-bold text-slate-500 max-w-md mx-auto leading-relaxed">
              Hệ thống check-in và hộ chiếu điện tử phục vụ Ngày hội việc làm Bách khoa 2026 tại <br /> Trường Đại học Bách khoa, Đại học Đà Nẵng.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-8 mt-8">
            <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Privacy Policy</button>
            <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Terms of Service</button>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-12">
            <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Contact Support</button>
            <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Event Map</button>
          </div>

          <div className="flex justify-center gap-6">
            <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
              <Globe className="h-5 w-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
              <Mail className="h-5 w-5" />
            </button>
          </div>
        </div>
      </footer>

    </main>
  )
}
