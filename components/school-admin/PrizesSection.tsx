'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Download, Trophy, Users } from 'lucide-react'
import { customAxiosInstance } from '@/lib/axios-instance'
import { formatVNDateTime } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ── Types ─────────────────────────────────────────────────────────────────────
interface EligibleStudent {
  studentCode: string
  fullName: string
  major: string | null
  department: string | null
  className: string | null
  firstCheckin?: string
  boothCount?: number
}

interface PrizeData {
  id: string
  name: string
  type: 'early_bird' | 'booth_special' | 'lucky_draw'
  description: string
  quantity: number
  qualificationRule: string
  eligible: EligibleStudent[]
  eligibleCount: number
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchPrizes(): Promise<PrizeData[]> {
  const res = await customAxiosInstance<any>('/api/school-admin/prizes', { method: 'GET' })
  return (res as any).data
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function prizeTypeColor(type: string) {
  switch (type) {
    case 'early_bird':    return 'bg-yellow-100 text-yellow-800'
    case 'lucky_draw':    return 'bg-purple-100 text-purple-800'
    case 'booth_special': return 'bg-blue-100 text-blue-800'
    default:              return 'bg-gray-100 text-gray-800'
  }
}

function prizeTypeLabel(type: string) {
  switch (type) {
    case 'early_bird':    return 'Sơ cấp'
    case 'lucky_draw':    return 'Xổ số may mắn'
    case 'booth_special': return 'Tích cực'
    default:              return type
  }
}

function exportCsv(prize: PrizeData) {
  const extraHeaders = prize.type === 'early_bird'
    ? ['Giờ check-in đầu tiên']
    : prize.type === 'booth_special'
      ? ['Số gian hàng']
      : []
  const headers = ['#', 'MSSV', 'Họ tên', 'Khoa', 'Lớp', 'Ngành', ...extraHeaders]
  const rows = prize.eligible.map((s, i) => [
    String(i + 1),
    s.studentCode,
    s.fullName,
    s.department ?? '',
    s.className ?? '',
    s.major ?? '',
    ...(prize.type === 'early_bird'
      ? [s.firstCheckin ? formatVNDateTime(s.firstCheckin) : '']
      : prize.type === 'booth_special'
        ? [String(s.boothCount ?? 0)]
        : []),
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${prize.id}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

// ── PrizeCard ─────────────────────────────────────────────────────────────────
function PrizeCard({ prize }: { prize: PrizeData }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="p-4 flex items-start justify-between hover:bg-muted/40 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{prize.name}</h4>
            <Badge className={prizeTypeColor(prize.type)}>{prizeTypeLabel(prize.type)}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{prize.description}</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <span>
              <span className="text-muted-foreground">Điều kiện: </span>
              <span className="font-medium">{prize.qualificationRule}</span>
            </span>
            <span className="flex items-center gap-1 text-green-700 font-semibold">
              <Users className="h-3 w-3" />
              {prize.eligibleCount} sinh viên đủ điều kiện
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {open && (
            <Button variant="outline" size="sm" onClick={() => exportCsv(prize)} className="text-xs h-7">
              <Download className="h-3 w-3 mr-1" /> CSV
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            className="h-7 text-xs"
          >
            {open ? <><ChevronUp className="h-4 w-4 mr-1" /> Ẩn</> : <><ChevronDown className="h-4 w-4 mr-1" /> Xem danh sách</>}
          </Button>
        </div>
      </div>

      {/* Expandable student table */}
      {open && (
        <div className="border-t">
          {prize.eligible.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">
              Chưa có sinh viên đủ điều kiện
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/90">
                  <TableRow>
                    <TableHead className="text-xs w-10">#</TableHead>
                    <TableHead className="text-xs">MSSV</TableHead>
                    <TableHead className="text-xs">Họ tên</TableHead>
                    <TableHead className="text-xs">Khoa / Lớp</TableHead>
                    <TableHead className="text-xs">Ngành</TableHead>
                    {prize.type === 'early_bird' && (
                      <TableHead className="text-xs">Giờ check-in</TableHead>
                    )}
                    {prize.type === 'booth_special' && (
                      <TableHead className="text-xs text-right">Gian hàng đã thăm</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prize.eligible.map((s, idx) => (
                    <TableRow key={s.studentCode} className="text-xs">
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono font-medium">{s.studentCode}</TableCell>
                      <TableCell className="font-medium">{s.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.department ?? '—'}
                        {s.className && (
                          <span className="ml-1 text-foreground font-semibold">· {s.className}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.major ?? '—'}</TableCell>
                      {prize.type === 'early_bird' && (
                        <TableCell className="text-blue-700 font-semibold tabular-nums">
                          {s.firstCheckin
                            ? new Date(s.firstCheckin).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })
                            : '—'}
                        </TableCell>
                      )}
                      {prize.type === 'booth_special' && (
                        <TableCell className="text-right font-bold text-blue-700">
                          {s.boothCount}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function PrizesSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['school-admin', 'prizes'],
    queryFn: fetchPrizes,
    staleTime: 60_000,
  })

  const prizes: PrizeData[] = data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Quản lý giải thưởng
        </h3>
        <span className="text-xs text-muted-foreground">
          {prizes.length > 0 ? `${prizes.length} giải · Nhấn "Xem danh sách" để mở rộng` : ''}
        </span>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-destructive py-8 text-sm">
          Không thể tải dữ liệu giải thưởng. Vui lòng thử lại.
        </p>
      )}

      {!isLoading && !isError && prizes.length > 0 && (
        <div className="space-y-3">
          {prizes.map((prize) => (
            <PrizeCard key={prize.id} prize={prize} />
          ))}
        </div>
      )}

      {!isLoading && !isError && prizes.length === 0 && (
        <p className="text-center text-muted-foreground py-8 text-sm">Chưa có giải thưởng nào.</p>
      )}
    </div>
  )
}
