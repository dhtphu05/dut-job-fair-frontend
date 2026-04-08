import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  User,
  GraduationCap,
  Mail,
  Phone,
  BookOpen,
  Calendar,
} from 'lucide-react'
import { Visitor } from '@/lib/types'
import { ScanStatus } from '@/lib/constants'

interface ScanResultModalProps {
  isOpen: boolean
  onClose: () => void
  status: ScanStatus | null
  visitor: Visitor | null
  message: string
  isLoading?: boolean
}

export function ScanResultModal({
  isOpen,
  onClose,
  status,
  visitor,
  message,
  isLoading = false,
}: ScanResultModalProps) {
  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-12 w-12 text-green-500" />
      case 'duplicate':
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-12 w-12 text-red-500" />
      default:
        return null
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'success':
        return 'Quét thành công'
      case 'duplicate':
        return 'Quét trùng lặp'
      case 'error':
        return 'Quét thất bại'
      default:
        return 'Kết quả quét'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'duplicate':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-background border-border'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">{getIcon()}</div>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        {visitor && (status === 'success' || status === 'duplicate') && (
          <Card className={getStatusColor()}>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">MSSV</p>
                  <p className="font-medium">{visitor.studentCode || 'Chưa có dữ liệu'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Tên</p>
                  <p className="font-medium truncate">{visitor.fullName}</p>
                </div>
              </div>

              {visitor.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm truncate">{visitor.email}</p>
                  </div>
                </div>
              )}

              {visitor.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Điện thoại</p>
                    <p className="text-sm">{visitor.phone}</p>
                  </div>
                </div>
              )}

              {visitor.className && (
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Lớp</p>
                    <p className="text-sm">{visitor.className}</p>
                  </div>
                </div>
              )}

              {visitor.department && (
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Khoa</p>
                    <p className="text-sm">{visitor.department}</p>
                  </div>
                </div>
              )}

              {visitor.major && (
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Ngành</p>
                    <p className="text-sm">{visitor.major}</p>
                  </div>
                </div>
              )}

              {visitor.year > 0 && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Năm học</p>
                    <p className="text-sm">Năm {visitor.year}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {status === 'duplicate' && (
          <Alert className="border-yellow-300 bg-yellow-50 text-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              Sinh viên này đã check-in tại gian hàng trong vòng 5 phút gần đây.
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={onClose}
          className="w-full bg-primary hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? 'Đang xử lý...' : 'Đóng'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
