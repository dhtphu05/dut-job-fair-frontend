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
  QrCode,
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

  // Real booths mapped to the Booth type (BoothsTable wants visitorCount from booth-stats)
  // We use recentScans booth list from dashboard for visitor counts
  const boothStatsList: Array<{ id: string; name: string; business: string; totalScans: number }> =
    (dashboardData?.booths ?? [])
  const realBooths: Booth[] = boothsRaw.map((b) => {
    return {
      id: b.id,
      name: b.name,
      company: b.business?.name ?? b.name,
      position: b.location ?? '',
      visitorCount: 0, // filled by BoothScanStats component
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
      // Fetch all check-ins (up to 9999) and booth stats in parallel
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
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Thống kê sự kiện</h3>
                <p className="text-sm text-muted-foreground italic">Cập nhật dữ liệu thời gian thực</p>
              </div>
              <Button
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg shadow-blue-500/10"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span className="hidden sm:inline">{isExporting ? 'Đang xuất...' : 'Xuất báo cáo Excel'}</span>
                <span className="sm:hidden">Xuất Excel</span>
              </Button>
            </div>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                icon={Activity}
                isLoading={isFetching}
                description="Toàn sự kiện"
              />
              <SummaryMetric
                label="Quét/Gian hàng"
                value={avgScans.toFixed(0)}
                icon={TrendingUp}
                isLoading={isFetching}
                description="Hiệu suất trung bình"
              />
            </div>

            {/* Hourly chart */}
            <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
              <ScanChart data={peakHoursData} title="Phân bố lượt quét theo giờ" />
            </div>

            {/* Day-by-day */}
            {dailyComparison.length > 0 && (
              <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
                <ComparisonBarChart
                  data={dailyComparison}
                  title="Ngày 04/03 vs Ngày 05/03"
                  dataKeys={[
                    { key: 'Lượt quét',       color: '#3B82F6', name: 'Lượt quét'       },
                    { key: 'Sinh viên unique', color: '#10B981', name: 'Sinh viên unique' },
                  ]}
                />
              </div>
            )}
          </div>
        )

      case 'booth-stats':
        return (
          <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
            <BoothScanStats />
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Hourly Trend */}
            <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
              <AreaTrendsChart
                data={peakHoursData.map((h) => ({ name: `${h.hour}:00`, value: h.count }))}
                title="Phân bố sinh viên theo giờ trong ngày"
                dataKey="value"
                fill="#3B82F6"
              />
            </div>

            {/* Major + Dept distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
                <DistributionChart
                  data={majorDist.slice(0, 10).map((m) => ({ name: m.major, value: m.count }))}
                  title="Phân bố sinh viên theo ngành (Top 10)"
                />
              </div>
              <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
                <HeatmapGrid
                  data={deptDist.map((d) => ({ name: d.department, value: d.count }))}
                  title="Sinh viên theo khoa"
                />
              </div>
            </div>

            {/* Year distribution */}
            {yearDist.length > 0 && (
              <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
                <ComparisonBarChart
                  data={yearDist.map((y) => ({ name: `Năm ${y.year}`, 'Sinh viên': y.count }))}
                  title="Phân bố sinh viên theo năm học"
                  dataKeys={[{ key: 'Sinh viên', color: '#8B5CF6', name: 'Sinh viên' }]}
                />
              </div>
            )}

            {/* Day comparison */}
            {dailyComparison.length > 0 && (
              <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
                <ComparisonBarChart
                  data={dailyComparison}
                  title="So sánh hai ngày sự kiện"
                  dataKeys={[
                    { key: 'Lượt quét',       color: '#3B82F6', name: 'Lượt quét'       },
                    { key: 'Sinh viên unique', color: '#10B981', name: 'Sinh viên unique' },
                  ]}
                />
              </div>
            )}
          </div>
        )

      case 'checkins':
        return (
          <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
            <StudentCheckinList />
          </div>
        )

      case 'lookup':
        return (
          <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
            <StudentBusinessLookup />
          </div>
        )

      case 'reward-settings':
        return <RewardMilestonesPanel />

      case 'reward-students':
        return <RewardMilestoneStudentsPanel />

      case 'rewards':
        return <RewardsRedeemPanel />

      case 'booths':
        return (
          <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
            <BoothsTable booths={realBooths} isLoading={isFetching} />
          </div>
        )

      case 'prizes':
        return (
          <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
            <PrizesSection />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen">
      <DashboardLayout
        title="Quản lý sự kiện"
        subtitle="DUT Job Fair 2026"
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
              className="h-9 w-9 rounded-full hover:bg-slate-100"
            >
              <RefreshCw className={`h-4 w-4 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <UserProfileHeader />
          </div>
        }
      >
        {renderContent()}
      </DashboardLayout>

      {/* Adaptive Scan QR Button (FAB on mobile, widget-like on desktop) */}
      <div className="fixed bottom-6 right-6 z-50 md:static md:mb-6 md:px-0">
        <Button
          onClick={() => router.push('/scanner')}
          className="h-14 w-14 rounded-full shadow-2xl bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center border-4 border-white md:h-12 md:w-full md:rounded-xl md:border-0 md:shadow-lg md:shadow-orange-500/20 md:gap-3 md:font-bold md:text-base md:mt-2"
        >
          <QrCode className="h-7 w-7 md:h-5 md:w-5" />
          <span className="hidden md:inline uppercase tracking-wider">Mở trình quét QR đổi quà</span>
        </Button>
      </div>
    </div>
  )
}
