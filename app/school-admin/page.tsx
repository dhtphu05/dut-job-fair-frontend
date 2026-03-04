'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/components/DashboardLayout'
import { StatsCard } from '@/components/school-admin/StatsCard'
import { BoothsTable } from '@/components/school-admin/BoothsTable'
import { PrizesSection } from '@/components/school-admin/PrizesSection'
import { ScanChart } from '@/components/school-admin/ScanChart'
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
  Grid3x3,
} from 'lucide-react'
import { Booth, Prize, DashboardStats } from '@/lib/types'
import { SCHOOL_ADMIN_ENDPOINTS } from '@/lib/constants'
import { apiClient } from '@/lib/api-client'
import { mockBooths, mockPeakHours, mockPrizes } from '@/lib/mock-data'
import { StudentCheckinList } from '@/components/school-admin/StudentCheckinList'

// Mock data for demonstration
const MOCK_STATS: DashboardStats = {
  totalVisitors: 655,
  totalBooths: 6,
  totalScans: 1244,
  averageScansPerBooth: 207.3,
  peakHours: mockPeakHours,
}

const MOCK_BOOTHS: Booth[] = mockBooths.map((booth) => ({
  id: booth.id,
  name: booth.name,
  company: booth.company,
  position: booth.position,
  visitorCount: booth.visitorCount,
  staffName: booth.representative,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))

const MOCK_PRIZES: Prize[] = mockPrizes.map((prize) => ({
  id: prize.id,
  name: prize.type === 'Early Bird' ? 'Bộ quà tặng sơ cấp' : 'Giải thưởng đặc biệt',
  type: prize.type === 'Early Bird' ? 'early_bird' : 'lucky_draw',
  description: prize.description,
  quantity: prize.count,
  qualificationRule: prize.description,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))

export default function SchoolAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS)
  const [booths, setBooths] = useState<Booth[]>(MOCK_BOOTHS)
  const [prizes, setPrizes] = useState<Prize[]>(MOCK_PRIZES)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // No authentication required for demo

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      // In production, call your backend API
      // const response = await apiClient.get(SCHOOL_ADMIN_ENDPOINTS.DASHBOARD)
      // setStats(response.stats)
      // setBooths(response.booths)
      // setPrizes(response.prizes)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log('Dashboard refreshed')
    } catch (error) {
      console.error('Failed to refresh dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      // In production, call your backend API
      // const response = await apiClient.get(SCHOOL_ADMIN_ENDPOINTS.EXPORT_DATA)
      // Download file from response.url

      alert('Export feature will be implemented with backend integration')
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'analytics', label: 'Thống kê', icon: <LineChart className="h-5 w-5" /> },
    { id: 'checkins', label: 'Check-in SV', icon: <Users className="h-5 w-5" /> },
    { id: 'booths', label: 'Gian hàng', icon: <Building2 className="h-5 w-5" /> },
    { id: 'prizes', label: 'Giải thưởng', icon: <Award className="h-5 w-5" /> },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Khách thăm tổng', value: stats.totalVisitors, icon: Users },
                { label: 'Gian hàng', value: stats.totalBooths, icon: Building2 },
                { label: 'Tổng lượt quét', value: stats.totalScans, icon: Activity },
                { label: 'Quét/gian hàng', value: stats.averageScansPerBooth.toFixed(0), icon: TrendingUp },
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

            {/* Main Chart */}
            <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
              <ScanChart data={stats.peakHours} />
            </div>
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Hourly Trend */}
            <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
              <AreaTrendsChart
                data={stats.peakHours.map((item) => ({ name: `${item.hour}:00`, value: item.count }))}
                title="Phân bố khách theo giờ"
                dataKey="value"
                fill="#3B82F6"
              />
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
                <DistributionChart
                  data={booths.map((booth) => ({ name: booth.name, value: booth.visitorCount }))}
                  title="Phân bố khách theo gian hàng"
                />
              </div>

              <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
                <HeatmapGrid
                  data={booths.map((booth) => ({ name: booth.name, value: booth.visitorCount }))}
                  title="Bản đồ hiệu suất gian hàng"
                />
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
              <ComparisonBarChart
                data={booths.slice(0, 6).map((booth) => ({
                  name: booth.name,
                  visitors: booth.visitorCount,
                  target: 45,
                }))}
                title="Hiệu suất gian hàng so với mục tiêu"
                dataKeys={[
                  { key: 'visitors', color: '#3B82F6', name: 'Thực tế' },
                  { key: 'target', color: '#D1D5DB', name: 'Mục tiêu' },
                ]}
              />
            </div>
          </div>
        )

      case 'checkins':
        return (
          <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
            <StudentCheckinList />
          </div>
        )

      case 'booths':
        return (
          <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
            <BoothsTable booths={booths} isLoading={isLoading} />
          </div>
        )

      case 'prizes':
        return (
          <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
            <PrizesSection prizes={prizes} isLoading={isLoading} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout
      title="Quản lý sự kiện"
      subtitle="DUT Job Fair 2025"
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={
        <div className="flex gap-2">
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
          <Button
            size="sm"
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Xuất dữ liệu</span>
          </Button>
        </div>
      }
    >
      {renderContent()}
    </DashboardLayout>
  )
}
