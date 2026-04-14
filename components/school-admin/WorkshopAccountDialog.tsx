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
import type { WorkshopAccountCreateInput, WorkshopAccountUpdateInput, WorkshopManagementItem } from '@/lib/types'

interface WorkshopAccountDialogProps {
  open: boolean
  workshop: WorkshopManagementItem | null
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: WorkshopAccountCreateInput | WorkshopAccountUpdateInput, isUpdate: boolean) => void
}

export function WorkshopAccountDialog({
  open,
  workshop,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: WorkshopAccountDialogProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const isUpdateMode = Boolean(workshop?.hasAccount)

  useEffect(() => {
    if (!open) return
    if (isUpdateMode && workshop?.account) {
      setEmail(workshop.account.email)
      setPassword('')
      setName(workshop.account.name || workshop.displayName || workshop.name)
    } else {
      setEmail('')
      setPassword('')
      setName(workshop?.displayName || workshop?.name || '')
    }
  }, [open, workshop, isUpdateMode])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (isUpdateMode) {
      onSubmit({
        email: email.trim() || undefined,
        password: password || undefined,
        name: name.trim() || undefined,
      }, true)
    } else {
      onSubmit({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      }, false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isUpdateMode ? 'Cập nhật tài khoản hội thảo' : 'Tạo tài khoản hội thảo'}</DialogTitle>
          <DialogDescription>
            {isUpdateMode
              ? `Chỉnh sửa thông tin tài khoản đăng nhập cho ${workshop?.displayName || workshop?.name}.`
              : (workshop ? `Thiết lập tài khoản đăng nhập mới cho ${workshop.displayName || workshop.name}.` : 'Thiết lập tài khoản đăng nhập cho hội thảo.')
            }
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="workshop-account-email">Email đăng nhập</Label>
            <Input
              id="workshop-account-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="cv-workshop@jobfair"
              required={!isUpdateMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workshop-account-password">Mật khẩu</Label>
            <Input
              id="workshop-account-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isUpdateMode ? 'Bỏ trống nếu không muốn thay đổi mật khẩu' : 'password123'}
              required={!isUpdateMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workshop-account-name">Tên hiển thị tài khoản</Label>
            <Input
              id="workshop-account-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tài khoản hội thảo CV Ấn tượng"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isUpdateMode ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
