'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UNIT_TYPE_OPTIONS, getUnitMeta } from '@/lib/unit-meta'
import { cn, formatVNDateTime } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { customAxiosInstance } from '@/lib/axios-instance'
import type { UnitType } from '@/lib/types'

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
    type?: UnitType
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

interface StudentCheckinListProps {
  defaultTypeFilter?: UnitType | 'all'
  totalsByType?: {
    all: number
    booth: number
    workshop: number
    totnghiep: number
  }
}

function typeBadge(type?: UnitType) {
  if (!type) {
    return {
      label: 'Booth',
      className: 'bg-blue-100 text-blue-700 border-transparent',
    }
  }

  const meta = getUnitMeta(type)
  return {
    label: meta.shortTitle,
    className: meta.badgeClass,
  }
}

export function StudentCheckinList({ defaultTypeFilter = 'all', totalsByType }: StudentCheckinListProps) {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<UnitType | 'all'>(defaultTypeFilter)

  useEffect(() => {
    setFilterType(defaultTypeFilter)
  }, [defaultTypeFilter])

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
      const matchType = filterType === 'all' || c.booth.type === filterType
      return matchSearch && matchDept && matchType
    })
  }, [items, searchTerm, filterDept, filterType])

  const summaryTotal = useMemo(() => {
    if (!totalsByType) return total
    if (filterType === 'all') return totalsByType.all
    return totalsByType[filterType]
  }, [filterType, total, totalsByType])

  const uniqueDepts = useMemo(
    () => [...new Set(items.map((c) => c.student.department).filter(Boolean))],
    [items],
  )

  const handleExport = () => {
    if (filtered.length === 0) return
    const headers = ['MSSV', 'Tên sinh viên', 'Khoa', 'Lớp', 'Gian hàng', 'Công ty', 'Thời gian check-in']
    const rows = filtered.map((c) => [
      c.student.studentCode,
      c.student.fullName,
      c.student.department ?? '',
      c.student.className ?? '',
      c.booth.name,
      c.booth.business ?? '',
      c.checkInTime,
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold">Danh sách check-in sinh viên</h3>
          <p className="text-sm text-muted-foreground">
            Tổng{' '}
            <span className="font-semibold text-foreground">{summaryTotal}</span> lượt check-in
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
      <div className="flex flex-wrap items-center gap-3">

        {/* Type filter */}
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {(['all', ...UNIT_TYPE_OPTIONS] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                filterType === t
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              {t === 'all' ? 'Tất cả loại' : getUnitMeta(t).shortTitle}
            </button>
          ))}
        </div>

        {/* Department filter — Select dropdown */}
        <Select
          value={filterDept ?? '__all__'}
          onValueChange={(v) => setFilterDept(v === '__all__' ? null : v)}
        >
          <SelectTrigger className="h-9 w-52 rounded-xl border-slate-200 bg-white text-sm font-medium shadow-none">
            <SelectValue placeholder="Lọc theo khoa..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tất cả khoa</SelectItem>
            {uniqueDepts.map((d) => (
              <SelectItem key={d!} value={d!}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">MSSV</TableHead>
              <TableHead className="font-semibold">Họ tên</TableHead>
              <TableHead className="font-semibold">Khoa</TableHead>
              <TableHead className="font-semibold">Lớp</TableHead>
              <TableHead className="font-semibold">Đơn vị</TableHead>
              <TableHead className="font-semibold">Thời gian</TableHead>
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
                    {c.student.department ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {c.student.className ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{c.booth.business ?? c.booth.name}</div>
                      <Badge className={cn(typeBadge(c.booth.type).className)}>
                        {typeBadge(c.booth.type).label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{c.booth.name}</div>
                  </TableCell>
                  <TableCell className="text-sm font-mono whitespace-nowrap">
                    {formatVNDateTime(c.checkInTime)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
