'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import axiosInstance from '@/lib/axios-instance'
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
  Loader2,
  Maximize2,
} from 'lucide-react'
import type {
  Booth,
  CreateWorkshopInput,
  SchoolTypeStats,
  UnitType,
  WorkshopAccountCreateInput,
  WorkshopManagementItem,
  BusinessAccountCreateInput,
} from '@/lib/types'
import { StudentCheckinList } from '@/components/school-admin/StudentCheckinList'
import { StudentBusinessLookup } from '@/components/school-admin/StudentBusinessLookup'
import { RewardMilestonesPanel } from '@/components/school-admin/RewardMilestonesPanel'
import { RewardMilestoneStudentsPanel } from '@/components/school-admin/RewardMilestoneStudentsPanel'
import { RewardsRedeemPanel } from '@/components/school-admin/RewardsRedeemPanel'
import { WorkshopAccountDialog } from '@/components/school-admin/WorkshopAccountDialog'
import { BusinessAccountDialog } from '@/components/school-admin/BusinessAccountDialog'
import { BusinessAccountTable } from '@/components/school-admin/BusinessAccountTable'
import { getSchoolAdminBusinessAccounts, createSchoolAdminBusinessAccount, deleteSchoolAdminBusinessAccount } from '@/lib/school-admin-business-accounts'
import { WorkshopManagementTable } from '@/components/school-admin/WorkshopManagementTable'
import { CreateWorkshopDialog } from '@/components/school-admin/CreateWorkshopDialog'
import { UserProfileHeader } from '@/components/UserProfileHeader'
import { customAxiosInstance } from '@/lib/axios-instance'
import { exportOverviewExcel, exportAnalyticsExcel, exportBoothStatsExcel, exportCheckinsExcel } from '@/lib/export-excel'
import { cn, formatVNDateTime } from '@/lib/utils'
import { createSchoolAdminWorkshop, createSchoolAdminWorkshopAccount, getSchoolAdminWorkshops, updateSchoolAdminWorkshopAccount } from '@/lib/school-admin-workshops'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

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

type AnalyticsCheckinItem = {
  id: string
  checkInTime: string
  student: {
    id: string
    major: string | null
    department: string | null
    year: number | null
  }
  booth: {
    id: string
    type?: UnitType
  }
}

type AnalyticsCheckinsResponse = {
  items?: AnalyticsCheckinItem[]
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

async function fetchAnalyticsCheckins(): Promise<AnalyticsCheckinItem[]> {
  const res = await customAxiosInstance<any>('/api/school-admin/checkins?page=1&pageSize=99999', { method: 'GET' })
  const data = (res as any).data as AnalyticsCheckinsResponse | undefined
  return data?.items ?? []
}

function parseCheckinDate(value: string): Date | null {
  const normalized = value?.includes('T') ? value : value?.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
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
  const [businessAccountDialogOpen, setBusinessAccountDialogOpen] = useState(false)
  const [isCreatingBusinessAccount, setIsCreatingBusinessAccount] = useState(false)
  const [createWorkshopDialogOpen, setCreateWorkshopDialogOpen] = useState(false)
  const [isCreatingWorkshop, setIsCreatingWorkshop] = useState(false)

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

  const {
    data: analyticsCheckins = [],
    refetch: refetchAnalyticsCheckins,
  } = useQuery({
    queryKey: ['school-admin', 'analytics-checkins'],
    queryFn: fetchAnalyticsCheckins,
    refetchInterval: 60_000,
    staleTime: 30_000,
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

  const {
    data: businessAccounts = [],
    isFetching: isFetchingBusinessAccounts,
    refetch: refetchBusinessAccounts,
  } = useQuery({
    queryKey: ['school-admin', 'business-accounts'],
    queryFn: getSchoolAdminBusinessAccounts,
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

  const fallbackStats = statsData ?? {}
  const filteredAnalyticsCheckins = analyticsCheckins.filter((item) => item.booth?.type === activeUnitType)

  const hourlyDist = useMemo(() => {
    const buckets = new Array<number>(24).fill(0)
    filteredAnalyticsCheckins.forEach((item) => {
      const date = parseCheckinDate(item.checkInTime)
      if (!date) return
      buckets[date.getHours()] += 1
    })

    const hasData = buckets.some((count) => count > 0)
    if (!hasData) {
      return fallbackStats.hourlyDistribution ?? []
    }

    return buckets.map((count, hour) => ({ hour, count }))
  }, [fallbackStats.hourlyDistribution, filteredAnalyticsCheckins])

  const peakHoursData = hourlyDist
    .map((h) => ({ hour: h.hour, count: h.count }))
    .sort((a, b) => a.hour - b.hour)

  const majorDist = useMemo(() => {
    const counts = new Map<string, number>()
    filteredAnalyticsCheckins.forEach((item) => {
      const major = item.student?.major?.trim()
      if (!major) return
      counts.set(major, (counts.get(major) ?? 0) + 1)
    })
    if (counts.size === 0) {
      return fallbackStats.majorDistribution ?? []
    }
    return Array.from(counts.entries())
      .map(([major, count]) => ({ major, count }))
      .sort((a, b) => b.count - a.count)
  }, [fallbackStats.majorDistribution, filteredAnalyticsCheckins])

  const deptDist = useMemo(() => {
    const counts = new Map<string, number>()
    filteredAnalyticsCheckins.forEach((item) => {
      const department = item.student?.department?.trim()
      if (!department) return
      counts.set(department, (counts.get(department) ?? 0) + 1)
    })
    if (counts.size === 0) {
      return fallbackStats.departmentDistribution ?? []
    }
    return Array.from(counts.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)
  }, [fallbackStats.departmentDistribution, filteredAnalyticsCheckins])

  const yearDist = useMemo(() => {
    const counts = new Map<number, number>()
    filteredAnalyticsCheckins.forEach((item) => {
      const year = item.student?.year
      if (!year) return
      counts.set(year, (counts.get(year) ?? 0) + 1)
    })
    if (counts.size === 0) {
      return fallbackStats.yearDistribution ?? []
    }
    return Array.from(counts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year)
  }, [fallbackStats.yearDistribution, filteredAnalyticsCheckins])

  const dailyDist = useMemo(() => {
    const counts = new Map<string, { count: number; students: Set<string> }>()
    filteredAnalyticsCheckins.forEach((item) => {
      const date = parseCheckinDate(item.checkInTime)
      if (!date) return
      const key = date.toISOString().slice(0, 10)
      const existing = counts.get(key) ?? { count: 0, students: new Set<string>() }
      existing.count += 1
      if (item.student?.id) {
        existing.students.add(item.student.id)
      }
      counts.set(key, existing)
    })
    if (counts.size === 0) {
      return fallbackStats.dailyDistribution ?? []
    }
    return Array.from(counts.entries())
      .map(([date, value]) => ({
        date,
        count: value.count,
        uniqueStudents: value.students.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [fallbackStats.dailyDistribution, filteredAnalyticsCheckins])

  const checkinTypeDistribution = useMemo(() => {
    const init = {
      booth: { type: 'booth' as UnitType, count: 0, uniqueStudents: 0, studentIds: new Set<string>() },
      workshop: { type: 'workshop' as UnitType, count: 0, uniqueStudents: 0, studentIds: new Set<string>() },
    }
    analyticsCheckins.forEach((item) => {
      const type = item.booth?.type
      if (type !== 'booth' && type !== 'workshop') return
      init[type].count += 1
      if (item.student?.id) {
        init[type].studentIds.add(item.student.id)
      }
    })
    const hasData = init.booth.count > 0 || init.workshop.count > 0
    if (!hasData) {
      return fallbackStats.checkinTypeDistribution ?? []
    }
    return [
      { type: 'booth' as UnitType, count: init.booth.count, uniqueStudents: init.booth.studentIds.size },
      { type: 'workshop' as UnitType, count: init.workshop.count, uniqueStudents: init.workshop.studentIds.size },
    ]
  }, [analyticsCheckins, fallbackStats.checkinTypeDistribution])

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
    refetchBusinessAccounts()
    refetchAnalyticsCheckins()
  }

  const handleOpenWorkshopAccount = (workshop: WorkshopManagementItem) => {
    setSelectedWorkshop(workshop)
    setAccountDialogOpen(true)
  }

  const handleCreateWorkshop = async (data: CreateWorkshopInput) => {
    setIsCreatingWorkshop(true)
    try {
      await createSchoolAdminWorkshop(data)
      toast.success('Tạo workshop mới thành công')
      setCreateWorkshopDialogOpen(false)
      refetchWorkshops()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo workshop')
    } finally {
      setIsCreatingWorkshop(false)
    }
  }

  const handleSubmitWorkshopAccount = async (data: any, isUpdate: boolean) => {
    if (!selectedWorkshop) return

    setIsCreatingAccount(true)
    try {
      if (isUpdate) {
        await updateSchoolAdminWorkshopAccount(selectedWorkshop.id, data)
        toast.success('Đã cập nhật thông tin đăng nhập hội thảo')
      } else {
        await createSchoolAdminWorkshopAccount(selectedWorkshop.id, data)
        toast.success('Đã tạo tài khoản cho workshop')
      }
      setAccountDialogOpen(false)
      setSelectedWorkshop(null)
      await refetchWorkshops()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || ''
      if (message.includes('đã có tài khoản')) {
        toast.error('Workshop này đã có tài khoản')
      } else if (message.includes('Email đã tồn tại') || message.includes('Email already') || message.includes('Email đã được sử dụng')) {
        toast.error('Email đã được sử dụng')
      } else {
        toast.error(message || 'Thao tác thất bại')
      }
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleCreateBusinessAccount = async (data: BusinessAccountCreateInput) => {
    setIsCreatingBusinessAccount(true)
    try {
      await createSchoolAdminBusinessAccount(data)
      toast.success('Đã tạo tài khoản doanh nghiệp')
      setBusinessAccountDialogOpen(false)
      await refetchBusinessAccounts()
      await refetchBooths()
      await refetch() // refresh dashboard
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || ''
      if (message.includes('Email đã được sử dụng') || message.includes('Email đã tồn tại')) {
        toast.error('Email đã được sử dụng')
      } else {
        toast.error(message || 'Không thể tạo tài khoản doanh nghiệp')
      }
    } finally {
      setIsCreatingBusinessAccount(false)
    }
  }

  const handleDeleteBusinessAccount = async (userId: string) => {
    try {
      await deleteSchoolAdminBusinessAccount(userId)
      toast.success('Đã xoá tài khoản doanh nghiệp')
      await refetchBusinessAccounts()
      await refetchBooths()
      await refetch() // refresh dashboard
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể xoá tài khoản doanh nghiệp')
    }
  }

  const handleExportOverview = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      exportOverviewExcel({
        totalVisitors: overallStats.uniqueVisitors ?? 0,
        totalBooths: overallStats.totalBooths ?? 0,
        totalScans: overallStats.totalCheckins ?? 0,
      })
      toast.success('Báo cáo tổng quan đã được tải')
    } catch (err) {
      console.error('Export failed:', err)
      toast.error('Xuất file thất bại. Vui lòng thử lại.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportAnalytics = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      exportAnalyticsExcel(hourlyDist, majorDist, deptDist, yearDist, dailyDist)
      toast.success('Dữ liệu phân tích đã được tải')
    } catch (err) {
      console.error('Export failed:', err)
      toast.error('Xuất file thất bại. Vui lòng thử lại.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportBoothStats = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const boothStatsRes = await customAxiosInstance<any>('/api/school-admin/booth-stats', { method: 'GET' })
      const allBoothStats = (boothStatsRes as any).data ?? []
      exportBoothStatsExcel(allBoothStats)
      toast.success('Thống kê gian hàng đã được tải')
    } catch (err) {
      console.error('Export failed:', err)
      toast.error('Xuất file thất bại. Vui lòng thử lại.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCheckins = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const checkinsRes = await customAxiosInstance<any>('/api/school-admin/checkins?page=1&pageSize=99999', { method: 'GET' })
      const allCheckins = (checkinsRes as any).data?.items ?? []
      exportCheckinsExcel(allCheckins)
      toast.success('Lịch sử điểm danh đã được tải')
    } catch (err) {
      console.error('Export failed:', err)
      toast.error('Xuất file thất bại. Vui lòng thử lại.')
    } finally {
      setIsExporting(false)
    }
  }

  const navItems = [
    { id: 'event-overview', label: 'Tổng quan', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'booth-stats', label: 'Thống kê đơn vị', icon: <TrendingUp className="h-5 w-5" /> },
    { id: 'analytics', label: 'Phân tích', icon: <LineChart className="h-5 w-5" /> },
    { id: 'checkins', label: 'Check-in SV', icon: <Users className="h-5 w-5" /> },
    { id: 'lookup', label: 'Tra cứu SV', icon: <SearchIcon className="h-5 w-5" /> },
    { id: 'booths', label: 'Danh sách đơn vị', icon: <Building2 className="h-5 w-5" /> },
    { id: 'workshop-management', label: 'Quản lý workshop', icon: <Building2 className="h-5 w-5" /> },
    { id: 'business-accounts', label: 'Tài khoản doanh nghiệp', icon: <Building2 className="h-5 w-5" /> },
    { id: 'reward-settings', label: 'Mốc quà', icon: <Settings2 className="h-5 w-5" /> },
    { id: 'reward-students', label: 'SV theo mốc quà', icon: <Gift className="h-5 w-5" /> },
    { id: 'rewards', label: 'Đổi quà', icon: <Gift className="h-5 w-5" /> },
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

  const handleExportBoothVisitors = async () => {
    setIsExporting(true)
    try {
      const rawResponse = await axiosInstance.get('/api/school-admin/booth-visitors/export/excel', {
        responseType: 'blob'
      })
      const contentDisposition = rawResponse.headers['content-disposition']
      let filename = 'booth-visitors.xlsx'
      if (contentDisposition) {
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
        if (utf8Match?.[1]) {
          filename = decodeURIComponent(utf8Match[1])
        } else {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
          if (filenameMatch && filenameMatch.length === 2) {
            filename = filenameMatch[1]
          }
        }
      }
      if (/\.xls$/i.test(filename)) {
        filename = filename.replace(/\.xls$/i, '.xlsx')
      }
      if (!/\.xlsx$/i.test(filename)) {
        filename = `${filename}.xlsx`
      }

      const arrayBuffer = await (rawResponse.data as Blob).arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      XLSX.writeFile(workbook, filename)
      toast.success('Đã tải xuống file Excel danh sách sinh viên thăm quan')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải file Excel')
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
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
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Tổng quan</h3>
                <p className="text-sm text-slate-400 italic">Tách riêng dữ liệu booth doanh nghiệp và workshop</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button
                  onClick={handleExportOverview}
                  disabled={isExporting}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 rounded-xl px-4 font-bold"
                >
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span>Tải Báo Cáo Tổng Quan</span>
                </Button>
                <div className="hidden lg:flex gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none font-medium whitespace-nowrap h-10 px-3"
                    onClick={() => {
                      window.open('/scanner', '_blank')
                    }}
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Scanner</span>
                  </Button>
                  <Button
                    className="flex-1 sm:flex-none font-medium whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 rounded-xl h-10 px-3"
                    onClick={() => setActiveTab('rewards')}
                  >
                    <Gift className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Quét QR Đổi Quà</span>
                    <span className="inline sm:hidden">Đổi Quà SV</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:hidden relative overflow-hidden bg-purple-600 rounded-[32px] p-8 shadow-2xl shadow-purple-500/30 text-center space-y-6 group">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50" />
              
              <div
                onClick={() => setActiveTab('rewards')}
                className="relative mx-auto w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              >
                <ScanQrCode className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
              </div>

              <div className="space-y-2 relative z-10">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">Đổi Quà SV</h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/20">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Sẵn sàng</span>
                </div>
              </div>

              <p className="text-purple-100 text-[11px] font-bold uppercase tracking-widest relative z-10 opacity-80 mt-4">
                Nhấn để mở giao diện quét
              </p>
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <UnitToggle activeUnitType={activeUnitType} onChange={setActiveUnitType} />
              <Button
                onClick={handleExportBoothStats}
                disabled={isExporting}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 rounded-xl px-4 font-bold"
              >
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span>Xuất Thống Kê Đơn Vị</span>
              </Button>
            </div>
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
              onManageAccount={handleOpenWorkshopAccount}
              onCreateWorkshop={() => setCreateWorkshopDialogOpen(true)}
            />
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <UnitToggle activeUnitType={activeUnitType} onChange={setActiveUnitType} />
              <Button
                onClick={handleExportAnalytics}
                disabled={isExporting}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 rounded-xl px-4 font-bold"
              >
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span>Tải Báo Kế Toán / Phân Tích</span>
              </Button>
            </div>
            <AnalyticsContent
              peakHoursData={peakHoursData}
              majorDist={majorDist}
              deptDist={deptDist}
              yearDist={yearDist}
              selectedMeta={selectedMeta}
              selectedDistribution={selectedDistribution}
              boothVsWorkshop={boothVsWorkshop}
            />
          </div>
        )

      case 'checkins':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <UnitToggle activeUnitType={activeUnitType} onChange={setActiveUnitType} />
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto font-medium"
                  onClick={handleExportBoothVisitors}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  DS Sinh viên thăm quan (Đã Lọc)
                </Button>
                <Button
                  className="w-full sm:w-auto font-medium bg-slate-900 text-white hover:bg-slate-800"
                  onClick={handleExportCheckins}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Toàn bộ Check-in (Chi tiết)
                </Button>
              </div>
            </div>
            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <StudentCheckinList
                defaultTypeFilter={activeUnitType}
                totalsByType={{
                  all: checkinTypeDistribution.reduce((sum, item) => sum + item.count, 0),
                  booth: checkinTypeDistribution.find((item) => item.type === 'booth')?.count ?? 0,
                  workshop: checkinTypeDistribution.find((item) => item.type === 'workshop')?.count ?? 0,
                }}
              />
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
      case 'business-accounts':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Tài khoản doanh nghiệp</h3>
                <p className="text-sm text-slate-400 italic">Quản lý và tạo mới tự động gian hàng cùng tài khoản</p>
              </div>
            </div>
            <BusinessAccountTable
              items={businessAccounts}
              isLoading={isFetchingBusinessAccounts}
              onCreateClick={() => setBusinessAccountDialogOpen(true)}
              onDeleteAccount={handleDeleteBusinessAccount}
            />
          </div>
        )
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
        onSubmit={handleSubmitWorkshopAccount}
      />
      <BusinessAccountDialog
        open={businessAccountDialogOpen}
        isSubmitting={isCreatingBusinessAccount}
        onOpenChange={setBusinessAccountDialogOpen}
        onSubmit={handleCreateBusinessAccount}
      />
      <CreateWorkshopDialog
        open={createWorkshopDialogOpen}
        isSubmitting={isCreatingWorkshop}
        onOpenChange={setCreateWorkshopDialogOpen}
        onSubmit={handleCreateWorkshop}
      />
    </DashboardLayout>
  )
}

function AnalyticsContent({
  peakHoursData,
  majorDist,
  deptDist,
  yearDist,
  selectedMeta,
  selectedDistribution,
  boothVsWorkshop,
}: {
  peakHoursData: Array<{ hour: number; count: number }>
  majorDist: Array<{ major: string; count: number }>
  deptDist: Array<{ department: string; count: number }>
  yearDist: Array<{ year: number; count: number }>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 overflow-hidden">
          <HeatmapGrid data={yearDist.map((y) => ({ name: `Năm ${y.year}`, value: y.count }))} title="Số lượng sinh viên theo khóa" />
        </div>
        <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 overflow-hidden">
          <HeatmapGrid data={deptDist.map((d) => ({ name: typeof d.department === 'string' ? d.department.replace(/^Khoa\s+/i, '') : d.department, value: d.count }))} title="Số lượng sinh viên theo khoa" />
        </div>
      </div>
    </div>
  )
}
