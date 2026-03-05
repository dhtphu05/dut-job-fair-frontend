'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/DashboardLayout'
import { VisitorsList } from '@/components/business-admin/VisitorsList'
import { BoothTrendsChart } from '@/components/business-admin/BoothTrendsChart'
import { AreaTrendsChart } from '@/components/analytics/AreaTrendsChart'
import { ComparisonBarChart } from '@/components/analytics/ComparisonBarChart'
import { HeatmapGrid } from '@/components/analytics/HeatmapGrid'
import { Users, Eye, TrendingUp, Calendar, RefreshCw, Download, BarChart3, LineChart, QrCode } from 'lucide-react'
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

  // Booth stats (real data for overview metrics & chart)
  const { data: boothStatsData } = useBusinessAdminControllerGetBoothStats(
    boothId || '',
    { query: { enabled: !!boothId } }
  )
  const boothStats = (boothStatsData as any)?.data

  // Visitors list (always enabled so count is available on overview tab too)
  const { data: checkinsData, isLoading, refetch } = useBusinessAdminControllerGetVisitors(
    { boothId: boothId || '', pageSize: '100' },
    { query: { enabled: !!boothId } }
  )

  // TransformInterceptor wraps response: { data: { items, total, ... }, status: 200 }
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

  // Hourly distribution for charts
  const hourlyData = boothStats?.hourlyDistribution?.map((h: any) => ({
    time: `${h.hour}:00`,
    count: h.count,
  })) ?? mockPeakHours.map((h) => ({ time: `${h.hour}:00`, count: h.count }))

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Lượt check-in',
                  value: boothStats?.stats?.totalVisitors ?? visitorsTotal,
                  icon: Eye,
                },
                {
                  label: 'Khách duy nhất',
                  value: boothStats?.stats?.uniqueVisitors ?? '—',
                  icon: Users,
                },
                {
                  label: 'Tỷ lệ quay lại',
                  value: boothStats?.stats?.totalVisitors && boothStats?.stats?.uniqueVisitors
                    ? (((boothStats.stats.totalVisitors / boothStats.stats.uniqueVisitors - 1) * 100).toFixed(0) + '%')
                    : '—',
                  icon: TrendingUp,
                },
                {
                  label: 'Giờ cao điểm',
                  value: hourlyData.length > 0
                    ? `${hourlyData.reduce((a: any, b: any) => (a.count > b.count ? a : b), { count: 0 }).time || '—'}`
                    : '—',
                  icon: Calendar,
                },
              ].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-lg border border-border/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                      <p className="text-3xl font-bold text-foreground">{item.value}</p>
                    </div>
                    <item.icon className="h-5 w-5 text-amber-600 opacity-50" />
                  </div>
                </div>
              ))}
            </div>

            {/* Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
                <BoothTrendsChart data={hourlyData} title="Phân bố khách theo giờ" />
              </div>
              <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
                <BoothTrendsChart
                  data={
                    boothStats?.dailyDistribution?.length
                      ? boothStats.dailyDistribution.map((d: any) => ({
                          time: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                          count: d.count,
                        }))
                      : [{ time: '04/03', count: 0 }, { time: '05/03', count: 0 }]
                  }
                  title="Lượt khách theo ngày sự kiện"
                />
              </div>
            </div>
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
              <AreaTrendsChart
                data={hourlyData.map((h: any) => ({ name: h.time, count: h.count }))}
                title="Phân bố hiệu suất theo giờ"
                dataKey="count"
                fill="#F59E0B"
              />
            </div>

            {/* Major distribution from real visitor data */}
            <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
              <HeatmapGrid
                data={
                  boothStats?.majorDistribution?.length
                    ? boothStats.majorDistribution.map((m: any) => ({ name: m.major, value: m.count }))
                    : [{ name: 'Chưa có dữ liệu', value: 0 }]
                }
                title="Phân bố khách theo ngành học"
              />
            </div>

            {/* Day 1 vs Day 2 comparison */}
            <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
              <ComparisonBarChart
                data={
                  boothStats?.dailyDistribution?.length
                    ? boothStats.dailyDistribution.map((d: any) => ({
                        name: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                        'Lượt quét': d.count,
                        'Khách unique': d.uniqueStudents,
                      }))
                    : [
                        { name: '04/03', 'Lượt quét': 0, 'Khách unique': 0 },
                        { name: '05/03', 'Lượt quét': 0, 'Khách unique': 0 },
                      ]
                }
                title="So sánh hai ngày sự kiện"
                dataKeys={[
                  { key: 'Lượt quét',   color: '#F59E0B', name: 'Lượt quét'   },
                  { key: 'Khách unique', color: '#3B82F6', name: 'Khách unique' },
                ]}
              />
            </div>
          </div>
        )

      case 'visitors':
        return (
          <div className="space-y-2">
            {visitorsTotal > 0 && (
              <p className="text-sm text-muted-foreground px-1">
                Tổng cộng <span className="font-semibold text-foreground">{visitorsTotal}</span> lượt check-in
              </p>
            )}
            <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
              <VisitorsList visitors={visitors} isLoading={isLoading} />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout
      title="Quản lý gian hàng"
      subtitle={boothStats?.booth?.name || 'Gian hàng của bạn'}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={
        <div className="flex gap-2">
          {/* Scan QR button – always visible */}
          <Button
            size="sm"
            onClick={() => router.push('/scanner')}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">Quét QR</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Cập nhật</span>
          </Button>

          {activeTab === 'visitors' && (
            <Button
              size="sm"
              onClick={handleExport}
              disabled={visitors.length === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Xuất CSV</span>
            </Button>
          )}
          <UserProfileHeader />
        </div>
      }
    >
      {renderContent()}
    </DashboardLayout>
  )
}
