'use client'

import { useState } from 'react'
import { QrScanner } from '@/components/scanner/QrScanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { customAxiosInstance } from '@/lib/axios-instance'
import { CheckCircle2, AlertTriangle, AlertCircle, Gift, Loader2, ScanLine } from 'lucide-react'

type RewardRedeemResult = 'claimed_now' | 'already_claimed' | 'expired' | 'invalid_state'

type RewardRedeemResponse = {
  result: RewardRedeemResult
  message: string
  claim?: {
    id?: string
    requestCode: string
    status: string
    claimedAt?: string | null
    student?: {
      studentCode?: string
      fullName?: string
    }
    milestone?: {
      name?: string
    }
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Chưa có'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

function getResultTone(result?: RewardRedeemResult) {
  switch (result) {
    case 'claimed_now':
      return {
        card: 'border-green-200 bg-green-50',
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        badge: 'bg-green-100 text-green-700 hover:bg-green-100',
        label: 'Đổi quà thành công',
      }
    case 'already_claimed':
      return {
        card: 'border-amber-200 bg-amber-50',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        badge: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
        label: 'Mã đã đổi trước đó',
      }
    case 'expired':
      return {
        card: 'border-orange-200 bg-orange-50',
        icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
        badge: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
        label: 'Mã đã hết hạn',
      }
    case 'invalid_state':
      return {
        card: 'border-red-200 bg-red-50',
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        badge: 'bg-red-100 text-red-700 hover:bg-red-100',
        label: 'Mã không còn hiệu lực',
      }
    default:
      return {
        card: 'border-border bg-background',
        icon: <Gift className="h-5 w-5 text-muted-foreground" />,
        badge: 'bg-muted text-muted-foreground',
        label: 'Chưa có kết quả',
      }
  }
}

async function redeemReward(requestCode: string) {
  const res = await customAxiosInstance<{ data: RewardRedeemResponse }>(
    '/api/rewards/redeem',
    {
      method: 'POST',
      body: JSON.stringify({ requestCode }),
    }
  )

  return (res as any).data as RewardRedeemResponse
}

export function RewardsRedeemPanel() {
  const [requestCode, setRequestCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<RewardRedeemResponse | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const tone = getResultTone(result?.result)

  const submitRedeem = async (rawCode: string) => {
    const normalizedCode = rawCode.trim()
    if (!normalizedCode) {
      setNetworkError('Vui lòng nhập hoặc quét mã đổi quà')
      return
    }

    setIsSubmitting(true)
    setNetworkError(null)

    try {
      const data = await redeemReward(normalizedCode)
      setResult(data)
      setRequestCode(normalizedCode)
    } catch (error: any) {
      const status = error?.response?.status
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể đổi quà bằng mã này'

      if (status === 401) {
        setNetworkError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại bằng tài khoản quản trị trường.')
      } else {
        setNetworkError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitRedeem(requestCode)
  }

  const handleScan = async (rawValue: string) => {
    await submitRedeem(rawValue)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-blue-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-blue-600" />
              Quét QR đổi quà
            </CardTitle>
            <CardDescription>
              Quét trực tiếp QR từ ứng dụng sinh viên. Giá trị QR phải chính là `requestCode`.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QrScanner onScan={handleScan} isProcessing={isSubmitting} />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-600" />
              Đổi quà bằng mã tay
            </CardTitle>
            <CardDescription>
              Dùng khi camera lỗi hoặc nhân sự nhập tay `requestCode`, ví dụ `RW-AB12CD34`.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reward-request-code">Mã đổi quà</Label>
                <Input
                  id="reward-request-code"
                  value={requestCode}
                  onChange={(e) => setRequestCode(e.target.value)}
                  placeholder="RW-AB12CD34"
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !requestCode.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xác nhận...
                  </>
                ) : (
                  'Xác nhận đổi quà'
                )}
              </Button>
            </form>

            <Alert>
              <AlertDescription>
                Nếu mạng bị timeout, không xác nhận bằng tay ngay. Hãy thử lại cùng `requestCode`. Backend sẽ trả
                `claimed_now` hoặc `already_claimed`.
              </AlertDescription>
            </Alert>

            {networkError && (
              <Alert variant="destructive">
                <AlertDescription>{networkError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={tone.card}>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {tone.icon}
              <CardTitle>Kết quả đổi quà</CardTitle>
            </div>
            <Badge className={tone.badge}>{tone.label}</Badge>
          </div>
          <CardDescription>
            {result?.message || 'Chưa có giao dịch đổi quà nào trong phiên này.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result?.claim ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border border-black/5 bg-white/70 p-4">
                <p className="text-muted-foreground">Mã yêu cầu</p>
                <p className="font-semibold">{result.claim.requestCode}</p>
              </div>
              <div className="rounded-lg border border-black/5 bg-white/70 p-4">
                <p className="text-muted-foreground">Trạng thái</p>
                <p className="font-semibold">{result.claim.status}</p>
              </div>
              <div className="rounded-lg border border-black/5 bg-white/70 p-4">
                <p className="text-muted-foreground">Sinh viên</p>
                <p className="font-semibold">{result.claim.student?.fullName || 'Không có dữ liệu'}</p>
                <p className="text-muted-foreground">{result.claim.student?.studentCode || ''}</p>
              </div>
              <div className="rounded-lg border border-black/5 bg-white/70 p-4">
                <p className="text-muted-foreground">Mốc quà</p>
                <p className="font-semibold">{result.claim.milestone?.name || 'Không có dữ liệu'}</p>
              </div>
              <div className="rounded-lg border border-black/5 bg-white/70 p-4 md:col-span-2">
                <p className="text-muted-foreground">Thời gian đổi</p>
                <p className="font-semibold">{formatDateTime(result.claim.claimedAt)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Quét QR hoặc nhập `requestCode` để đổi quà. Kết quả thành công, đã đổi rồi, hết hạn và không hợp lệ sẽ
              được hiển thị ở đây.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
