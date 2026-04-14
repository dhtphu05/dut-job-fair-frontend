'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { WorkshopManagementItem } from '@/lib/types'
import { formatVNDateTime } from '@/lib/utils'
import { Eye, KeyRound, Plus, Presentation } from 'lucide-react'

interface WorkshopManagementTableProps {
  items: WorkshopManagementItem[]
  isLoading?: boolean
  onManageAccount: (item: WorkshopManagementItem) => void
  onCreateWorkshop?: () => void
}

export function WorkshopManagementTable({
  items,
  isLoading = false,
  onManageAccount,
  onCreateWorkshop,
}: WorkshopManagementTableProps) {
  return (
    <Card className="rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            Quản lý workshop
          </div>
          {onCreateWorkshop && (
            <Button size="sm" onClick={onCreateWorkshop} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20">
              <Plus className="mr-1.5 h-4 w-4" />
              Tạo Workshop Mới
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 rounded-2xl bg-slate-50 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Chưa có workshop nào trong hệ thống.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Tên hội thảo</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead className="text-right">Tổng lượt quét</TableHead>
                  <TableHead className="text-right">Sinh viên duy nhất</TableHead>
                  <TableHead>Tài khoản</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-normal">
                      <div className="font-semibold text-slate-900">{item.displayName || item.name}</div>
                      <div className="text-xs text-slate-400">{item.name}</div>
                    </TableCell>
                    <TableCell>{item.location || 'Chưa cập nhật'}</TableCell>
                    <TableCell className="text-right font-semibold">{item.totalScans}</TableCell>
                    <TableCell className="text-right">{item.uniqueStudents}</TableCell>
                    <TableCell className="whitespace-normal">
                      {item.hasAccount && item.account ? (
                        <div>
                          <div className="font-medium text-slate-900">{item.account.email}</div>
                          <div className="text-xs text-slate-400">
                            {item.account.createdAt ? formatVNDateTime(item.account.createdAt) : ''}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">Chưa có tài khoản</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.hasAccount ? (
                        <Badge
                          className={
                            item.account?.isActive
                              ? 'bg-emerald-100 text-emerald-700 border-transparent'
                              : 'bg-slate-100 text-slate-700 border-transparent'
                          }
                        >
                          {item.account?.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 border-transparent">
                          Chưa có tài khoản
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/school-admin/workshops/${item.id}`}>
                            <Eye className="h-4 w-4" />
                            <span>Xem chi tiết</span>
                          </Link>
                        </Button>
                        {!item.hasAccount ? (
                          <Button size="sm" onClick={() => onManageAccount(item)}>
                            <KeyRound className="h-4 w-4" />
                            <span>Tạo tài khoản</span>
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => onManageAccount(item)}>
                            <KeyRound className="h-4 w-4" />
                            <span>Đổi thông tin đăng nhập</span>
                          </Button>
                        )}
                      </div>
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
