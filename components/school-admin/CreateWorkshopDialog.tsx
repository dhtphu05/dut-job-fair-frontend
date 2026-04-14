'use client'

import { useState } from 'react'
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
import type { CreateWorkshopInput } from '@/lib/types'

interface CreateWorkshopDialogProps {
  open: boolean
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateWorkshopInput) => void
}

export function CreateWorkshopDialog({
  open,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: CreateWorkshopDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      password,
    })
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setName('')
      setEmail('')
      setPassword('')
    }
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tạo workshop mới</DialogTitle>
          <DialogDescription>
            Thêm workshop mới kèm tài khoản đăng nhập. Workshop sẽ sẵn sàng sử dụng ngay sau khi tạo.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="create-workshop-name">Tên workshop <span className="text-red-500">*</span></Label>
            <Input
              id="create-workshop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Hội thảo CV Ấn tượng"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-workshop-email">Tên đăng nhập <span className="text-red-500">*</span></Label>
            <Input
              id="create-workshop-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="VD: cv-workshop@jobfair"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-workshop-password">Mật khẩu <span className="text-red-500">*</span></Label>
            <Input
              id="create-workshop-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              minLength={6}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim() || !email.trim() || password.length < 6}>
              {isSubmitting ? 'Đang tạo...' : 'Tạo workshop'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
