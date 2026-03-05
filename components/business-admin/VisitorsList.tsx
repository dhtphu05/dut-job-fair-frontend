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
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Đang tải khách...</p>
          </div>
        ) : filteredVisitors.length === 0 ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">
              {visitors.length === 0 ? 'Chưa có khách' : 'Không có khách phù hợp'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã SV</TableHead>
                  <TableHead>Tên đầy đủ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Điện thoại</TableHead>
                  <TableHead>Ngành</TableHead>
                  <TableHead>Năm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell className="font-medium">{visitor.studentCode}</TableCell>
                    <TableCell>{visitor.fullName}</TableCell>
                    <TableCell className="text-sm">{visitor.email}</TableCell>
                    <TableCell>{visitor.phone}</TableCell>
                    <TableCell>{visitor.major}</TableCell>
                    <TableCell className="text-center">Year {visitor.year}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
