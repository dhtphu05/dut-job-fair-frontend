'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { formatVNDateTime } from '@/lib/utils'
import type { WorkshopAttendanceItem } from '@/lib/types'
import { Trash2, Users } from 'lucide-react'

interface WorkshopAttendanceTableProps {
  items: WorkshopAttendanceItem[]
  isLoading?: boolean
  isDeleting?: boolean
  onDelete?: (studentCode: string) => void
  title?: string
  unitColumnLabel?: string
  unitLabel?: string
  emptyDescription?: string
}

export function WorkshopAttendanceTable({
  items,
  isLoading = false,
  isDeleting = false,
  onDelete,
  title = 'Danh sách điểm danh hội thảo',
  unitColumnLabel = 'Tên hội thảo',
  unitLabel = 'hội thảo',
  emptyDescription = 'Danh sách sẽ tự cập nhật khi sinh viên check-in vào hội thảo này.',
}: WorkshopAttendanceTableProps) {
  const [selectedItem, setSelectedItem] = useState<WorkshopAttendanceItem | null>(null)

  const formatTimestamp = (value: string) => {
    return value.includes('T') || value.endsWith('Z') ? formatVNDateTime(value) : value
  }

  const sortedItems = [...items].sort((a, b) => {
    const aTime = new Date(a.checkInTime.replace(' ', 'T')).getTime()
    const bTime = new Date(b.checkInTime.replace(' ', 'T')).getTime()

    if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
      return b.stt - a.stt
    }

    return bTime - aTime
  })

  return (
    <>
      <Card className="rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Users className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-14 rounded-2xl bg-slate-50 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                <Users className="h-10 w-10 text-blue-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Chưa có sinh viên điểm danh</h3>
              <p className="mt-2 text-sm text-slate-500">
                {emptyDescription}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="max-h-[68vh] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-slate-50">
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>{unitColumnLabel}</TableHead>
                      <TableHead>Họ và tên</TableHead>
                      <TableHead>MSSV</TableHead>
                      <TableHead>Lớp</TableHead>
                      <TableHead>Khoa</TableHead>
                      <TableHead>SĐT</TableHead>
                      <TableHead>Thời gian điểm danh</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItems.map((item, index) => (
                      <TableRow key={`${item.studentCode}-${item.stt}`} className="hover:bg-slate-50/80">
                        <TableCell className="font-semibold text-slate-500">{index + 1}</TableCell>
                        <TableCell className="max-w-[260px] whitespace-normal font-medium text-slate-700">
                          {item.unitName || item.workshopName || item.totnghiepName || '—'}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">{item.fullName}</TableCell>
                        <TableCell className="font-mono text-sm text-blue-600">{item.studentCode}</TableCell>
                        <TableCell>{item.className || '—'}</TableCell>
                        <TableCell>{item.department || '—'}</TableCell>
                        <TableCell>{item.phone || '—'}</TableCell>
                        <TableCell>{formatTimestamp(item.checkInTime)}</TableCell>
                        <TableCell className="text-right">
                          {onDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700"
                              onClick={() => setSelectedItem(item)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Xoá</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá sinh viên</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedItem ? (
                <>
                  Bạn có chắc muốn xoá sinh viên này khỏi danh sách điểm danh {unitLabel} không?
                  <br />
                  Ghi nhận này sẽ bị xoá khỏi danh sách điểm danh {unitLabel}.
                  <br />
                  <br />
                  Họ và tên: <strong>{selectedItem.fullName}</strong>
                  <br />
                  MSSV: <strong>{selectedItem.studentCode}</strong>
                  <br />
                  {unitColumnLabel}: <strong>{selectedItem.unitName || selectedItem.workshopName || selectedItem.totnghiepName || '—'}</strong>
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              disabled={isDeleting || !selectedItem}
              onClick={() => {
                if (selectedItem) {
                  onDelete?.(selectedItem.studentCode)
                }
              }}
            >
              Xác nhận xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
