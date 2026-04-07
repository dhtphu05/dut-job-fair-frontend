'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/DashboardLayout'
import { BoothsTable } from '@/components/school-admin/BoothsTable'
import { PrizesSection } from '@/components/school-admin/PrizesSection'
import { ScanChart } from '@/components/school-admin/ScanChart'
import { BoothScanStats } from '@/components/school-admin/BoothScanStats'
import { DistributionChart } from '@/components/analytics/DistributionChart'
import { AreaTrendsChart } from '@/components/analytics/AreaTrendsChart'
import { ComparisonBarChart } from '@/components/analytics/ComparisonBarChart'
import { HeatmapGrid } from '@/components/analytics/HeatmapGrid'
import { SummaryMetric } from '@/components/SummaryMetric'
import {
  Users,
  Building2,
  Activity,
  TrendingUp,
  Download,
  RefreshCw,
  Loader2,
  BarChart3,
  Award,
  LineChart,
  SearchIcon,
  Gift,
  Settings2,
  ScanQrCode,
} from 'lucide-react'
import { Booth } from '@/lib/types'
import { StudentCheckinList } from '@/components/school-admin/StudentCheckinList'
import { StudentBusinessLookup } from '@/components/school-admin/StudentBusinessLookup'
import { RewardMilestonesPanel } from '@/components/school-admin/RewardMilestonesPanel'
import { RewardMilestoneStudentsPanel } from '@/components/school-admin/RewardMilestoneStudentsPanel'
import { RewardsRedeemPanel } from '@/components/school-admin/RewardsRedeemPanel'
import { UserProfileHeader } from '@/components/UserProfileHeader'
import { customAxiosInstance } from '@/lib/axios-instance'
import { exportSchoolAdminExcel } from '@/lib/export-excel'

async function fetchDashboard() {
  const res = await customAxiosInstance<any>('/api/school-admin/dashboard', { method: 'GET' })
  return (res as any).data
}

async function fetchStats() {
  const res = await customAxiosInstance<any>('/api/school-admin/stats', { method: 'GET' })
  return (res as any).data
}

async function fetchBoothsRaw() {
  const res = await customAxiosInstance<any>('/api/school-admin/booths', { method: 'GET' })
  return (res as any).data as Array<{
    id: string; name: string; location: string | null; capacity: number
    business?: { id: string; name: string }
  }>
}

export default function SchoolAdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [isExporting, setIsExporting] = useState(false)

  const { data: dashboardData, isFetching, refetch } = useQuery({
    queryKey: ['school-admin', 'dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 30_000,
  })

  const { data: statsData } = useQuery({
    queryKey: ['school-admin', 'stats'],
    queryFn: fetchStats,
    refetchInterval: 60_000,
  })

  const { data: boothsRaw = [] } = useQuery({
    queryKey: ['school-admin', 'booths-raw'],
    queryFn: fetchBoothsRaw,
    staleTime: 5 * 60_000,
  })

  // ── derived values ─────────────────────────────────────────────────────────
  const apiStats = dashboardData?.stats ?? {}
  const totalVisitors   = apiStats.uniqueVisitors   ?? 0
  const totalBooths     = apiStats.totalBooths      ?? 0
  const totalScans      = apiStats.totalCheckins     ?? 0
  const avgScans        = totalBooths ? (totalScans / totalBooths) : 0

  // Hourly distribution for charts
  const hourlyDist: Array<{ hour: number; count: number }> = statsData?.hourlyDistribution ?? []
  const peakHoursData = hourlyDist.map((h) => ({ hour: h.hour, count: h.count }))

  // Major distribution
  const majorDist: Array<{ major: string; count: number }> = statsData?.majorDistribution ?? []

  // Department distribution
  const deptDist: Array<{ department: string; count: number }> = statsData?.departmentDistribution ?? []

  // Year distribution
  const yearDist: Array<{ year: number; count: number }> = statsData?.yearDistribution ?? []

  // Daily distribution (compare Day 1 vs Day 2)
  const dailyDist: Array<{ date: string; count: number; uniqueStudents: number }> =
    statsData?.dailyDistribution ?? []

  const dailyComparison = dailyDist.map((d) => ({
    name: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    'Lượt quét': d.count,
    'Sinh viên unique': d.uniqueStudents,
  }))

  // Real booths mapped to the Booth type
  const realBooths: Booth[] = boothsRaw.map((b) => {
    return {
      id: b.id,
      name: b.name,
      company: b.business?.name ?? b.name,
      position: b.location ?? '',
      visitorCount: 0,
      staffName: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })

  const handleRefresh = () => { refetch() }

  const handleExport = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const [checkinsRes, boothStatsRes] = await Promise.all([
        customAxiosInstance<any>('/api/school-admin/checkins?page=1&pageSize=9999', { method: 'GET' }),
        customAxiosInstance<any>('/api/school-admin/booth-stats', { method: 'GET' }),
      ])
      const allCheckins = (checkinsRes as any).data?.items ?? []
      const allBoothStats = (boothStatsRes as any).data ?? []

      exportSchoolAdminExcel({
        stats: {
          totalVisitors: totalVisitors,
          totalBooths: totalBooths,
          totalScans: totalScans,
        },
        hourlyDist,
        majorDist,
        deptDist,
        yearDist,
        dailyDist,
        boothStats: allBoothStats,
        checkins: allCheckins,
      })
    } catch (err) {
      console.error('Export failed:', err)
      alert('Xuất file thất bại. Vui lòng thử lại.')
    } finally {
      setIsExporting(false)
    }
  }

  const navItems = [
    { id: 'overview',    label: 'Tổng quan',          icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'booth-stats', label: 'Thống kê gian hàng', icon: <TrendingUp className="h-5 w-5" /> },
    { id: 'analytics',   label: 'Phân tích',           icon: <LineChart className="h-5 w-5" /> },
    { id: 'checkins',    label: 'Check-in SV',         icon: <Users className="h-5 w-5" /> },
    { id: 'lookup',      label: 'Tra cứu SV',          icon: <SearchIcon className="h-5 w-5" /> },
    { id: 'reward-settings', label: 'Mốc quà',         icon: <Settings2 className="h-5 w-5" /> },
    { id: 'reward-students', label: 'SV theo mốc quà', icon: <Gift className="h-5 w-5" /> },
    { id: 'rewards',     label: 'Đổi quà',             icon: <Gift className="h-5 w-5" /> },
    { id: 'booths',      label: 'Gian hàng',           icon: <Building2 className="h-5 w-5" /> },
    { id: 'prizes',      label: 'Giải thưởng',         icon: <Award className="h-5 w-5" /> },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Main QR Card */}
            <div className="relative overflow-hidden bg-blue-600 rounded-[32px] p-8 shadow-2xl shadow-blue-500/30 text-center space-y-6 group">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
              
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
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Hệ thống sẵn sàng</span>
                </div>
              </div>
              
              <p className="text-blue-100 text-[11px] font-bold uppercase tracking-widest relative z-10 opacity-80 mt-4">
                Nhấn để bắt đầu ghi nhận lượt tham gia
              </p>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Thống kê sự kiện</h3>
                <p className="text-sm text-slate-400 italic">Cập nhật dữ liệu thời gian thực</p>
              </div>
              <Button
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 rounded-xl px-4 font-bold"
              >
                <Download className="h-4 w-4" />
                <span>Xuất Excel</span>
              </Button>
            </div>
            
            {/* Key Metrics */}
            <div className="flex flex-col gap-4">
              <SummaryMetric
                label="Sinh viên tham quan"
                value={totalVisitors}
                icon={Users}
                isLoading={isFetching}
                description="Tổng số SV duy nhất"
              />
              <SummaryMetric
                label="Gian hàng"
                value={totalBooths}
                icon={Building2}
                isLoading={isFetching}
                description="Tổng số gian hàng"
              />
              <SummaryMetric
                label="Tổng lượt quét"
                value={totalScans}
                icon={ScanQrCode}
                isLoading={isFetching}
                description="Toàn sự kiện"
              />
              <SummaryMetric
                label="Quét / Gian hàng"
                value={avgScans.toFixed(0)}
                icon={TrendingUp}
                isLoading={isFetching}
                description="Hiệu suất trung bình"
              />
            </div>

            {/* Hourly chart */}
            <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm shadow-slate-200/50">
              <ScanChart data={peakHoursData} title="Phân bố lượt quét theo giờ" />
            </div>
          </div>
        )

      case 'booth-stats':
        return <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6"><BoothScanStats /></div>
      case 'analytics':
        return <div className="space-y-6"><AnalyticsContent peakHoursData={peakHoursData} majorDist={majorDist} deptDist={deptDist} yearDist={yearDist} dailyComparison={dailyComparison} /></div>
      case 'checkins':
        return <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6"><StudentCheckinList /></div>
      case 'lookup':
        return <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6"><StudentBusinessLookup /></div>
      case 'reward-settings':
        return <RewardMilestonesPanel />
      case 'reward-students':
        return <RewardMilestoneStudentsPanel />
      case 'rewards':
        return <RewardsRedeemPanel />
      case 'booths':
        return <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6"><BoothsTable booths={realBooths} isLoading={isFetching} /></div>
      case 'prizes':
        return <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6"><PrizesSection /></div>
      default:
        return null
    }
  }

  return (
    <DashboardLayout
      title="Quản lý sự kiện"
      subtitle="DUT JOB FAIR 2026"
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isFetching}
            className="h-9 w-9 rounded-full hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 text-slate-400 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <UserProfileHeader />
        </div>
      }
    >
      {renderContent()}
    </DashboardLayout>
  )
}

function AnalyticsContent({ peakHoursData, majorDist, deptDist, yearDist, dailyComparison }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
        <AreaTrendsChart data={peakHoursData.map((h: any) => ({ name: `${h.hour}:00`, value: h.count }))} title="Phân bố sinh viên theo giờ" dataKey="value" fill="#3B82F6" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <DistributionChart data={majorDist.slice(0, 10).map((m: any) => ({ name: m.major, value: m.count }))} title="Top 10 Ngành học" />
        </div>
        <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <HeatmapGrid data={deptDist.map((d: any) => ({ name: d.department, value: d.count }))} title="Sinh viên theo khoa" />
        </div>
      </div>
    </div>
  )
}
