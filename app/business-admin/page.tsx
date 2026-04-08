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
import type { Visitor, WorkshopAttendanceManualInput } from '@/lib/types'
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
import { toast } from 'sonner'

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
    data: workshopAttendance,
    isLoading: isWorkshopLoading,
    refetch: refetchWorkshopAttendance,
  } = useQuery({
    queryKey: ['business-admin', 'workshop-attendance'],
    queryFn: getWorkshopAttendance,
    retry: false,
    staleTime: 30_000,
  })

  const isWorkshopMode = workshopAttendance?.workshop?.type === 'workshop'

  const { data: boothStatsData } = useBusinessAdminControllerGetBoothStats(boothId || '', {
    query: { enabled: !!boothId && !isWorkshopMode },
  })
  const boothStats = (boothStatsData as any)?.data

  const {
    data: checkinsData,
    isLoading: isBoothLoading,
    refetch: refetchVisitors,
  } = useBusinessAdminControllerGetVisitors(
    { boothId: boothId || '', pageSize: '100' },
    { query: { enabled: !!boothId && !isWorkshopMode } },
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
  const isBoothViewLoading = !isWorkshopMode && isBoothLoading

  const handleRefresh = async () => {
    if (isWorkshopMode) {
      await refetchWorkshopAttendance()
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

  const handleWorkshopExport = async (format: 'csv' | 'excel') => {
    if (!workshopAttendance?.items.length || isExportingWorkshop) return

    setIsExportingWorkshop(true)
    try {
      if (format === 'excel') {
        await downloadWorkshopAttendanceExcel()
      } else {
        await downloadWorkshopAttendanceCsv()
      }
    } catch {
      toast.error('Không thể xuất file điểm danh workshop')
    } finally {
      setIsExportingWorkshop(false)
    }
  }

  const handleManualSubmit = async (data: WorkshopAttendanceManualInput) => {
    setIsSubmittingManual(true)
    try {
      await addWorkshopAttendanceManual(data)
      toast.success('Đã thêm sinh viên vào danh sách điểm danh hội thảo')
      setManualDialogOpen(false)
      await refetchWorkshopAttendance()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || ''
      if (message.includes('đã có trong danh sách điểm danh')) {
        toast.error('Sinh viên này đã có trong danh sách điểm danh của hội thảo')
      } else {
        toast.error(message || 'Không thể thêm thủ công sinh viên')
      }
    } finally {
      setIsSubmittingManual(false)
    }
  }

  const handleDeleteManual = async (studentCode: string) => {
    setIsDeletingManual(true)
    try {
      await deleteWorkshopAttendance(studentCode)
      toast.success('Đã xoá sinh viên khỏi danh sách điểm danh hội thảo')
      await refetchWorkshopAttendance()
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

  const workshopNavItems = [
    { id: 'overview', label: 'Tổng quan', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'analytics', label: 'Thống kê', icon: <LineChart className="h-5 w-5" /> },
    { id: 'visitors', label: 'Điểm danh', icon: <ClipboardList className="h-5 w-5" /> },
  ]

  const hourlyData = boothStats?.hourlyDistribution?.map((h: any) => ({
    time: `${h.hour}:00`,
    count: h.count,
  })) ?? mockPeakHours.map((h) => ({ time: `${h.hour}:00`, count: h.count }))

  const workshopHourlyData = workshopAttendance
    ? Array.from({ length: 24 }, (_, hour) => {
        const count = workshopAttendance.items.filter((item) => {
          const date = new Date(item.checkInTime.replace(' ', 'T'))
          return !Number.isNaN(date.getTime()) && date.getHours() === hour
        }).length
        return { time: `${hour.toString().padStart(2, '0')}:00`, count }
      }).filter((item) => item.count > 0)
    : []

  const workshopDepartmentData = workshopAttendance
    ? Object.entries(
        workshopAttendance.items.reduce<Record<string, number>>((acc, item) => {
          const key = item.department?.trim() || 'Chưa cập nhật'
          acc[key] = (acc[key] ?? 0) + 1
          return acc
        }, {}),
      ).map(([name, value]) => ({ name, value }))
    : []

  const workshopDisplayName = workshopAttendance?.workshop?.displayName
    || workshopAttendance?.workshop?.business
    || workshopAttendance?.workshop?.name
    || 'Hội thảo'

  const workshopPeakHour = workshopHourlyData.reduce(
    (best, current) => (current.count > best.count ? current : best),
    { time: '—', count: 0 },
  )

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

            <div className="flex flex-col gap-4">
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
            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              Trang phân tích đang phát triển
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

  const renderWorkshopContent = () => {
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
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Hội thảo sẵn sàng</span>
                </div>
              </div>

              <p className="text-blue-100 text-[11px] font-bold uppercase tracking-widest relative z-10 opacity-80 mt-4">
                Nhấn để bắt đầu quét check-in sinh viên tham gia workshop
              </p>
            </div>

            {workshopAttendance ? (
              <>
                <div className="flex items-center justify-end">
                  <WorkshopExportActions
                    isPending={isExportingWorkshop}
                    onOpenManualAdd={() => setManualDialogOpen(true)}
                    onDownloadCsv={() => handleWorkshopExport('csv')}
                    onDownloadExcel={() => handleWorkshopExport('excel')}
                  />
                </div>
                <WorkshopAttendanceHeader
                  workshop={workshopAttendance.workshop}
                  total={workshopAttendance.total}
                />
                <div className="flex flex-col gap-4">
                  <SummaryMetric
                    label="Sinh viên đã điểm danh"
                    value={workshopAttendance.total}
                    icon={Users}
                    isLoading={isWorkshopLoading}
                    description="Danh sách unique theo hội thảo"
                  />
                  <SummaryMetric
                    label="Giờ cao điểm"
                    value={workshopPeakHour.time}
                    icon={Calendar}
                    isLoading={isWorkshopLoading}
                    description="Khung giờ check-in đông nhất"
                  />
                  <SummaryMetric
                    label="Khoa tham gia"
                    value={workshopDepartmentData.length}
                    icon={Eye}
                    isLoading={isWorkshopLoading}
                    description="Số khoa xuất hiện trong danh sách điểm danh"
                  />
                </div>
                <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
                  <BoothTrendsChart data={workshopHourlyData} title="Phân bố check-in workshop theo giờ" />
                </div>
              </>
            ) : (
              <WorkshopAttendanceTable items={[]} isLoading={isWorkshopLoading} />
            )}
          </div>
        )
      case 'analytics':
        return workshopAttendance ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SummaryMetric
                label="Tổng lượt điểm danh"
                value={workshopAttendance.total}
                icon={ClipboardList}
                isLoading={isWorkshopLoading}
                description="Sinh viên unique của workshop"
              />
              <SummaryMetric
                label="Giờ cao điểm"
                value={workshopPeakHour.time}
                icon={Calendar}
                isLoading={isWorkshopLoading}
                description={`${workshopPeakHour.count} lượt check-in`}
              />
            </div>
            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <BoothTrendsChart data={workshopHourlyData} title="Biểu đồ check-in theo giờ" />
            </div>
            <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <DistributionChart data={workshopDepartmentData} title="Phân bố theo khoa" />
            </div>
          </div>
        ) : (
          <WorkshopAttendanceTable items={[]} isLoading={isWorkshopLoading} />
        )
      case 'visitors':
        return (
          <div className="space-y-6">
            {workshopAttendance && (
              <div className="flex items-center justify-end">
                <WorkshopExportActions
                  isPending={isExportingWorkshop}
                  onOpenManualAdd={() => setManualDialogOpen(true)}
                  onDownloadCsv={() => handleWorkshopExport('csv')}
                  onDownloadExcel={() => handleWorkshopExport('excel')}
                />
              </div>
            )}
            <WorkshopAttendanceTable
              items={workshopAttendance?.items ?? []}
              isLoading={isWorkshopLoading}
              isDeleting={isDeletingManual}
              onDelete={handleDeleteManual}
            />
          </div>
        )
      default:
        return null
    }
  }

  const title = isWorkshopMode ? 'Điểm danh hội thảo' : 'Quản lý gian hàng'
  const subtitle = isWorkshopMode
    ? workshopDisplayName
    : boothStats?.booth?.name || 'DUT JOB FAIR 2026'

  return (
    <DashboardLayout
      title={title}
      subtitle={subtitle}
      navItems={isWorkshopMode ? workshopNavItems : boothNavItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isWorkshopMode ? isWorkshopLoading : isBoothViewLoading}
            className="h-9 w-9 rounded-full hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-400 ${(isWorkshopMode ? isWorkshopLoading : isBoothViewLoading) ? 'animate-spin' : ''}`}
            />
          </Button>
          <UserProfileHeader />
        </div>
      }
    >
      {isWorkshopMode ? renderWorkshopContent() : renderBoothContent()}
      <WorkshopManualAttendanceDialog
        open={manualDialogOpen}
        isSubmitting={isSubmittingManual}
        onOpenChange={setManualDialogOpen}
        onSubmit={handleManualSubmit}
      />
    </DashboardLayout>
  )
}
