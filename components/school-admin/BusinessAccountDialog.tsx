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
import type { BusinessAccountCreateInput } from '@/lib/types'
import { RefreshCw } from 'lucide-react'

interface BusinessAccountDialogProps {
  open: boolean
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: BusinessAccountCreateInput) => void
}

export function BusinessAccountDialog({
  open,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: BusinessAccountDialogProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    if (!open) return
    setEmail('')
    setPassword('')
    setName('')
  }, [open])

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let pass = ''
    for (let i = 0; i < 10; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pass)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      email: email.trim(),
      password,
      name: name.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tạo tài khoản doanh nghiệp</DialogTitle>
          <DialogDescription>
            Hệ thống sẽ tự động khởi tạo Doanh nghiệp, Gian hàng và Tài khoản quản trị tương ứng.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="business-account-email">Tên đăng nhập (Email)</Label>
            <Input
              id="business-account-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="hr@congty.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-account-name">Tên hiển thị (Tên doanh nghiệp)</Label>
            <Input
              id="business-account-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Công ty Cổ phần ABC"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-account-password">Mật khẩu</Label>
            <div className="flex gap-2">
                <Input
                id="business-account-password"
                type="text"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu..."
                required
                />
                <Button type="button" variant="outline" onClick={handleGeneratePassword} className="shrink-0 gap-2">
                    <RefreshCw className="h-4 w-4" /> Random
                </Button>
            </div>
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
