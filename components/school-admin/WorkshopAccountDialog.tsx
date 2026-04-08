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
import type { WorkshopAccountCreateInput, WorkshopManagementItem } from '@/lib/types'

interface WorkshopAccountDialogProps {
  open: boolean
  workshop: WorkshopManagementItem | null
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: WorkshopAccountCreateInput) => void
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

  useEffect(() => {
    if (!open) return
    setEmail('')
    setPassword('')
    setName(workshop?.displayName || workshop?.name || '')
  }, [open, workshop])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      email: email.trim(),
      password,
      name: name.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tạo tài khoản hội thảo</DialogTitle>
          <DialogDescription>
            {workshop
              ? `Thiết lập tài khoản đăng nhập cho ${workshop.displayName || workshop.name}.`
              : 'Thiết lập tài khoản đăng nhập cho hội thảo.'}
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
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workshop-account-password">Mật khẩu</Label>
            <Input
              id="workshop-account-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="password123"
              required
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
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
