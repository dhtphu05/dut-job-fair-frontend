'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  TrendingUp,
  Download,
  RefreshCw,
  BarChart3,
  Award,
  LineChart,
  SearchIcon,
  Gift,
  Settings2,
  ScanQrCode,
} from 'lucide-react'
import type {
  Booth,
  SchoolTypeStats,
  UnitType,
  WorkshopAccountCreateInput,
  WorkshopManagementItem,
} from '@/lib/types'
import { StudentCheckinList } from '@/components/school-admin/StudentCheckinList'
import { StudentBusinessLookup } from '@/components/school-admin/StudentBusinessLookup'
import { RewardMilestonesPanel } from '@/components/school-admin/RewardMilestonesPanel'
import { RewardMilestoneStudentsPanel } from '@/components/school-admin/RewardMilestoneStudentsPanel'
import { RewardsRedeemPanel } from '@/components/school-admin/RewardsRedeemPanel'
import { WorkshopAccountDialog } from '@/components/school-admin/WorkshopAccountDialog'
import { WorkshopManagementTable } from '@/components/school-admin/WorkshopManagementTable'
import { UserProfileHeader } from '@/components/UserProfileHeader'
import { customAxiosInstance } from '@/lib/axios-instance'
import { exportSchoolAdminExcel } from '@/lib/export-excel'
import { cn, formatVNDateTime } from '@/lib/utils'
import { createSchoolAdminWorkshopAccount, getSchoolAdminWorkshops } from '@/lib/school-admin-workshops'
import { toast } from 'sonner'

type DashboardUnit = {
  id: string
  name: string
  displayName?: string
  business: string
  location: string | null
  capacity: number
  type?: UnitType
}

type RecentScan = {
  id: string
  checkInTime: string
  status?: string
  student: {
    id: string
    fullName: string
    studentCode: string
  }
  booth: {
    id: string
    name: string
    displayName?: string
    business: string
    type?: UnitType
  }
}

type DashboardResponse = {
  stats?: {
    totalStudents?: number
    totalCheckins?: number
    uniqueVisitors?: number
    totalBooths?: number
    totalWorkshops?: number
    byType?: Partial<Record<UnitType, SchoolTypeStats>>
  }
  booths?: DashboardUnit[]
  recentScans?: RecentScan[]
}

type StatsResponse = {
  hourlyDistribution?: Array<{ hour: number; count: number }>
  majorDistribution?: Array<{ major: string; count: number }>
  yearDistribution?: Array<{ year: number; count: number }>
  departmentDistribution?: Array<{ department: string; count: number }>
  dailyDistribution?: Array<{ date: string; count: number; uniqueStudents: number }>
  checkinTypeDistribution?: Array<{ type: UnitType; count: number; uniqueStudents: number }>
}

type BoothApiItem = {
  id: string
  name: string
  displayName?: string
  location: string | null
  capacity: number
  type?: UnitType
  business?: { id: string; name: string } | string | null
}

async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await customAxiosInstance<any>('/api/school-admin/dashboard', { method: 'GET' })
  return (res as any).data ?? {}
}

async function fetchStats(): Promise<StatsResponse> {
  const res = await customAxiosInstance<any>('/api/school-admin/stats', { method: 'GET' })
  return (res as any).data ?? {}
}

async function fetchBoothsRaw(): Promise<BoothApiItem[]> {
  const res = await customAxiosInstance<any>('/api/school-admin/booths', { method: 'GET' })
  return ((res as any).data ?? []) as BoothApiItem[]
}

function getUnitMeta(type: UnitType) {
  if (type === 'workshop') {
    return {
      title: 'Hội thảo',
      plural: 'Hội thảo',
      badgeClass: 'bg-orange-100 text-orange-700 border-transparent',
      accentClass: 'bg-orange-50 text-orange-700',
    }
  }

  return {
    title: 'Booth doanh nghiệp',
    plural: 'Booth doanh nghiệp',
    badgeClass: 'bg-blue-100 text-blue-700 border-transparent',
    accentClass: 'bg-blue-50 text-blue-700',
  }
}

function UnitToggle({
  activeUnitType,
  onChange,
}: {
  activeUnitType: UnitType
  onChange: (value: UnitType) => void
}) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
      {(['booth', 'workshop'] as UnitType[]).map((type) => {
        const isActive = activeUnitType === type
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-bold transition-colors',
              isActive ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            {type === 'booth' ? 'Booth doanh nghiệp' : 'Hội thảo'}
          </button>
        )
      })}
    </div>
  )
}

function RecentScansPanel({
  scans,
  unitType,
}: {
  scans: RecentScan[]
  unitType: UnitType
}) {
  const meta = getUnitMeta(unitType)

  return (
    <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Lượt quét gần đây</h3>
          <p className="text-sm text-slate-500">Chỉ hiển thị dữ liệu thuộc nhóm {meta.title.toLowerCase()}</p>
        </div>
        <Badge className={meta.badgeClass}>{meta.title}</Badge>
      </div>

      {scans.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">Chưa có lượt quét nào trong nhóm này</div>
      ) : (
        <div className="mt-5 space-y-3">
          {scans.slice(0, 6).map((scan) => (
            <div key={scan.id} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{scan.student.fullName}</p>
                  <span className="text-xs font-mono text-blue-600">{scan.student.studentCode}</span>
                </div>
                <p className="text-sm text-slate-600">{scan.booth.displayName || scan.booth.business || scan.booth.name}</p>
                <p className="text-xs text-slate-400">{scan.booth.name}</p>
              </div>
              <div className="text-right">
                <Badge className={meta.badgeClass}>{meta.title}</Badge>
                <p className="mt-2 text-xs font-mono text-slate-500">{formatVNDateTime(scan.checkInTime)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SchoolAdminDashboard() {
  const [activeTab, setActiveTab] = useState('event-overview')
  const [activeUnitType, setActiveUnitType] = useState<UnitType>('booth')
  const [isExporting, setIsExporting] = useState(false)
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [selectedWorkshop, setSelectedWorkshop] = useState<WorkshopManagementItem | null>(null)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  const { data: dashboardData, isFetching, refetch } = useQuery({
    queryKey: ['school-admin', 'dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 30_000,
  })

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['school-admin', 'stats'],
    queryFn: fetchStats,
    refetchInterval: 60_000,
  })

  const { data: boothsRaw = [], refetch: refetchBooths } = useQuery({
    queryKey: ['school-admin', 'booths-raw'],
    queryFn: fetchBoothsRaw,
    staleTime: 5 * 60_000,
  })

  const {
    data: workshops = [],
    isFetching: isFetchingWorkshops,
    refetch: refetchWorkshops,
  } = useQuery({
    queryKey: ['school-admin', 'workshops'],
    queryFn: getSchoolAdminWorkshops,
    staleTime: 60_000,
  })

  const overallStats = dashboardData?.stats ?? {}
  const typeStats = overallStats.byType ?? {}
  const selectedTypeStats = typeStats[activeUnitType] ?? {
    totalUnits: 0,
    totalCheckins: 0,
    uniqueVisitors: 0,
  }

  const allUnits = useMemo(
    () =>
      (boothsRaw.length ? boothsRaw : dashboardData?.booths ?? []).map((item) => ({
        id: item.id,
        name: item.displayName || item.name,
        company:
          typeof item.business === 'string'
            ? item.business
            : item.business?.name ?? item.name,
        position: item.location ?? '',
        visitorCount: 0,
        staffName: '',
        type: item.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) as Booth[],
    [boothsRaw, dashboardData?.booths],
  )

  const filteredUnits = useMemo(
    () => allUnits.filter((item) => item.type === activeUnitType),
    [activeUnitType, allUnits],
  )

  const recentScans = dashboardData?.recentScans ?? []
  const filteredRecentScans = recentScans.filter((item) => item.booth?.type === activeUnitType)

  const hourlyDist = statsData?.hourlyDistribution ?? []
  const peakHoursData = hourlyDist.map((h) => ({ hour: h.hour, count: h.count }))
  const majorDist = statsData?.majorDistribution ?? []
  const deptDist = statsData?.departmentDistribution ?? []
  const yearDist = statsData?.yearDistribution ?? []
  const dailyDist = statsData?.dailyDistribution ?? []
  const checkinTypeDistribution = statsData?.checkinTypeDistribution ?? []

  const boothVsWorkshop = [
    {
      name: 'Lượt check-in',
      Booth: checkinTypeDistribution.find((item) => item.type === 'booth')?.count ?? 0,
      Workshop: checkinTypeDistribution.find((item) => item.type === 'workshop')?.count ?? 0,
    },
    {
      name: 'Sinh viên unique',
      Booth: checkinTypeDistribution.find((item) => item.type === 'booth')?.uniqueStudents ?? 0,
      Workshop: checkinTypeDistribution.find((item) => item.type === 'workshop')?.uniqueStudents ?? 0,
    },
  ]

  const selectedDistribution =
    checkinTypeDistribution.find((item) => item.type === activeUnitType) ?? {
      type: activeUnitType,
      count: 0,
      uniqueStudents: 0,
    }

  const handleRefresh = () => {
    refetch()
    refetchStats()
    refetchBooths()
    refetchWorkshops()
  }

  const handleOpenWorkshopAccount = (workshop: WorkshopManagementItem) => {
    setSelectedWorkshop(workshop)
    setAccountDialogOpen(true)
  }

  const handleCreateWorkshopAccount = async (data: WorkshopAccountCreateInput) => {
    if (!selectedWorkshop) return

    setIsCreatingAccount(true)
    try {
      await createSchoolAdminWorkshopAccount(selectedWorkshop.id, data)
      toast.success('Đã tạo tài khoản cho workshop')
      setAccountDialogOpen(false)
      setSelectedWorkshop(null)
      await refetchWorkshops()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || ''
      if (message.includes('đã có tài khoản')) {
        toast.error('Workshop này đã có tài khoản')
      } else if (message.includes('Email đã tồn tại') || message.includes('Email already')) {
        toast.error('Email đã được sử dụng')
      } else {
        toast.error(message || 'Không thể tạo tài khoản workshop')
      }
    } finally {
      setIsCreatingAccount(false)
    }
  }

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
          totalVisitors: overallStats.uniqueVisitors ?? 0,
          totalBooths: overallStats.totalBooths ?? 0,
          totalScans: overallStats.totalCheckins ?? 0,
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
    { id: 'event-overview', label: 'Thống kê theo nhóm', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'workshop-management', label: 'Quản lý workshop', icon: <Building2 className="h-5 w-5" /> },
    { id: 'booth-stats', label: 'Thống kê đơn vị', icon: <TrendingUp className="h-5 w-5" /> },
    { id: 'analytics', label: 'Phân tích', icon: <LineChart className="h-5 w-5" /> },
    { id: 'checkins', label: 'Check-in SV', icon: <Users className="h-5 w-5" /> },
    { id: 'lookup', label: 'Tra cứu SV', icon: <SearchIcon className="h-5 w-5" /> },
    { id: 'reward-settings', label: 'Mốc quà', icon: <Settings2 className="h-5 w-5" /> },
    { id: 'reward-students', label: 'SV theo mốc quà', icon: <Gift className="h-5 w-5" /> },
    { id: 'rewards', label: 'Đổi quà', icon: <Gift className="h-5 w-5" /> },
    { id: 'booths', label: 'Danh sách đơn vị', icon: <Building2 className="h-5 w-5" /> },
    { id: 'prizes', label: 'Giải thưởng', icon: <Award className="h-5 w-5" /> },
  ]

  const selectedMeta = getUnitMeta(activeUnitType)
  const totalUnits = activeUnitType === 'workshop'
    ? overallStats.totalWorkshops ?? selectedTypeStats.totalUnits
    : overallStats.totalBooths ?? selectedTypeStats.totalUnits
  const avgScans = totalUnits ? selectedTypeStats.totalCheckins / totalUnits : 0

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'event-overview':
        return (
          <div className="space-y-8">
            {/* Tab toggle — top, same as other sections */}
            <UnitToggle activeUnitType={activeUnitType} onChange={setActiveUnitType} />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Thống kê sự kiện theo nhóm</h3>
                <p className="text-sm text-slate-400 italic">Tách riêng dữ liệu booth doanh nghiệp và workshop</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
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
            </div>

            <div className="relative overflow-hidden rounded-[32px] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-400/20">
              <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.35),transparent_55%)]" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-4">
                  <Badge className={selectedMeta.badgeClass}>{selectedMeta.title}</Badge>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">{selectedMeta.title}</h2>
                    <p className="mt-2 max-w-xl text-sm text-slate-300">
                      Theo dõi KPI riêng, danh sách đơn vị riêng và các lượt quét gần đây cho nhóm {selectedMeta.title.toLowerCase()}.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Tổng đơn vị</p>
                    <p className="mt-2 text-3xl font-black">{totalUnits}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Sinh viên unique</p>
                    <p className="mt-2 text-3xl font-black">{selectedTypeStats.uniqueVisitors}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryMetric
                label="Sinh viên tham gia"
                value={selectedTypeStats.uniqueVisitors}
                icon={Users}
                isLoading={isFetching}
                description={`Tổng số SV duy nhất của ${selectedMeta.title.toLowerCase()}`}
              />
              <SummaryMetric
                label="Số đơn vị"
                value={totalUnits}
                icon={Building2}
                isLoading={isFetching}
                description={`Tổng ${selectedMeta.plural.toLowerCase()}`}
              />
              <SummaryMetric
                label="Tổng lượt quét"
                value={selectedTypeStats.totalCheckins}
                icon={ScanQrCode}
                isLoading={isFetching}
                description={`Toàn bộ ${selectedMeta.title.toLowerCase()}`}
              />
              <SummaryMetric
                label="Quét / đơn vị"
                value={avgScans.toFixed(0)}
                icon={TrendingUp}
                isLoading={isFetching}
                description="Hiệu suất trung bình"
              />
            </div>

            <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm shadow-slate-200/50">
              <ScanChart data={peakHoursData} title="Phân bố lượt quét theo giờ" />
            </div>

            <RecentScansPanel scans={filteredRecentScans} unitType={activeUnitType} />
          </div>
        )

      case 'booth-stats':
        return (
          <div className="space-y-4">
            <UnitToggle activeUnitType={activeUnitType} onChange={setActiveUnitType} />
            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <BoothScanStats filterType={activeUnitType} />
            </div>
          </div>
        )

      case 'workshop-management':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Quản lý workshop</h3>
                <p className="text-sm text-slate-400 italic">Tạo tài khoản đăng nhập và xem chi tiết từng workshop</p>
              </div>
            </div>
            <WorkshopManagementTable
              items={workshops}
              isLoading={isFetchingWorkshops}
              onCreateAccount={handleOpenWorkshopAccount}
            />
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            <UnitToggle activeUnitType={activeUnitType} onChange={setActiveUnitType} />
            <AnalyticsContent
              peakHoursData={peakHoursData}
              majorDist={majorDist}
              deptDist={deptDist}
              selectedMeta={selectedMeta}
              selectedDistribution={selectedDistribution}
              boothVsWorkshop={boothVsWorkshop}
            />
          </div>
        )

      case 'checkins':
        return (
          <div className="space-y-4">
            <UnitToggle activeUnitType={activeUnitType} onChange={setActiveUnitType} />
            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <StudentCheckinList defaultTypeFilter={activeUnitType} />
            </div>
          </div>
        )

      case 'lookup':
        return <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6"><StudentBusinessLookup /></div>
      case 'reward-settings':
        return <RewardMilestonesPanel />
      case 'reward-students':
        return <RewardMilestoneStudentsPanel />
      case 'rewards':
        return <RewardsRedeemPanel />
      case 'booths':
        return (
          <div className="space-y-4">
            <UnitToggle activeUnitType={activeUnitType} onChange={setActiveUnitType} />
            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <BoothsTable
                booths={filteredUnits}
                isLoading={isFetching}
                title={activeUnitType === 'workshop' ? 'Danh sách hội thảo' : 'Danh sách booth doanh nghiệp'}
              />
            </div>
          </div>
        )
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
      onTabChange={handleTabChange}
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
      <WorkshopAccountDialog
        open={accountDialogOpen}
        workshop={selectedWorkshop}
        isSubmitting={isCreatingAccount}
        onOpenChange={(open) => {
          setAccountDialogOpen(open)
          if (!open) setSelectedWorkshop(null)
        }}
        onSubmit={handleCreateWorkshopAccount}
      />
    </DashboardLayout>
  )
}

function AnalyticsContent({
  peakHoursData,
  majorDist,
  deptDist,
  selectedMeta,
  selectedDistribution,
  boothVsWorkshop,
}: {
  peakHoursData: Array<{ hour: number; count: number }>
  majorDist: Array<{ major: string; count: number }>
  deptDist: Array<{ department: string; count: number }>
  selectedMeta: ReturnType<typeof getUnitMeta>
  selectedDistribution: { type: UnitType; count: number; uniqueStudents: number }
  boothVsWorkshop: Array<{ name: string; Booth: number; Workshop: number }>
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SummaryMetric
          label="Tổng lượt check-in"
          value={selectedDistribution.count}
          icon={ScanQrCode}
          description={`Thuộc nhóm ${selectedMeta.title}`}
        />
        <SummaryMetric
          label="Sinh viên unique"
          value={selectedDistribution.uniqueStudents}
          icon={Users}
          description={`Số sinh viên khác nhau đã tham gia ${selectedMeta.title.toLowerCase()}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <ComparisonBarChart
            data={[
              { name: 'Tổng lượt check-in', 'Số lượng': selectedDistribution.count },
              { name: 'Sinh viên unique', 'Số lượng': selectedDistribution.uniqueStudents },
            ]}
            title={`Thống kê ${selectedMeta.title} — lượt check-in và sinh viên`}
            dataKeys={[
              { key: 'Số lượng', color: selectedDistribution.type === 'workshop' ? '#F97316' : '#2563EB', name: 'Số lượng' },
            ]}
          />
        </div>
        <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <AreaTrendsChart
            data={peakHoursData.map((h) => ({ name: `${h.hour}:00`, value: h.count }))}
            title="Phân bố sinh viên theo giờ"
            dataKey="value"
            fill="#3B82F6"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <DistributionChart data={majorDist.slice(0, 10).map((m) => ({ name: m.major, value: m.count }))} title="Top 10 Ngành học" />
        </div>
        <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <HeatmapGrid data={deptDist.map((d) => ({ name: d.department, value: d.count }))} title="Sinh viên theo khoa" />
        </div>
      </div>
    </div>
  )
}
