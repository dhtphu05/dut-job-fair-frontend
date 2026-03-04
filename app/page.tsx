'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { QrCode, BarChart3, Users, Sparkles, TrendingUp, Zap } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  const modules = [
    {
      icon: QrCode,
      title: 'Quét QR Code',
      description: 'Quét mã đi kèm với khách',
      details: 'Theo dõi khách thăm theo thời gian thực với công nghệ quét QR nhanh chóng',
      color: 'from-blue-500 to-blue-600',
      iconColor: 'text-blue-600',
      path: '/scanner',
    },
    {
      icon: BarChart3,
      title: 'Quản lý sự kiện',
      description: 'Tổng quan toàn bộ sự kiện',
      details: 'Theo dõi tất cả gian hàng, quản lý giải thưởng và xem thống kê chi tiết',
      color: 'from-teal-500 to-teal-600',
      iconColor: 'text-teal-600',
      path: '/school-admin',
    },
    {
      icon: Users,
      title: 'Quản lý gian hàng',
      description: 'Thống kê gian hàng của bạn',
      details: 'Theo dõi khách thăm gian hàng và xuất dữ liệu để phân tích',
      color: 'from-amber-500 to-amber-600',
      iconColor: 'text-amber-600',
      path: '/business-admin',
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-border/50 bg-white">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-2">DUT Job Fair 2025</h1>
          <p className="text-base text-muted-foreground">Quản lý và theo dõi các gian hàng công ty tuyển dụng</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Module Cards Grid */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {modules.map((module) => {
            const IconComponent = module.icon
            return (
              <button
                key={module.path}
                onClick={() => router.push(module.path)}
                className="text-left p-6 rounded-xl border border-border/50 bg-white hover:shadow-md hover:border-border/80 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-lg ${module.color} bg-opacity-10 flex items-center justify-center mb-4`}>
                  <IconComponent className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{module.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                <div className="inline-flex items-center text-blue-600 text-sm font-medium">
                  Truy cập
                  <span className="ml-2">→</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Tổng khách thăm', value: '655', color: 'bg-blue-50' },
            { label: 'Gian hàng', value: '6', color: 'bg-teal-50' },
            { label: 'Lượt quét', value: '1,244', color: 'bg-amber-50' },
            { label: 'Hôm nay', value: '234', color: 'bg-violet-50' },
          ].map((stat, i) => (
            <div key={i} className={`p-4 rounded-lg ${stat.color}`}>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg border border-border/50 p-8">
          <h2 className="text-xl font-bold text-foreground mb-6">Tính năng chính</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Quét QR Code', desc: 'Theo dõi khách thăm theo thời gian thực' },
              { title: 'Thống kê chi tiết', desc: 'Xem dữ liệu khách hàng theo gian hàng' },
              { title: 'Quản lý sự kiện', desc: 'Quản lý giải thưởng và điểm tham gia' },
            ].map((item, i) => (
              <div key={i}>
                <h4 className="font-semibold text-foreground mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
