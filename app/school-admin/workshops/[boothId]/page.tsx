'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SummaryMetric } from '@/components/SummaryMetric'
import { DistributionChart } from '@/components/analytics/DistributionChart'
import { UserProfileHeader } from '@/components/UserProfileHeader'
import { WorkshopAccountDialog } from '@/components/school-admin/WorkshopAccountDialog'
import {
  createSchoolAdminWorkshopAccount,
  getSchoolAdminWorkshopDetail,
  downloadSchoolAdminWorkshopAttendanceExcel,
  updateSchoolAdminWorkshopAccount
} from '@/lib/school-admin-workshops'
import { formatVNDateTime } from '@/lib/utils'
import type { WorkshopAccountCreateInput } from '@/lib/types'
import { toast } from 'sonner'
import { ArrowLeft, KeyRound, QrCode, RefreshCw, Users, Download, Loader2 } from 'lucide-react'

export default function SchoolAdminWorkshopDetailPage() {
  const router = useRouter()
  const params = useParams<{ boothId: string }>()
  const boothId = typeof params?.boothId === 'string' ? params.boothId : ''
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['school-admin', 'workshop-detail', boothId],
    queryFn: () => getSchoolAdminWorkshopDetail(boothId),
    enabled: !!boothId,
  })

  const workshop = data?.workshop
  const account = data?.account
  const stats = data?.stats
  const departmentData = useMemo(
    () => (data?.departmentDistribution ?? []).map((item) => ({ name: item.department, value: item.count })),
    [data?.departmentDistribution],
  )

  const handleCreateAccount = async (payload: any, isUpdate: boolean = false) => {
    if (!boothId) return

    setIsCreatingAccount(true)
    try {
      if (isUpdate) {
        await updateSchoolAdminWorkshopAccount(boothId, payload)
        toast.success('Đã cập nhật thông tin tài khoản')
      } else {
        await createSchoolAdminWorkshopAccount(boothId, payload)
        toast.success('Đã tạo tài khoản cho workshop')
      }
      setAccountDialogOpen(false)
      await refetch()
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

  const handleExportExcel = async () => {
    if (!boothId) return
    setIsExporting(true)
    try {
      await downloadSchoolAdminWorkshopAttendanceExcel(boothId)
      toast.success('Đã tải xuống file Excel')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xuất file')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-border/50 sticky top-0 z-20 bg-white">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/school-admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">
                {workshop?.displayName || workshop?.name || 'Chi tiết workshop'}
              </h1>
              <p className="text-xs text-muted-foreground truncate">Quản lý workshop và tài khoản đăng nhập</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="hidden sm:flex items-center gap-2 font-semibold"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>Xuất Excel</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 text-slate-400 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <UserProfileHeader />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <CardHeader>
              <CardTitle>Thông tin workshop</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-slate-400">Tên hiển thị</p>
                <p className="font-semibold text-slate-900">{workshop?.displayName || workshop?.name || '—'}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-slate-400">Địa điểm</p>
                  <p className="font-medium text-slate-900">{workshop?.location || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Sức chứa</p>
                  <p className="font-medium text-slate-900">{workshop?.capacity ?? '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-slate-400">Mã QR</p>
                  <p className="font-medium text-slate-900">{workshop?.qrCode || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Loại</p>
                  <Badge className="bg-orange-100 text-orange-700 border-transparent">Hội thảo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Thông tin tài khoản</CardTitle>
                {!account && (
                  <Button size="sm" onClick={() => setAccountDialogOpen(true)}>
                    <KeyRound className="h-4 w-4" />
                    <span>Tạo tài khoản</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {account ? (
                <>
                  <div>
                    <p className="text-slate-400">Email đăng nhập</p>
                    <p className="font-semibold text-slate-900">{account.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Tên tài khoản</p>
                    <p className="font-medium text-slate-900">{account.name}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-slate-400">Trạng thái</p>
                      <Badge className={account.isActive ? 'bg-emerald-100 text-emerald-700 border-transparent' : 'bg-slate-100 text-slate-700 border-transparent'}>
                        {account.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-slate-400">Ngày tạo</p>
                      <p className="font-medium text-slate-900">{account.createdAt ? formatVNDateTime(account.createdAt) : '—'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4 py-10 text-center text-slate-500">
                  <p>Workshop này chưa có tài khoản đăng nhập.</p>
                  <Button onClick={() => setAccountDialogOpen(true)}>
                    <KeyRound className="h-4 w-4" />
                    <span>Tạo tài khoản</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SummaryMetric
            label="Tổng lượt quét"
            value={stats?.totalScans ?? 0}
            icon={QrCode}
            isLoading={isFetching}
            description="Tổng lượt check-in tại workshop"
          />
          <SummaryMetric
            label="Sinh viên duy nhất"
            value={stats?.uniqueStudents ?? 0}
            icon={Users}
            isLoading={isFetching}
            description="Số sinh viên unique tham gia"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="bg-white rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
            <DistributionChart data={departmentData} title="Khoa tham gia" />
          </div>

          <Card className="rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <CardHeader>
              <CardTitle>Lượt check-in gần nhất</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>MSSV</TableHead>
                    <TableHead>Lớp</TableHead>
                    <TableHead>Khoa</TableHead>
                    <TableHead>SĐT</TableHead>
                    <TableHead>Thời gian điểm danh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.recentCheckins ?? []).length > 0 ? (
                    data?.recentCheckins.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{item.student.fullName}</TableCell>
                        <TableCell className="font-mono text-blue-600">{item.student.studentCode}</TableCell>
                        <TableCell>{item.student.className || '—'}</TableCell>
                        <TableCell>{item.student.department || '—'}</TableCell>
                        <TableCell>{item.student.phone || '—'}</TableCell>
                        <TableCell>{formatVNDateTime(item.checkInTime)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                        Chưa có lượt check-in gần đây.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      <WorkshopAccountDialog
        open={accountDialogOpen}
        workshop={
          workshop
            ? {
                id: workshop.id,
                name: workshop.name,
                displayName: workshop.displayName,
                location: workshop.location,
                capacity: workshop.capacity,
                qrCode: workshop.qrCode,
                type: workshop.type,
                totalScans: stats?.totalScans ?? 0,
                uniqueStudents: stats?.uniqueStudents ?? 0,
                hasAccount: !!account,
                account,
              }
            : null
        }
        isSubmitting={isCreatingAccount}
        onOpenChange={setAccountDialogOpen}
        onSubmit={handleCreateAccount}
      />
    </main>
  )
}
