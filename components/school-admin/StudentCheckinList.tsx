'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Search, Filter, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatVNDateTime } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { customAxiosInstance } from '@/lib/axios-instance'

interface CheckinItem {
  id: string
  checkInTime: string
  durationMinutes: number | null
  status: 'active' | 'completed'
  student: {
    id: string
    studentCode: string
    fullName: string
    major: string | null
    department: string | null
    className: string | null
    year: number | null
  }
  booth: {
    id: string
    name: string
    business: string | null
  }
}

interface CheckinsResponse {
  items: CheckinItem[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

const PAGE_SIZE = 30

async function fetchCheckins(page: number): Promise<CheckinsResponse> {
  const res = await customAxiosInstance<any>(`/api/school-admin/checkins?page=${page}&pageSize=${PAGE_SIZE}`, {
    method: 'GET',
  })
  return (res as any).data
}

export function StudentCheckinList() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['school-admin', 'checkins', page],
    queryFn: () => fetchCheckins(page),
    refetchInterval: 30_000,
  })

  const items: CheckinItem[] = data?.items ?? []
  const total = data?.total ?? 0

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const q = searchTerm.toLowerCase()
      const matchSearch =
        !q ||
        c.student.studentCode.toLowerCase().includes(q) ||
        c.student.fullName.toLowerCase().includes(q) ||
        (c.student.className ?? '').toLowerCase().includes(q)
      const matchDept = !filterDept || c.student.department === filterDept
      const matchStatus = !filterStatus || c.status === filterStatus
      return matchSearch && matchDept && matchStatus
    })
  }, [items, searchTerm, filterDept, filterStatus])

  const uniqueDepts = useMemo(
    () => [...new Set(items.map((c) => c.student.department).filter(Boolean))],
    [items],
  )

  const handleExport = () => {
    if (filtered.length === 0) return
    const headers = ['MSSV', 'Tên sinh viên', 'Ngành', 'Khoa', 'Lớp', 'Gian hàng', 'Công ty', 'Thời gian check-in', 'Thời gian (phút)', 'TT']
    const rows = filtered.map((c) => [
      c.student.studentCode,
      c.student.fullName,
      c.student.major ?? '',
      c.student.department ?? '',
      c.student.className ?? '',
      c.booth.name,
      c.booth.business ?? '',
      c.checkInTime,
      c.durationMinutes ?? '',
      c.status === 'completed' ? 'Hoàn thành' : 'Đang thăm',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `checkins-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Không thể tải dữ liệu check-in. Vui lòng thử lại.
      </div>
    )
  }

  const completed = filtered.filter((c) => c.status === 'completed').length
  const active = filtered.filter((c) => c.status === 'active').length
  const avgDuration = filtered.length
    ? Math.round(filtered.reduce((s, c) => s + (c.durationMinutes ?? 0), 0) / filtered.length)
    : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold">Danh sách check-in sinh viên</h3>
          <p className="text-sm text-muted-foreground">
            Tổng{' '}
            <span className="font-semibold text-foreground">{total}</span> lượt check-in
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleExport}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Xuất CSV
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm theo MSSV, tên hoặc lớp..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterStatus === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus(null)}
        >
          <Filter className="h-3 w-3 mr-1" /> Tất cả TT
        </Button>
        <Button
          variant={filterStatus === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('completed')}
        >
          Hoàn thành
        </Button>
        <Button
          variant={filterStatus === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('active')}
        >
          Đang thăm
        </Button>
        <span className="text-muted-foreground self-center mx-1">|</span>
        <Button
          variant={filterDept === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterDept(null)}
        >
          Tất cả khoa
        </Button>
        {uniqueDepts.slice(0, 6).map((d) => (
          <Button
            key={d}
            variant={filterDept === d ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterDept(d!)}
          >
            {d}
          </Button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
          <p className="text-xs text-green-700 font-medium">Hoàn thành</p>
          <p className="text-2xl font-bold text-green-900">{completed}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
          <p className="text-xs text-blue-700 font-medium">Đang thăm</p>
          <p className="text-2xl font-bold text-blue-900">{active}</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-center">
          <p className="text-xs text-purple-700 font-medium">TB thời gian</p>
          <p className="text-2xl font-bold text-purple-900">{avgDuration} phút</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">MSSV</TableHead>
              <TableHead className="font-semibold">Họ tên</TableHead>
              <TableHead className="font-semibold">Khoa / Lớp</TableHead>
              <TableHead className="font-semibold">Ngành</TableHead>
              <TableHead className="font-semibold">Gian hàng</TableHead>
              <TableHead className="font-semibold">Thời gian</TableHead>
              <TableHead className="text-center font-semibold">Phút</TableHead>
              <TableHead className="text-center font-semibold">TT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-mono text-sm font-medium">
                    {c.student.studentCode}
                  </TableCell>
                  <TableCell className="font-medium">{c.student.fullName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{c.student.department ?? '—'}</div>
                    <div className="text-xs font-mono">{c.student.className ?? ''}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.student.major ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{c.booth.business ?? c.booth.name}</div>
                    <div className="text-xs text-muted-foreground">{c.booth.name}</div>
                  </TableCell>
                  <TableCell className="text-sm font-mono whitespace-nowrap">
                    {formatVNDateTime(c.checkInTime)}
                  </TableCell>
                  <TableCell className="text-sm text-center">
                    {c.durationMinutes ?? '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.status === 'completed' ? (
                      <div className="flex items-center justify-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-blue-600">
                        <Clock className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Không có kết quả phù hợp
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Trang {page} / {totalPages} ({total} bản ghi)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}


interface StudentCheckin {
  id: string
  mssv: string
  studentName: string
  major: string
  boothName: string
  checkInTime: string
  duration: number
  status: 'ongoing' | 'completed'
}

const SAMPLE_CHECKINS: StudentCheckin[] = [
  {
    id: '1',
    mssv: 'DUT20001',
    studentName: 'Nguyễn Văn A',
    major: 'Công nghệ thông tin',
    boothName: 'Google Vietnam',
    checkInTime: '09:15',
    duration: 12,
    status: 'completed',
  },
  {
    id: '2',
    mssv: 'DUT20002',
    studentName: 'Trần Thị B',
    major: 'Quản lý kinh doanh',
    boothName: 'Samsung Vietnam',
    checkInTime: '09:22',
    duration: 8,
    status: 'completed',
  },
  {
    id: '3',
    mssv: 'DUT20003',
    studentName: 'Lê Minh C',
    major: 'Kỹ thuật phần mềm',
    boothName: 'FPT Software',
    checkInTime: '09:35',
    duration: 15,
    status: 'completed',
  },
  {
    id: '4',
    mssv: 'DUT20004',
    studentName: 'Phạm Thúy D',
    major: 'Công nghệ thông tin',
    boothName: 'Viettel Solutions',
    checkInTime: '09:48',
    duration: 10,
    status: 'completed',
  },
  {
    id: '5',
    mssv: 'DUT20005',
    studentName: 'Hoàng Anh E',
    major: 'Nhân sự',
    boothName: 'Accenture Vietnam',
    checkInTime: '10:05',
    duration: 0,
    status: 'ongoing',
  },
]

export function StudentCheckinList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMajor, setFilterMajor] = useState<string | null>(null)
  const [filterBooth, setFilterBooth] = useState<string | null>(null)

  const filteredCheckins = useMemo(() => {
    return SAMPLE_CHECKINS.filter((checkin) => {
      const matchesSearch =
        checkin.mssv.toLowerCase().includes(searchTerm.toLowerCase()) ||
        checkin.studentName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesMajor = !filterMajor || checkin.major === filterMajor
      const matchesBooth = !filterBooth || checkin.boothName === filterBooth

      return matchesSearch && matchesMajor && matchesBooth
    })
  }, [searchTerm, filterMajor, filterBooth])

  const uniqueMajors = [...new Set(SAMPLE_CHECKINS.map((c) => c.major))]
  const uniqueBooths = [...new Set(SAMPLE_CHECKINS.map((c) => c.boothName))]

  const handleExport = () => {
    // Prepare CSV content
    const headers = ['MSSV', 'Tên sinh viên', 'Ngành', 'Gian hàng', 'Thời gian check-in', 'Thời gian tham gia (phút)']
    const rows = filteredCheckins.map((c) => [
      c.mssv,
      c.studentName,
      c.major,
      c.boothName,
      c.checkInTime,
      c.duration,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Download as CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `student-checkins-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Danh sách sinh viên check-in</h3>
        <Button
          size="sm"
          onClick={handleExport}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo MSSV hoặc tên sinh viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterMajor === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterMajor(null)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Tất cả ngành
          </Button>

          {uniqueMajors.map((major) => (
            <Button
              key={major}
              variant={filterMajor === major ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMajor(major)}
            >
              {major}
            </Button>
          ))}
        </div>

        {/* Booth Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterBooth === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterBooth(null)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Tất cả gian hàng
          </Button>

          {uniqueBooths.map((booth) => (
            <Button
              key={booth}
              variant={filterBooth === booth ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterBooth(booth)}
            >
              {booth}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Tổng: {filteredCheckins.length} sinh viên check-in
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">MSSV</TableHead>
              <TableHead className="font-semibold">Tên sinh viên</TableHead>
              <TableHead className="font-semibold">Ngành</TableHead>
              <TableHead className="font-semibold">Gian hàng</TableHead>
              <TableHead className="font-semibold">Thời gian</TableHead>
              <TableHead className="font-semibold">Thời gian tham gia</TableHead>
              <TableHead className="text-center font-semibold">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCheckins.length > 0 ? (
              filteredCheckins.map((checkin) => (
                <TableRow key={checkin.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-mono text-sm font-medium">{checkin.mssv}</TableCell>
                  <TableCell className="font-medium">{checkin.studentName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{checkin.major}</TableCell>
                  <TableCell className="text-sm">{checkin.boothName}</TableCell>
                  <TableCell className="text-sm font-mono">{formatVNDateTime(checkin.checkInTime)}</TableCell>
                  <TableCell className="text-sm">{checkin.duration} phút</TableCell>
                  <TableCell className="text-center">
                    {checkin.status === 'completed' ? (
                      <div className="flex items-center justify-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Hoàn thành</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-blue-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium">Đang thăm</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Không có kết quả phù hợp
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 font-medium">Hoàn thành</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {filteredCheckins.filter((c) => c.status === 'completed').length}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Đang thăm</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {filteredCheckins.filter((c) => c.status === 'ongoing').length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-700 font-medium">Trung bình thời gian</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">
            {Math.round(
              filteredCheckins.reduce((sum, c) => sum + c.duration, 0) / filteredCheckins.length || 0
            )}{' '}
            phút
          </p>
        </div>
      </div>
    </div>
  )
}
