'use client'

import { useState } from 'react'
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import type { BusinessManagementItem } from '@/lib/types'
import { formatVNDateTime } from '@/lib/utils'
import { Building2, Plus, Trash2 } from 'lucide-react'

interface BusinessAccountTableProps {
  items: BusinessManagementItem[]
  isLoading?: boolean
  onCreateClick: () => void
  onDeleteAccount: (userId: string) => void
}

export function BusinessAccountTable({
  items,
  isLoading = false,
  onCreateClick,
  onDeleteAccount,
}: BusinessAccountTableProps) {
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string } | null>(null)
  const [confirmText, setConfirmText] = useState("")

  const handleDeleteClick = (account: { id: string, name: string }) => {
    setDeletingUser(account)
    setConfirmText("")
  }

  const confirmDelete = () => {
    if (confirmText === "XAC NHAN" && deletingUser) {
        onDeleteAccount(deletingUser.id)
        setDeletingUser(null)
    }
  }

  return (
    <>
        <Card className="rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Tài khoản doanh nghiệp
            </CardTitle>
            <Button onClick={onCreateClick} className="gap-2">
                <Plus className="h-4 w-4" />
                Tạo tài khoản mới
            </Button>
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
                Chưa có tài khoản doanh nghiệp nào trong hệ thống.
            </div>
            ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
                <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                    <TableHead>Tên hiển thị (Doanh nghiệp)</TableHead>
                    <TableHead>Tên đăng nhập (Email)</TableHead>
                    <TableHead>Tên gian hàng</TableHead>
                    <TableHead className="text-right">Tổng lượt quét</TableHead>
                    <TableHead className="text-right">Sinh viên duy nhất</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-semibold text-slate-900 border-r border-slate-100/50">
                            {item.account?.name || item.displayName || item.name}
                        </TableCell>
                        <TableCell className="whitespace-normal">
                        {item.hasAccount && item.account ? (
                            <div>
                            <div className="font-medium text-slate-900">{item.account.email}</div>
                            <div className="text-xs text-slate-400">
                                Tạo ngày: {item.account.createdAt ? formatVNDateTime(item.account.createdAt) : ''}
                            </div>
                            </div>
                        ) : (
                            <span className="text-sm text-slate-500">Chưa có tài khoản</span>
                        )}
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">{item.name}</TableCell>
                        <TableCell className="text-right font-semibold">{item.totalScans}</TableCell>
                        <TableCell className="text-right">{item.uniqueStudents}</TableCell>
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
                            {item.hasAccount && item.account && (
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(item.account!)}>
                                <Trash2 className="h-4 w-4" />
                                <span>Huỷ Account</span>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600">Cảnh báo xoá dữ liệu diện rộng</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 mt-2">
                            <p>Bạn đang yêu cầu xoá tài khoản <strong>{deletingUser?.name}</strong>.</p>
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">
                                <strong>LƯU Ý QUAN TRỌNG:</strong> Hành động này sẽ xoá vĩnh viễn:
                                <ul className="list-disc ml-5 mt-1 text-sm">
                                    <li>Thông tin doanh nghiệp và gian hàng</li>
                                    <li>Tài khoản đăng nhập</li>
                                    <li>Toàn bộ lịch sử check-in của sinh viên vào doanh nghiệp này</li>
                                </ul>
                            </div>
                            <p>Để tiếp tục, vui lòng gõ chữ <strong className="text-slate-900">XAC NHAN</strong> vào ô bên dưới:</p>
                            <Input 
                                value={confirmText} 
                                onChange={(e) => setConfirmText(e.target.value)} 
                                placeholder="Gõ XAC NHAN..." 
                                className="border-red-200 focus-visible:ring-red-500"
                            />
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Huỷ bỏ</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={(e) => {
                            if (confirmText !== "XAC NHAN") {
                                e.preventDefault()
                            } else {
                                confirmDelete()
                            }
                        }}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={confirmText !== "XAC NHAN"}
                    >
                        Tôi chắc chắn xoá
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  )
}
