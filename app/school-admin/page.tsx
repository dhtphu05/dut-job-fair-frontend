'use client'

import { useState } from 'react'
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
import {
  Users,
  Building2,
  Activity,
  TrendingUp,
  Download,
  RefreshCw,
  BarChart3,
  Award,
  LineChart,
  SearchIcon,
} from 'lucide-react'
import { Booth } from '@/lib/types'
import { StudentCheckinList } from '@/components/school-admin/StudentCheckinList'
import { StudentBusinessLookup } from '@/components/school-admin/StudentBusinessLookup'
import { UserProfileHeader } from '@/components/UserProfileHeader'
import { customAxiosInstance } from '@/lib/axios-instance'

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
  const [activeTab, setActiveTab] = useState('overview')

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

  const handleExport = () => {
    alert('Export feature will be implemented with backend integration')
  }

  const navItems = [
    { id: 'overview',    label: 'Tổng quan',          icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'booth-stats', label: 'Thống kê gian hàng', icon: <TrendingUp className="h-5 w-5" /> },
    { id: 'analytics',   label: 'Phân tích',           icon: <LineChart className="h-5 w-5" /> },
    { id: 'checkins',    label: 'Check-in SV',         icon: <Users className="h-5 w-5" /> },
    { id: 'lookup',      label: 'Tra cứu SV',          icon: <SearchIcon className="h-5 w-5" /> },
    { id: 'booths',      label: 'Gian hàng',           icon: <Building2 className="h-5 w-5" /> },
    { id: 'prizes',      label: 'Giải thưởng',         icon: <Award className="h-5 w-5" /> },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Sinh viên thăm quan', value: totalVisitors,         icon: Users      },
                { label: 'Gian hàng',            value: totalBooths,           icon: Building2  },
                { label: 'Tổng lượt quét',       value: totalScans,            icon: Activity   },
                { label: 'Quét/gian hàng',       value: avgScans.toFixed(0),   icon: TrendingUp },
              ].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-lg border border-border/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                      <p className="text-3xl font-bold text-foreground">{item.value}</p>
                    </div>
                    <item.icon className="h-5 w-5 text-blue-600 opacity-50" />
                  </div>
                </div>
              ))}
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
    <DashboardLayout
      title="Quản lý sự kiện"
      subtitle="DUT Job Fair 2026"
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Cập nhật</span>
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Xuất dữ liệu</span>
          </Button>
          <UserProfileHeader />
        </div>
      }
    >
      {renderContent()}
    </DashboardLayout>
  )
}
