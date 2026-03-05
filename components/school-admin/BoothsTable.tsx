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
import { Building2 } from 'lucide-react'

interface BoothsTableProps {
  booths: Booth[]
  isLoading?: boolean
}

export function BoothsTable({ booths, isLoading = false }: BoothsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Tổng quan gian hàng
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Đang tải gian hàng...</p>
          </div>
        ) : booths.length === 0 ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Không có gian hàng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên gian hàng</TableHead>
                  <TableHead>Công ty</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead className="text-right">Sinh viên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {booths.map((booth) => (
                  <TableRow key={booth.id}>
                    <TableCell className="font-medium">{booth.name}</TableCell>
                    <TableCell>{booth.company}</TableCell>
                    <TableCell>{booth.staffName}</TableCell>
                    <TableCell className="text-right font-semibold">{booth.visitorCount}</TableCell>
                    <TableCell>
                      <Badge
                        variant={booth.visitorCount > 30 ? 'default' : 'secondary'}
                        className="bg-primary/10 text-primary"
                      >
                        {booth.visitorCount > 30 ? 'Popular' : 'Active'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
