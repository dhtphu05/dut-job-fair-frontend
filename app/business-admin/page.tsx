'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/DashboardLayout'
import { VisitorsList } from '@/components/business-admin/VisitorsList'
import { BoothTrendsChart } from '@/components/business-admin/BoothTrendsChart'
import { WorkshopAttendanceHeader } from '@/components/business-admin/WorkshopAttendanceHeader'
import { WorkshopAttendanceTable } from '@/components/business-admin/WorkshopAttendanceTable'
import { WorkshopExportActions } from '@/components/business-admin/WorkshopExportActions'
import { WorkshopManualAttendanceDialog } from '@/components/business-admin/WorkshopManualAttendanceDialog'
import { DistributionChart } from '@/components/analytics/DistributionChart'
import { SummaryMetric } from '@/components/SummaryMetric'
import {
  Users,
  Eye,
  Calendar,
  RefreshCw,
  Download,
  BarChart3,
  LineChart,
  ScanQrCode,
  ClipboardList,
} from 'lucide-react'
import type { Visitor, WorkshopAttendanceManualInput, WorkshopAttendanceResponse } from '@/lib/types'
import { mockPeakHours } from '@/lib/mock-data'
import { UserProfileHeader } from '@/components/UserProfileHeader'
import {
  getBusinessAdminControllerGetVisitorsQueryKey,
  useBusinessAdminControllerGetBoothStats,
  useBusinessAdminControllerGetVisitors,
} from '@/lib/api/generated/business-admin/business-admin'
import {
  addWorkshopAttendanceManual,
  deleteWorkshopAttendance,
  downloadWorkshopAttendanceCsv,
  downloadWorkshopAttendanceExcel,
  getWorkshopAttendance,
} from '@/lib/workshop-attendance'
import {
  addTotnghiepAttendanceManual,
  deleteTotnghiepAttendance,
  downloadTotnghiepAttendanceCsv,
  downloadTotnghiepAttendanceExcel,
  getTotnghiepAttendance,
} from '@/lib/totnghiep-attendance'
import { getUnitMeta } from '@/lib/unit-meta'
import { toast } from 'sonner'

type AttendanceMode = 'workshop' | 'totnghiep'

type AttendanceQueryResult = {
  mode: AttendanceMode
  data: WorkshopAttendanceResponse
}

function isAttendanceFallbackError(error: any) {
  return error?.response?.status === 403 || error?.response?.status === 404
}

async function getAttendanceMode(): Promise<AttendanceQueryResult | null> {
  try {
    const workshopData = await getWorkshopAttendance()
    if (workshopData?.workshop?.type === 'workshop') {
      return { mode: 'workshop', data: workshopData }
    }
  } catch (error) {
    if (!isAttendanceFallbackError(error)) {
      throw error
    }
  }

  try {
    const totnghiepData = await getTotnghiepAttendance()
    if (totnghiepData?.workshop?.type === 'totnghiep') {
      return { mode: 'totnghiep', data: totnghiepData }
    }
  } catch (error) {
    if (!isAttendanceFallbackError(error)) {
      throw error
    }
  }

  return null
}

export default function BusinessAdminDashboard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [boothId, setBoothId] = useState<string | null>(null)
  const [isExportingWorkshop, setIsExportingWorkshop] = useState(false)
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [isSubmittingManual, setIsSubmittingManual] = useState(false)
  const [isDeletingManual, setIsDeletingManual] = useState(false)

  useEffect(() => {
    setBoothId(localStorage.getItem('booth_id'))
  }, [])

  const {
    data: attendanceResult,
    isLoading: isAttendanceLoading,
    refetch: refetchAttendanceMode,
  } = useQuery({
    queryKey: ['business-admin', 'attendance-mode'],
    queryFn: getAttendanceMode,
    retry: false,
    staleTime: 30_000,
  })

  const attendanceMode = attendanceResult?.mode ?? null
  const attendanceData = attendanceResult?.data ?? null
  const attendanceMeta = attendanceMode ? getUnitMeta(attendanceMode) : null
  const isAttendanceMode = Boolean(attendanceMode)
  const attendanceResolved = !isAttendanceLoading
  const attendanceLabel = attendanceMode === 'totnghiep' ? 'tốt nghiệp' : 'hội thảo'
  const attendanceUnitLabel = attendanceMode === 'totnghiep' ? 'khu tốt nghiệp' : 'hội thảo'
  const attendanceUnitColumnLabel = attendanceMode === 'totnghiep' ? 'Tên khu tốt nghiệp' : 'Tên hội thảo'

  const { data: boothStatsData } = useBusinessAdminControllerGetBoothStats(boothId || '', {
    query: { enabled: !!boothId && attendanceResolved && !isAttendanceMode },
  })
  const boothStats = (boothStatsData as any)?.data

  const {
    data: checkinsData,
    isLoading: isBoothLoading,
    refetch: refetchVisitors,
  } = useBusinessAdminControllerGetVisitors(
    { boothId: boothId || '', pageSize: '100' },
    { query: { enabled: !!boothId && attendanceResolved && !isAttendanceMode } },
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
  const isBoothViewLoading = !attendanceResolved || (!isAttendanceMode && isBoothLoading)

  const handleRefresh = async () => {
    if (isAttendanceMode) {
      await refetchAttendanceMode()
      return
    }

    await refetchVisitors()
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

  const handleAttendanceExport = async (format: 'csv' | 'excel') => {
    if (!attendanceData?.items.length || isExportingWorkshop || !attendanceMode) return

    setIsExportingWorkshop(true)
    try {
      if (attendanceMode === 'totnghiep') {
        if (format === 'excel') {
          await downloadTotnghiepAttendanceExcel()
        } else {
          await downloadTotnghiepAttendanceCsv()
        }
      } else if (format === 'excel') {
        await downloadWorkshopAttendanceExcel()
      } else {
        await downloadWorkshopAttendanceCsv()
      }
    } catch {
      toast.error(`Không thể xuất file điểm danh ${attendanceLabel}`)
    } finally {
      setIsExportingWorkshop(false)
    }
  }

  const handleManualSubmit = async (data: WorkshopAttendanceManualInput) => {
    if (!attendanceMode) return
    setIsSubmittingManual(true)
    try {
      if (attendanceMode === 'totnghiep') {
        await addTotnghiepAttendanceManual(data)
      } else {
        await addWorkshopAttendanceManual(data)
      }
      toast.success(`Đã thêm sinh viên vào danh sách điểm danh ${attendanceUnitLabel}`)
      setManualDialogOpen(false)
      await refetchAttendanceMode()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || ''
      if (message.includes('đã có trong danh sách điểm danh')) {
        toast.error(`Sinh viên này đã có trong danh sách điểm danh của ${attendanceUnitLabel}`)
      } else {
        toast.error(message || 'Không thể thêm thủ công sinh viên')
      }
    } finally {
      setIsSubmittingManual(false)
    }
  }

  const handleDeleteManual = async (studentCode: string) => {
    if (!attendanceMode) return
    setIsDeletingManual(true)
    try {
      if (attendanceMode === 'totnghiep') {
        await deleteTotnghiepAttendance(studentCode)
      } else {
        await deleteWorkshopAttendance(studentCode)
      }
      toast.success(`Đã xoá sinh viên khỏi danh sách điểm danh ${attendanceUnitLabel}`)
      await refetchAttendanceMode()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể xoá sinh viên')
    } finally {
      setIsDeletingManual(false)
    }
  }

  const boothNavItems = [
    { id: 'overview', label: 'Tổng quan', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'analytics', label: 'Thống kê', icon: <LineChart className="h-5 w-5" /> },
    { id: 'visitors', label: 'Danh sách khách', icon: <Users className="h-5 w-5" /> },
  ]

  const attendanceNavItems = [
    { id: 'overview', label: 'Tổng quan', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'analytics', label: 'Thống kê', icon: <LineChart className="h-5 w-5" /> },
    { id: 'visitors', label: 'Điểm danh', icon: <ClipboardList className="h-5 w-5" /> },
  ]

  const hourlyData = boothStats?.hourlyDistribution?.map((h: any) => ({
    time: `${(h.hour + 7) % 24}:00`,
    hour: (h.hour + 7) % 24,
    count: h.count,
  })).sort((a: any, b: any) => a.hour - b.hour) ?? mockPeakHours.map((h) => ({ 
    time: `${h.hour}:00`, 
    hour: h.hour,
    count: h.count 
  }))

  const attendanceHourlyData = attendanceData
    ? Array.from({ length: 24 }, (_, hour) => {
        const count = attendanceData.items.filter((item) => {
          const raw = item.checkInTime.replace(' ', 'T')
          const utc = raw.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(raw) ? raw : raw + 'Z'
          const vnDate = new Date(new Date(utc).getTime() + 7 * 60 * 60 * 1000)
          return !Number.isNaN(vnDate.getTime()) && vnDate.getUTCHours() === hour
        }).length
        return { time: `${hour.toString().padStart(2, '0')}:00`, count }
      }).filter((item) => item.count > 0)
    : []

  const attendanceDepartmentData = attendanceData
    ? Object.entries(
        attendanceData.items.reduce<Record<string, number>>((acc, item) => {
          const key = item.department?.trim() || 'Chưa cập nhật'
          acc[key] = (acc[key] ?? 0) + 1
          return acc
        }, {}),
      ).map(([name, value]) => ({ name, value }))
    : []

  const attendanceDisplayName = attendanceData?.workshop?.displayName
    || attendanceData?.workshop?.business
    || attendanceData?.workshop?.name
    || attendanceMeta?.title
    || 'Điểm danh'

  const attendancePeakHour = attendanceHourlyData.reduce(
    (best, current) => (current.count > best.count ? current : best),
    { time: '—', count: 0 },
  )

  const boothPeakHour = hourlyData.reduce(
    (best: any, current: any) => (current.count > best.count ? current : best),
    { time: '—', count: 0 },
  )

  const boothDepartmentData = Object.entries(
    (((checkinsData as any)?.data?.items ?? []) as any[]).reduce((acc: Record<string, number>, item: any) => {
      const key = item.student?.department?.trim() || 'Chưa cập nhật'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {} as Record<string, number>),
  ).map(([name, value]) => ({ name, value: value as number }))

  const boothYearData = Object.entries(
    visitors.reduce<Record<string, number>>((acc, v) => {
      const key = v.year ? `Năm ${v.year}` : 'Chưa cập nhật'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

  const renderBoothContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryMetric
                label="Lượt check-in"
                value={boothStats?.stats?.totalVisitors ?? visitorsTotal}
                icon={Eye}
                isLoading={isBoothViewLoading}
                description="Tổng lượt quét tại quầy"
              />
              <SummaryMetric
                label="Khách duy nhất"
                value={boothStats?.stats?.uniqueVisitors ?? '—'}
                icon={Users}
                isLoading={isBoothViewLoading}
                description="Số sinh viên khác nhau"
              />
              <SummaryMetric
                label="Giờ cao điểm"
                value={hourlyData.reduce((a: any, b: any) => (a.count > b.count ? a : b), { count: 0 }).time || '—'}
                icon={Calendar}
                isLoading={isBoothViewLoading}
                description="Thời điểm bận rộn nhất"
              />
            </div>

            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <BoothTrendsChart data={hourlyData} title="Phân bố khách theo giờ" />
            </div>
          </div>
        )
      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryMetric
                label="Lượt check-in"
                value={boothStats?.stats?.totalVisitors ?? visitorsTotal}
                icon={Eye}
                isLoading={isBoothViewLoading}
                description="Tổng lượt quét tại quầy"
              />
              <SummaryMetric
                label="Khách duy nhất"
                value={boothStats?.stats?.uniqueVisitors ?? '—'}
                icon={Users}
                isLoading={isBoothViewLoading}
                description="Số sinh viên khác nhau"
              />
              <SummaryMetric
                label="Giờ cao điểm"
                value={boothPeakHour.time}
                icon={Calendar}
                isLoading={isBoothViewLoading}
                description={boothPeakHour.count > 0 ? `${boothPeakHour.count} lượt check-in` : 'Chưa có dữ liệu'}
              />
            </div>
            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <BoothTrendsChart data={hourlyData} title="Biểu đồ check-in theo giờ" />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
                <DistributionChart data={boothDepartmentData} title="Phân bố theo khoa" />
              </div>
              <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
                <DistributionChart data={boothYearData} title="Phân bố theo năm học" />
              </div>
            </div>
          </div>
        )
      case 'visitors':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <VisitorsList visitors={visitors} isLoading={isBoothViewLoading} />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const renderAttendanceContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
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
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">{attendanceMeta?.title || 'Điểm danh'} sẵn sàng</span>
                </div>
              </div>

              <p className="text-blue-100 text-[11px] font-bold uppercase tracking-widest relative z-10 opacity-80 mt-4">
                {`Nhấn để bắt đầu quét check-in sinh viên tham gia ${attendanceUnitLabel}`}
              </p>
            </div>

            {attendanceData ? (
              <>
                <div className="flex items-center justify-end">
                  <WorkshopExportActions
                    isPending={isExportingWorkshop}
                    onOpenManualAdd={() => setManualDialogOpen(true)}
                    onDownloadCsv={() => handleAttendanceExport('csv')}
                    onDownloadExcel={() => handleAttendanceExport('excel')}
                  />
                </div>
                <WorkshopAttendanceHeader
                  unit={attendanceData.workshop}
                  total={attendanceData.total}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <SummaryMetric
                    label="Sinh viên đã điểm danh"
                    value={attendanceData.total}
                    icon={Users}
                    isLoading={isAttendanceLoading}
                    description={`Danh sách unique theo ${attendanceUnitLabel}`}
                  />
                  <SummaryMetric
                    label="Giờ cao điểm"
                    value={attendancePeakHour.time}
                    icon={Calendar}
                    isLoading={isAttendanceLoading}
                    description="Khung giờ check-in đông nhất"
                  />
                  <SummaryMetric
                    label="Khoa tham gia"
                    value={attendanceDepartmentData.length}
                    icon={Eye}
                    isLoading={isAttendanceLoading}
                    description="Số khoa xuất hiện trong danh sách điểm danh"
                  />
                </div>
                <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
                  <BoothTrendsChart data={attendanceHourlyData} title={`Phân bố check-in ${attendanceUnitLabel} theo giờ`} />
                </div>
              </>
            ) : (
              <WorkshopAttendanceTable
                items={[]}
                isLoading={isAttendanceLoading}
                title={`Danh sách điểm danh ${attendanceUnitLabel}`}
                unitColumnLabel={attendanceUnitColumnLabel}
                unitLabel={attendanceUnitLabel}
                emptyDescription={`Danh sách sẽ tự cập nhật khi sinh viên check-in vào ${attendanceUnitLabel} này.`}
              />
            )}
          </div>
        )
      case 'analytics':
        return attendanceData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryMetric
                label="Tổng lượt điểm danh"
                value={attendanceData.total}
                icon={ClipboardList}
                isLoading={isAttendanceLoading}
                description={`Sinh viên unique của ${attendanceUnitLabel}`}
              />
              <SummaryMetric
                label="Giờ cao điểm"
                value={attendancePeakHour.time}
                icon={Calendar}
                isLoading={isAttendanceLoading}
                description={attendancePeakHour.count > 0 ? `${attendancePeakHour.count} lượt check-in` : 'Chưa có dữ liệu'}
              />
              <SummaryMetric
                label="Khoa tham gia"
                value={attendanceDepartmentData.length || '—'}
                icon={Eye}
                isLoading={isAttendanceLoading}
                description="Số khoa xuất hiện trong danh sách điểm danh"
              />
            </div>
            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <BoothTrendsChart data={attendanceHourlyData} title="Biểu đồ check-in theo giờ" />
            </div>
            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <DistributionChart data={attendanceDepartmentData} title="Phân bố theo khoa" />
            </div>
          </div>
        ) : (
          <WorkshopAttendanceTable
            items={[]}
            isLoading={isAttendanceLoading}
            title={`Danh sách điểm danh ${attendanceUnitLabel}`}
            unitColumnLabel={attendanceUnitColumnLabel}
            unitLabel={attendanceUnitLabel}
            emptyDescription={`Danh sách sẽ tự cập nhật khi sinh viên check-in vào ${attendanceUnitLabel} này.`}
          />
        )
      case 'visitors':
        return (
          <div className="space-y-6">
            {attendanceData && (
              <div className="flex items-center justify-end">
                <WorkshopExportActions
                  isPending={isExportingWorkshop}
                  onOpenManualAdd={() => setManualDialogOpen(true)}
                  onDownloadCsv={() => handleAttendanceExport('csv')}
                  onDownloadExcel={() => handleAttendanceExport('excel')}
                />
              </div>
            )}
            <WorkshopAttendanceTable
              items={attendanceData?.items ?? []}
              isLoading={isAttendanceLoading}
              isDeleting={isDeletingManual}
              onDelete={handleDeleteManual}
              title={`Danh sách điểm danh ${attendanceUnitLabel}`}
              unitColumnLabel={attendanceUnitColumnLabel}
              unitLabel={attendanceUnitLabel}
              emptyDescription={`Danh sách sẽ tự cập nhật khi sinh viên check-in vào ${attendanceUnitLabel} này.`}
            />
          </div>
        )
      default:
        return null
    }
  }

  const title = isAttendanceMode ? `Điểm danh ${attendanceLabel}` : 'Quản lý gian hàng'
  const subtitle = isAttendanceMode
    ? attendanceDisplayName
    : boothStats?.booth?.name || 'DUT JOB FAIR 2026'

  return (
    <DashboardLayout
      title={title}
      subtitle={subtitle}
      navItems={isAttendanceMode ? attendanceNavItems : boothNavItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isAttendanceMode ? isAttendanceLoading : isBoothViewLoading}
            className="h-9 w-9 rounded-full hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-400 ${(isAttendanceMode ? isAttendanceLoading : isBoothViewLoading) ? 'animate-spin' : ''}`}
            />
          </Button>
          <UserProfileHeader />
        </div>
      }
    >
      {isAttendanceMode ? renderAttendanceContent() : renderBoothContent()}
      <WorkshopManualAttendanceDialog
        open={manualDialogOpen}
        isSubmitting={isSubmittingManual}
        onOpenChange={setManualDialogOpen}
        onSubmit={handleManualSubmit}
        unitLabel={attendanceUnitLabel}
      />
    </DashboardLayout>
  )
}
