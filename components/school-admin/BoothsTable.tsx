import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Booth } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Building2 } from 'lucide-react'

interface BoothsTableProps {
  booths: Booth[]
  isLoading?: boolean
  title?: string
}

function getTypeBadge(type?: Booth['type']) {
  if (type === 'workshop') {
    return {
      label: 'Hội thảo',
      className: 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-transparent',
    }
  }

  return {
    label: 'Booth',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-transparent',
  }
}

export function BoothsTable({ booths, isLoading = false, title = 'Tổng quan đơn vị tham gia' }: BoothsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4 py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 w-full bg-slate-50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : booths.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Building2 className="h-12 w-12 text-blue-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa có gian hàng nào</h3>
            <p className="text-slate-500 max-w-[280px]">
              Dữ liệu đang được cập nhật. Vui lòng quay lại sau hoặc liên hệ quản trị viên.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {booths.map((b) => (
                <div key={b.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="font-black text-blue-600 uppercase tracking-tighter">{b.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest', getTypeBadge(b.type).className)}>
                        {getTypeBadge(b.type).label}
                      </Badge>
                      <Badge
                        variant={b.visitorCount > 30 ? 'default' : 'secondary'}
                        className={cn(
                          "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest border-0",
                          b.visitorCount > 30 ? "bg-orange-500 text-white" : "bg-teal-500 text-white"
                        )}
                      >
                        {b.visitorCount > 30 ? 'Popular' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{b.company}</h4>
                    <p className="text-sm text-slate-500 font-medium">
                      {b.type === 'workshop' ? 'Địa điểm' : 'Nhân viên'}: {b.type === 'workshop' ? (b.position || '---') : (b.staffName || '---')}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lượt ghé thăm</span>
                    <span className="text-xl font-black text-slate-900">{b.visitorCount}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden lg:block overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-bold text-slate-900">Tên đơn vị</TableHead>
                      <TableHead className="font-bold text-slate-900">Loại</TableHead>
                      <TableHead className="font-bold text-slate-900">Tên hiển thị</TableHead>
                      <TableHead className="font-bold text-slate-900">Nhân viên / Địa điểm</TableHead>
                      <TableHead className="font-bold text-slate-900 text-right">Lượt quét</TableHead>
                      <TableHead className="font-bold text-slate-900 text-center">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {booths.map((booth) => (
                      <TableRow key={booth.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-bold text-blue-600">{booth.name}</TableCell>
                        <TableCell>
                          <Badge className={cn('rounded-full font-bold text-[10px] uppercase tracking-widest', getTypeBadge(booth.type).className)}>
                            {getTypeBadge(booth.type).label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{booth.company}</TableCell>
                        <TableCell className="text-slate-500 font-medium">
                          {booth.type === 'workshop' ? (booth.position || '---') : (booth.staffName || '---')}
                        </TableCell>
                        <TableCell className="text-right font-black text-lg text-slate-900">{booth.visitorCount}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={booth.visitorCount > 30 ? 'default' : 'secondary'}
                            className={cn(
                              "rounded-full font-bold text-[10px] uppercase tracking-widest",
                              booth.visitorCount > 30 ? "bg-orange-100 text-orange-600 hover:bg-orange-100" : "bg-teal-100 text-teal-600 hover:bg-teal-100"
                            )}
                          >
                            {booth.visitorCount > 30 ? 'Popular' : 'Active'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
