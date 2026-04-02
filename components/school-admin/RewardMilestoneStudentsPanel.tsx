'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, RefreshCw, Gift, Users, Clock3, CheckCircle2, Ban, OctagonX, Loader2 } from 'lucide-react'
import { useRewardMilestones } from '@/hooks/useRewardMilestones'
import {
  RewardMilestoneStudentFilterStatus,
  RewardMilestoneStudentItem,
  RewardMilestoneStudentStatus,
  useRewardMilestoneStudents,
} from '@/hooks/useRewardMilestoneStudents'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatVNDateTime } from '@/lib/utils'

const PAGE_SIZE = 20

const STATUS_TABS: Array<{
  value: RewardMilestoneStudentFilterStatus
  label: string
}> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'eligible', label: 'Đủ điều kiện' },
  { value: 'pending', label: 'Đang chờ nhận' },
  { value: 'claimed', label: 'Đã nhận quà' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'cancelled', label: 'Đã hủy' },
]

function formatNullableDateTime(value?: string | null) {
  if (!value) return 'Chưa có'

  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return formatVNDateTime(value)
  } catch {
    return value
  }
}

function getStatusMeta(status: RewardMilestoneStudentStatus) {
  switch (status) {
    case 'eligible':
      return {
        label: 'Đủ điều kiện',
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
      }
    case 'pending':
      return {
        label: 'Đang chờ nhận',
        className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
      }
    case 'claimed':
      return {
        label: 'Đã nhận quà',
        className: 'bg-green-100 text-green-700 hover:bg-green-100',
      }
    case 'expired':
      return {
        label: 'Hết hạn',
        className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
      }
    case 'cancelled':
      return {
        label: 'Đã hủy',
        className: 'bg-rose-100 text-rose-700 hover:bg-rose-100',
      }
    default:
      return {
        label: 'Không xác định',
        className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
      }
  }
}

function SummaryCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string
  value: number
  icon: React.ReactNode
  tone: string
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </div>
          <div className={`rounded-xl p-2 ${tone}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function StudentDetails({ item }: { item: RewardMilestoneStudentItem }) {
  return (
    <div className="space-y-2 min-w-0">
      <div>
        <p className="font-semibold">{item.student.fullName}</p>
        <p className="font-mono text-sm text-muted-foreground">{item.student.studentCode}</p>
      </div>
      <div className="text-sm text-muted-foreground space-y-1 whitespace-normal">
        <p>{item.student.email || item.student.phone || 'Chưa có email hoặc số điện thoại'}</p>
        <p>
          {item.student.major || 'Chưa có ngành'}
          {' • '}
          {item.student.department || 'Chưa có khoa'}
        </p>
        <p>
          {item.student.className || 'Chưa có lớp'}
          {' • '}
          Năm {item.student.year ?? '—'}
        </p>
      </div>
    </div>
  )
}

export function RewardMilestoneStudentsPanel() {
  const { data: milestones = [], isLoading: milestonesLoading, isError: milestonesError } = useRewardMilestones()

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('')
  const [status, setStatus] = useState<RewardMilestoneStudentFilterStatus>('all')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    if (milestones.length === 0) {
      setSelectedMilestoneId('')
      return
    }

    const stillExists = milestones.some((milestone) => milestone.id === selectedMilestoneId)
    if (stillExists) return

    const preferred = milestones.find((milestone) => milestone.isActive) ?? milestones[0]
    setSelectedMilestoneId(preferred.id)
  }, [milestones, selectedMilestoneId])

  useEffect(() => {
    setPage(1)
  }, [selectedMilestoneId, status, debouncedSearch])

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useRewardMilestoneStudents(selectedMilestoneId || null, {
    status,
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
  })

  const summaryItems = useMemo(() => {
    const summary = data?.summary
    const totalAll =
      (summary?.totalEligible ?? 0) +
      (summary?.totalPending ?? 0) +
      (summary?.totalClaimed ?? 0) +
      (summary?.totalExpired ?? 0) +
      (summary?.totalCancelled ?? 0)

    return [
      {
        key: 'all',
        title: 'Tất cả trạng thái',
        value: totalAll,
        icon: <Gift className="h-5 w-5 text-violet-700" />,
        tone: 'bg-violet-50',
      },
      {
        key: 'eligible',
        title: 'Đủ điều kiện',
        value: summary?.totalEligible ?? 0,
        icon: <Users className="h-5 w-5 text-blue-700" />,
        tone: 'bg-blue-50',
      },
      {
        key: 'pending',
        title: 'Đang chờ nhận',
        value: summary?.totalPending ?? 0,
        icon: <Clock3 className="h-5 w-5 text-amber-700" />,
        tone: 'bg-amber-50',
      },
      {
        key: 'claimed',
        title: 'Đã nhận quà',
        value: summary?.totalClaimed ?? 0,
        icon: <CheckCircle2 className="h-5 w-5 text-green-700" />,
        tone: 'bg-green-50',
      },
      {
        key: 'expired',
        title: 'Hết hạn',
        value: summary?.totalExpired ?? 0,
        icon: <Ban className="h-5 w-5 text-slate-700" />,
        tone: 'bg-slate-50',
      },
      {
        key: 'cancelled',
        title: 'Đã hủy',
        value: summary?.totalCancelled ?? 0,
        icon: <OctagonX className="h-5 w-5 text-rose-700" />,
        tone: 'bg-rose-50',
      },
    ]
  }, [data?.summary])

  const currentMilestone = milestones.find((milestone) => milestone.id === selectedMilestoneId)
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1
  const items = data?.items ?? []

  if (milestonesLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (milestonesError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Không thể tải danh sách mốc quà. Vui lòng thử lại.
      </div>
    )
  }

  if (milestones.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-12 text-center">
          <Gift className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Chưa có mốc quà nào</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo mốc quà trong mục `Mốc quà` trước khi theo dõi danh sách sinh viên theo mốc quà.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-blue-600" />
              Sinh viên theo mốc quà
            </CardTitle>
            <CardDescription>
              Theo dõi danh sách sinh viên đủ điều kiện, đang chờ nhận, đã nhận và lịch sử claim theo từng mốc quà.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:min-w-64">
              <Select value={selectedMilestoneId} onValueChange={setSelectedMilestoneId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn mốc quà" />
                </SelectTrigger>
                <SelectContent>
                  {milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.name} ({milestone.requiredBooths} gian hàng)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={() => void refetch()} disabled={!selectedMilestoneId || isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </CardHeader>

        {currentMilestone && (
          <CardContent className="pt-0">
            <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-white to-slate-50 p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                      {currentMilestone.requiredBooths} gian hàng
                    </Badge>
                    <Badge
                      className={
                        currentMilestone.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                      }
                    >
                      {currentMilestone.isActive ? 'Đang hoạt động' : 'Đang tắt'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{currentMilestone.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentMilestone.description || 'Chưa có mô tả cho mốc quà này.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-white px-4 py-3 text-sm">
                  <p className="text-muted-foreground">Tổng kết quả</p>
                  <p className="text-xl font-semibold">{data?.total ?? 0} sinh viên trong bộ lọc hiện tại</p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {summaryItems.map((item) => (
          <SummaryCard
            key={item.key}
            title={item.title}
            value={item.value}
            icon={item.icon}
            tone={item.tone}
          />
        ))}
      </div>

      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <Tabs value={status} onValueChange={(value) => setStatus(value as RewardMilestoneStudentFilterStatus)}>
              <TabsList className="h-auto w-full flex-nowrap justify-start gap-2 overflow-x-auto rounded-xl bg-transparent p-0 pb-1">
                {STATUS_TABS.map((tab) => {
                  const totalAll =
                    (data?.summary.totalEligible ?? 0) +
                    (data?.summary.totalPending ?? 0) +
                    (data?.summary.totalClaimed ?? 0) +
                    (data?.summary.totalExpired ?? 0) +
                    (data?.summary.totalCancelled ?? 0)
                  const count =
                    tab.value === 'all'
                      ? totalAll
                      : tab.value === 'eligible'
                        ? data?.summary.totalEligible ?? 0
                        : tab.value === 'pending'
                          ? data?.summary.totalPending ?? 0
                          : tab.value === 'claimed'
                            ? data?.summary.totalClaimed ?? 0
                            : tab.value === 'expired'
                              ? data?.summary.totalExpired ?? 0
                              : data?.summary.totalCancelled ?? 0

                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="h-10 shrink-0 rounded-full border border-border bg-white px-4 data-[state=active]:border-blue-200 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                    >
                      {tab.label}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {count}
                      </span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>

            <div className="relative w-full xl:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo MSSV hoặc họ tên..."
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              Không thể tải danh sách sinh viên theo mốc quà. Vui lòng thử lại.
            </div>
          )}

          {!isLoading && !isError && (
            <>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-medium text-foreground">{data?.total ?? 0}</span> sinh viên
                  {debouncedSearch && (
                    <span>
                      {' '}
                      khớp với từ khóa <span className="font-medium text-foreground">{debouncedSearch}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isFetching && (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang cập nhật...
                    </span>
                  )}
                  <span>Trang {data?.page ?? 1} / {totalPages}</span>
                </div>
              </div>

              <div className="grid gap-3 md:hidden">
                {items.length > 0 ? (
                  items.map((item) => {
                    const statusMeta = getStatusMeta(item.status)

                    return (
                      <div
                        key={`${item.student.id}-${item.status}-${item.claim?.id || 'eligible'}-mobile`}
                        className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <StudentDetails item={item} />
                            <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/30 p-3 text-center text-sm">
                            <div>
                              <p className="text-muted-foreground">Đã quét</p>
                              <p className="font-semibold">{item.checkedInBooths}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Yêu cầu</p>
                              <p className="font-semibold">{item.requiredBooths}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Còn thiếu</p>
                              <p className="font-semibold">{item.remainingBooths}</p>
                            </div>
                          </div>

                          <div className="rounded-xl border border-border/70 bg-slate-50 p-3 text-sm">
                            {item.claim ? (
                              <div className="space-y-1">
                                <p>
                                  <span className="text-muted-foreground">Mã claim:</span>{' '}
                                  <span className="font-mono">{item.claim.requestCode}</span>
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Tạo lúc:</span>{' '}
                                  {formatNullableDateTime(item.claim.requestedAt)}
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Hết hạn:</span>{' '}
                                  {formatNullableDateTime(item.claim.expiresAt)}
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Đã nhận:</span>{' '}
                                  {formatNullableDateTime(item.claim.claimedAt)}
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Xác nhận bởi:</span>{' '}
                                  {item.claim.confirmedBy?.name || 'Chưa có'}
                                </p>
                              </div>
                            ) : (
                              <p className="text-muted-foreground">
                                Chưa có claim. Sinh viên đang ở nhóm đủ điều kiện.
                              </p>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Trường:</span>{' '}
                            {item.student.school || 'Chưa có dữ liệu'}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Không có sinh viên phù hợp với mốc quà và bộ lọc hiện tại.
                  </div>
                )}
              </div>

              <div className="hidden overflow-x-auto rounded-lg border border-border/50 md:block">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">Sinh viên</TableHead>
                      <TableHead className="font-semibold">Trạng thái</TableHead>
                      <TableHead className="font-semibold">Tiến độ gian hàng</TableHead>
                      <TableHead className="font-semibold">Thông tin claim</TableHead>
                      <TableHead className="font-semibold">Trường</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length > 0 ? (
                      items.map((item) => {
                        const statusMeta = getStatusMeta(item.status)

                        return (
                          <TableRow key={`${item.student.id}-${item.status}-${item.claim?.id || 'eligible'}`}>
                            <TableCell className="align-top whitespace-normal">
                              <StudentDetails item={item} />
                            </TableCell>
                            <TableCell className="align-top">
                              <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                            </TableCell>
                            <TableCell className="align-top whitespace-normal">
                              <div className="space-y-1 text-sm">
                                <p>
                                  <span className="text-muted-foreground">Đã check-in:</span>{' '}
                                  <span className="font-semibold">{item.checkedInBooths}</span>
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Yêu cầu:</span>{' '}
                                  <span className="font-semibold">{item.requiredBooths}</span>
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Còn thiếu:</span>{' '}
                                  <span className="font-semibold">{item.remainingBooths}</span>
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="align-top whitespace-normal">
                              {item.claim ? (
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <span className="text-muted-foreground">Mã claim:</span>{' '}
                                    <span className="font-mono">{item.claim.requestCode}</span>
                                  </p>
                                  <p>
                                    <span className="text-muted-foreground">Tạo lúc:</span>{' '}
                                    {formatNullableDateTime(item.claim.requestedAt)}
                                  </p>
                                  <p>
                                    <span className="text-muted-foreground">Hết hạn:</span>{' '}
                                    {formatNullableDateTime(item.claim.expiresAt)}
                                  </p>
                                  <p>
                                    <span className="text-muted-foreground">Đã nhận:</span>{' '}
                                    {formatNullableDateTime(item.claim.claimedAt)}
                                  </p>
                                  <p>
                                    <span className="text-muted-foreground">Xác nhận bởi:</span>{' '}
                                    {item.claim.confirmedBy?.name || 'Chưa có'}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Chưa có claim. Sinh viên đang ở nhóm đủ điều kiện.
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="align-top whitespace-normal text-sm text-muted-foreground">
                              {item.student.school || 'Chưa có dữ liệu'}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                          Không có sinh viên phù hợp với mốc quà và bộ lọc hiện tại.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {(items.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0)}-
                  {(page - 1) * PAGE_SIZE + items.length} trên {data?.total ?? 0} kết quả
                </p>

                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                  <Button variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => current - 1)}>
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!data?.hasMore || isFetching}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
