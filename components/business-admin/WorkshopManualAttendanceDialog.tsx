'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { WorkshopAttendanceManualInput } from '@/lib/types'

interface WorkshopManualAttendanceDialogProps {
  open: boolean
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: WorkshopAttendanceManualInput) => void
}

const INITIAL_FORM: WorkshopAttendanceManualInput = {
  fullName: '',
  studentCode: '',
  className: '',
  department: '',
  phone: '',
  email: '',
  checkInTime: '',
}

export function WorkshopManualAttendanceDialog({
  open,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: WorkshopManualAttendanceDialogProps) {
  const [form, setForm] = useState<WorkshopAttendanceManualInput>(INITIAL_FORM)

  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM)
    }
  }, [open])

  const handleChange = (field: keyof WorkshopAttendanceManualInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      fullName: form.fullName.trim(),
      studentCode: form.studentCode.trim(),
      className: form.className?.trim() || undefined,
      department: form.department?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      checkInTime: form.checkInTime || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm thủ công sinh viên điểm danh</DialogTitle>
          <DialogDescription>
            Vui lòng nhập thông tin sinh viên để thêm vào danh sách điểm danh hội thảo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="manual-fullName">Họ và tên</Label>
            <Input
              id="manual-fullName"
              value={form.fullName}
              onChange={(event) => handleChange('fullName', event.target.value)}
              placeholder="Nguyễn Văn A"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="manual-studentCode">MSSV</Label>
              <Input
                id="manual-studentCode"
                value={form.studentCode}
                onChange={(event) => handleChange('studentCode', event.target.value)}
                placeholder="102230000"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manual-className">Lớp</Label>
              <Input
                id="manual-className"
                value={form.className}
                onChange={(event) => handleChange('className', event.target.value)}
                placeholder="23T_DT3"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="manual-department">Khoa</Label>
              <Input
                id="manual-department"
                value={form.department}
                onChange={(event) => handleChange('department', event.target.value)}
                placeholder="Khoa Công nghệ Thông tin"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manual-phone">SĐT</Label>
              <Input
                id="manual-phone"
                value={form.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
                placeholder="0123456789"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="manual-email">Email</Label>
              <Input
                id="manual-email"
                type="email"
                value={form.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="example@gmail.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manual-checkInTime">Thời gian điểm danh</Label>
              <Input
                id="manual-checkInTime"
                type="datetime-local"
                value={form.checkInTime}
                onChange={(event) => handleChange('checkInTime', event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Đóng
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Thêm thủ công
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
