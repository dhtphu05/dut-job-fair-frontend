'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/components/DashboardLayout'
import { VisitorsList } from '@/components/business-admin/VisitorsList'
import { BoothTrendsChart } from '@/components/business-admin/BoothTrendsChart'
import { AreaTrendsChart } from '@/components/analytics/AreaTrendsChart'
import { ComparisonBarChart } from '@/components/analytics/ComparisonBarChart'
import { HeatmapGrid } from '@/components/analytics/HeatmapGrid'
import { Users, Eye, TrendingUp, Calendar, RefreshCw, Download, BarChart3, LineChart } from 'lucide-react'
import { Visitor, BoothStats } from '@/lib/types'
import { BUSINESS_ADMIN_ENDPOINTS } from '@/lib/constants'
import { apiClient } from '@/lib/api-client'
import { mockBooths, mockPeakHours, mockVisitors } from '@/lib/mock-data'

// Mock data for demonstration
const MOCK_BOOTH_STATS: BoothStats = {
  boothId: mockBooths[0].id,
  boothName: mockBooths[0].name,
  visitorCount: mockBooths[0].visitorCount,
  scanCount: Math.floor(mockBooths[0].visitorCount * 1.2),
  uniqueVisitors: mockBooths[0].visitorCount,
  topHours: mockPeakHours,
}

const MOCK_VISITORS: Visitor[] = mockVisitors.map((visitor) => ({
  id: visitor.id,
  studentCode: `DUT${String(parseInt(visitor.id) + 1000).slice(-3)}`,
  fullName: visitor.name,
  email: `${visitor.name.toLowerCase().replace(/\s/g, '')}@dut.edu.vn`,
  phone: `09${Math.random().toString().slice(2, 11)}`,
  major: visitor.major,
  year: visitor.year,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))

const MOCK_TRENDS = [
  { time: 'Mon', count: 12 },
  { time: 'Tue', count: 19 },
  { time: 'Wed', count: 15 },
  { time: 'Thu', count: 25 },
  { time: 'Fri', count: 22 },
  { time: 'Sat', count: 29 },
  { time: 'Sun', count: 18 },
]

export default function BusinessAdminDashboard() {
  const [boothStats, setBoothStats] = useState<BoothStats>(MOCK_BOOTH_STATS)
  const [visitors, setVisitors] = useState<Visitor[]>(MOCK_VISITORS)
  const [trends, setTrends] = useState(MOCK_TRENDS)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // No authentication required for demo

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      // In production, call your backend API
      // const response = await apiClient.get(BUSINESS_ADMIN_ENDPOINTS.DASHBOARD)
      // setBoothStats(response.boothStats)
      // setVisitors(response.visitors)

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
      // const response = await apiClient.post(BUSINESS_ADMIN_ENDPOINTS.EXPORT_VISITORS, {})
      // Download file from response.url

      alert('Export feature will be implemented with backend integration')
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'analytics', label: 'Thống kê', icon: <LineChart className="h-5 w-5" /> },
    { id: 'visitors', label: 'Danh sách khách', icon: <Users className="h-5 w-5" /> },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Khách duy nhất', value: boothStats.uniqueVisitors, icon: Users },
                { label: 'Lượt quét', value: boothStats.scanCount, icon: Eye },
                { label: 'Tỷ lệ quay lại', value: ((boothStats.scanCount / boothStats.uniqueVisitors - 1) * 100).toFixed(0) + '%', icon: TrendingUp },
                { label: 'Giờ cao điểm', value: '14:00', icon: Calendar },
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
                <BoothTrendsChart data={boothStats.topHours} title="Phân bố khách theo giờ" />
              </div>
              <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
                <BoothTrendsChart data={trends} title="Xu hướng khách hàng hàng tuần" />
              </div>
            </div>
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Hourly Performance */}
            <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
              <AreaTrendsChart
                data={boothStats.topHours.map((item) => ({ name: `${item.hour}:00`, count: item.count }))}
                title="Phân bố hiệu suất theo giờ"
                dataKey="count"
                fill="#F59E0B"
              />
            </div>

            {/* Visitor Demographics */}
            <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
              <HeatmapGrid
                data={[
                  { name: 'Công nghệ thông tin', value: 18 },
                  { name: 'Quản lý kinh doanh', value: 12 },
                  { name: 'Kỹ thuật', value: 15 },
                  { name: 'Nhân sự', value: 8 },
                  { name: 'Tài chính', value: 5 },
                ]}
                title="Phân bố khách theo ngành"
              />
            </div>

            {/* Comparison */}
            <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
              <ComparisonBarChart
                data={[
                  { name: 'Hôm nay', morning: 4, afternoon: 28, evening: 8 },
                  { name: 'Hôm qua', morning: 6, afternoon: 25, evening: 12 },
                  { name: 'TB tuần', morning: 5, afternoon: 26, evening: 10 },
                ]}
                title="So sánh theo thời gian"
                dataKeys={[
                  { key: 'morning', color: '#3B82F6', name: 'Sáng' },
                  { key: 'afternoon', color: '#F59E0B', name: 'Chiều' },
                  { key: 'evening', color: '#8B5CF6', name: 'Tối' },
                ]}
              />
            </div>
          </div>
        )

      case 'visitors':
        return (
          <div className="bg-white rounded-lg border border-border/50 p-4 sm:p-6">
            <VisitorsList visitors={visitors} isLoading={isLoading} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout
      title="Quản lý gian hàng"
      subtitle={boothStats.boothName}
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
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Xuất khách</span>
          </Button>
        </div>
      }
    >
      {renderContent()}
    </DashboardLayout>
  )
}
