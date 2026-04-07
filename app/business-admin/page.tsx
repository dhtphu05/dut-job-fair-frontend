'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/DashboardLayout'
import { VisitorsList } from '@/components/business-admin/VisitorsList'
import { BoothTrendsChart } from '@/components/business-admin/BoothTrendsChart'
import { SummaryMetric } from '@/components/SummaryMetric'
import { Users, Eye, TrendingUp, Calendar, RefreshCw, Download, BarChart3, LineChart, ScanQrCode } from 'lucide-react'
import { Visitor } from '@/lib/types'
import { mockPeakHours } from '@/lib/mock-data'
import { UserProfileHeader } from '@/components/UserProfileHeader'
import {
  useBusinessAdminControllerGetVisitors,
  useBusinessAdminControllerGetBoothStats,
  getBusinessAdminControllerGetVisitorsQueryKey,
} from '@/lib/api/generated/business-admin/business-admin'
import { useQueryClient } from '@tanstack/react-query'

export default function BusinessAdminDashboard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [boothId, setBoothId] = useState<string | null>(null)

  useEffect(() => {
    setBoothId(localStorage.getItem('booth_id'))
  }, [])

  const { data: boothStatsData } = useBusinessAdminControllerGetBoothStats(
    boothId || '',
    { query: { enabled: !!boothId } }
  )
  const boothStats = (boothStatsData as any)?.data

  const { data: checkinsData, isLoading, refetch } = useBusinessAdminControllerGetVisitors(
    { boothId: boothId || '', pageSize: '100' },
    { query: { enabled: !!boothId } }
  )

  const visitors: Visitor[] = (checkinsData as any)?.data?.items?.map((item: any) => ({
    id: item.student?.id || item.checkinId,
    studentCode: item.student?.studentCode || '',
    fullName: item.student?.fullName || '',
    email: item.student?.email || '',
    phone: item.student?.phone || '',
    major: item.student?.major || '',
    year: item.student?.year || 0,
    createdAt: item.checkInTime,
    updatedAt: item.checkInTime,
  })) || []

  const visitorsTotal = (checkinsData as any)?.data?.total ?? visitors.length

  const handleRefresh = async () => {
    await refetch()
    if (boothId) {
      queryClient.invalidateQueries({
        queryKey: getBusinessAdminControllerGetVisitorsQueryKey({ boothId }),
      })
    }
  }

  const handleExport = () => {
    if (visitors.length === 0) return
    const csv = [
      ['Mã SV', 'Tên đầy đủ', 'Email', 'Điện thoại', 'Lớp', 'Thời gian check-in'].join(','),
      ...visitors.map((v) => [v.studentCode, v.fullName, v.email, v.phone, v.major, v.createdAt].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `checkins-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'analytics', label: 'Thống kê', icon: <LineChart className="h-5 w-5" /> },
    { id: 'visitors', label: 'Danh sách khách', icon: <Users className="h-5 w-5" /> },
  ]

  const hourlyData = boothStats?.hourlyDistribution?.map((h: any) => ({
    time: `${h.hour}:00`,
    count: h.count,
  })) ?? mockPeakHours.map((h) => ({ time: `${h.hour}:00`, count: h.count }))

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Main QR Card */}
            <div className="relative overflow-hidden bg-blue-600 rounded-[32px] p-8 shadow-2xl shadow-blue-500/30 text-center space-y-6 group">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              
              <div 
                onClick={() => router.push('/scanner')}
                className="relative mx-auto w-[120px] h-[120px] bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              >
                <ScanQrCode className="h-16 w-16 text-white" />
              </div>
              
              <div className="space-y-2 relative z-10">
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Quét mã QR</h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/20">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Gian hàng sẵn sàng</span>
                </div>
              </div>
              
              <p className="text-blue-100 text-[11px] font-bold uppercase tracking-widest relative z-10 opacity-80 mt-4">
                Nhấn để bắt đầu quét khách tham quan
              </p>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Thống kê gian hàng</h3>
              </div>
              <Button
                size="sm"
                onClick={handleExport}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 rounded-xl px-4 font-bold"
              >
                <Download className="h-4 w-4" />
                <span>Xuất CSV</span>
              </Button>
            </div>

            {/* Key Metrics */}
            <div className="flex flex-col gap-4">
              <SummaryMetric
                label="Lượt check-in"
                value={boothStats?.stats?.totalVisitors ?? visitorsTotal}
                icon={Eye}
                isLoading={isLoading}
                description="Tổng lượt quét tại quầy"
              />
              <SummaryMetric
                label="Khách duy nhất"
                value={boothStats?.stats?.uniqueVisitors ?? '—'}
                icon={Users}
                isLoading={isLoading}
                description="Số sinh viên khác nhau"
              />
              <SummaryMetric
                label="Giờ cao điểm"
                value={hourlyData.reduce((a: any, b: any) => (a.count > b.count ? a : b), { count: 0 }).time || '—'}
                icon={Calendar}
                isLoading={isLoading}
                description="Thời điểm bận rộn nhất"
              />
            </div>

            {/* Trends */}
            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <BoothTrendsChart data={hourlyData} title="Phân bố khách theo giờ" />
            </div>
          </div>
        )

      case 'analytics':
        return <div className="space-y-6"><div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">Trang phân tích đang phát triển</div></div>
      case 'visitors':
        return <div className="space-y-4"><div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6"><VisitorsList visitors={visitors} isLoading={isLoading} /></div></div>
      default:
        return null
    }
  }

  return (
    <DashboardLayout
      title="Quản lý gian hàng"
      subtitle={boothStats?.booth?.name || 'DUT JOB FAIR 2026'}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-9 w-9 rounded-full hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <UserProfileHeader />
        </div>
      }
    >
      {renderContent()}
    </DashboardLayout>
  )
}
