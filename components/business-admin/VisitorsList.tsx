import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Visitor } from '@/lib/types'
import { Users, Download } from 'lucide-react'
import { useState } from 'react'

interface VisitorsListProps {
  visitors: Visitor[]
  isLoading?: boolean
}

export function VisitorsList({ visitors, isLoading = false }: VisitorsListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredVisitors = visitors.filter(
    (visitor) =>
      visitor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visitor.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.studentCode.includes(searchTerm)
  )

  const handleExport = () => {
    const csv = [
      ['Mã SV', 'Tên đầy đủ', 'Email', 'Điện thoại', 'Ngành', 'Năm'].join(','),
      ...filteredVisitors.map((v) =>
        [v.studentCode, v.fullName, v.email, v.phone, v.major, v.year].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `visitors-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Khách thăm gian hàng
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          disabled={filteredVisitors.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Xuất CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="Tìm theo tên, email hoặc mã SV..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4 py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 w-full bg-slate-50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredVisitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Users className="h-12 w-12 text-blue-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa có ai ở đây cả</h3>
            <p className="text-slate-500 max-w-[280px]">
              {visitors.length === 0 
                ? 'Đừng lo! Hãy bắt đầu quét mã QR để ghi nhận những khách tham quan đầu tiên.' 
                : 'Không tìm thấy sinh viên nào khớp với tìm kiếm của bạn.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {filteredVisitors.map((v) => (
                <div key={v.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="font-black text-blue-600">{v.studentCode}</span>
                    <span className="text-[10px] bg-white border px-2 py-0.5 rounded-full font-bold text-slate-400 uppercase tracking-widest">
                      Year {v.year}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{v.fullName}</h4>
                    <p className="text-sm text-slate-500 font-medium">{v.major}</p>
                  </div>
                  <div className="pt-2 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {v.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      {v.phone}
                    </div>
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
                      <TableHead className="font-bold text-slate-900">Mã SV</TableHead>
                      <TableHead className="font-bold text-slate-900">Tên đầy đủ</TableHead>
                      <TableHead className="font-bold text-slate-900">Email</TableHead>
                      <TableHead className="font-bold text-slate-900">Điện thoại</TableHead>
                      <TableHead className="font-bold text-slate-900">Ngành</TableHead>
                      <TableHead className="font-bold text-slate-900 text-center">Năm</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisitors.map((visitor) => (
                      <TableRow key={visitor.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-bold text-blue-600">{visitor.studentCode}</TableCell>
                        <TableCell className="font-semibold">{visitor.fullName}</TableCell>
                        <TableCell className="text-slate-500">{visitor.email}</TableCell>
                        <TableCell className="text-slate-500">{visitor.phone}</TableCell>
                        <TableCell className="font-medium text-slate-700">{visitor.major}</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-500">
                            Năm {visitor.year}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {filteredVisitors.length > 0 && (
          <div className="text-sm text-muted-foreground pt-4">
            Showing {filteredVisitors.length} of {visitors.length} visitors
          </div>
        )}
      </CardContent>
    </Card>
  )
}
