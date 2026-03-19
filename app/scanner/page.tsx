'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QrScanner } from '@/components/scanner/QrScanner'
import { ScanResultModal } from '@/components/scanner/ScanResultModal'
import { RecentScans } from '@/components/scanner/RecentScans'
import { VisitorCounter } from '@/components/scanner/VisitorCounter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { ScanRecord, Visitor } from '@/lib/types'
import {
  useScannerControllerScan,
  useScannerControllerScanByQrData,
  useScannerControllerGetRecentScans,
  useScannerControllerGetScans,
  getScannerControllerGetRecentScansQueryKey,
} from '@/lib/api/generated/scanner/scanner'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

type DutQrPayload = {
  ho_ten: string
  ma_so_sinh_vien: string
  lop: string
  email?: string
  phone?: string
}

function tryParseDutQrPayload(rawValue: string): DutQrPayload | null {
  const trimmed = rawValue.trim()
  if (!trimmed) return null

  const candidates = [trimmed]

  try {
    const decoded = decodeURIComponent(trimmed)
    if (decoded !== trimmed) candidates.push(decoded)
  } catch {
    // Ignore malformed URI content and keep other fallbacks.
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.ho_ten === 'string' &&
        typeof parsed.ma_so_sinh_vien === 'string' &&
        typeof parsed.lop === 'string'
      ) {
        return parsed as DutQrPayload
      }
    } catch {
      // Not a JSON QR payload, continue to fallback.
    }
  }

  return null
}

export default function ScannerPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [visitorCount, setVisitorCount] = useState(0)
  const countInitialized = useRef(false)
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'duplicate' | 'error'
    visitor: Visitor | null
    message: string
  } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [boothId, setBoothId] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('booth_id')
    setBoothId(id)
    if (!id) {
      toast.error('Không tìm thấy ID gian hàng. Vui lòng đăng nhập lại.')
    }
  }, [])

  // Recent scans query
  const { data: recentScansData } = useScannerControllerGetRecentScans(
    { boothId: boothId || '' },
    { query: { enabled: !!boothId } }
  )

  // Total scans count for initializing the counter
  const { data: scansTotalData } = useScannerControllerGetScans(
    { boothId: boothId || '' },
    { query: { enabled: !!boothId } }
  )

  // Initialize visitorCount from backend total (once on load)
  useEffect(() => {
    if (!countInitialized.current && scansTotalData) {
      const total = (scansTotalData as any)?.data?.total
      if (total !== undefined) {
        setVisitorCount(total)
        countInitialized.current = true
      }
    }
  }, [scansTotalData])

  // Map backend response to ScanRecord shape (checkInTime → timestamp)
  const rawScans: any[] = (recentScansData as any)?.data || []
  const recentScans: ScanRecord[] = rawScans.map((item: any) => ({
    id: item.id,
    visitorId: item.visitor?.id || '',
    boothId: boothId || '',
    timestamp: item.checkInTime,
    status: item.status,
    visitor: item.visitor,
  }))

  // Scan mutation
  const { mutateAsync: scanByCode, isPending: isCodeScanPending } = useScannerControllerScan()
  const { mutateAsync: scanQr, isPending: isQrScanPending } = useScannerControllerScanByQrData()
  const isProcessing = isCodeScanPending || isQrScanPending

  const handleScan = async (qrCode: string) => {
    console.log('[handleScan] called, boothId:', boothId, 'qrCode:', qrCode)
    if (!boothId) {
      toast.error('Không tìm thấy ID gian hàng. Vui lòng đăng nhập lại.')
      return
    }

    try {
      const rawValue = qrCode.trim()
      const qrPayload = tryParseDutQrPayload(rawValue)

      const response = qrPayload
        ? await scanQr({
            data: {
              ...qrPayload,
              boothId,
            }
          })
        : await scanByCode({
            data: {
              visitorCode: rawValue,
              boothId,
            }
          })

      const result = (response as any).data
      console.log('[handleScan] API result:', result)

      if (result.success || result.status === 'duplicate') {
        const visitorData: Visitor = {
          id: result.visitor?.id || '',
          studentCode: result.visitor?.studentCode || qrPayload?.ma_so_sinh_vien || rawValue,
          fullName: result.visitor?.fullName || qrPayload?.ho_ten || '',
          email: result.visitor?.email || qrPayload?.email || '',
          phone: result.visitor?.phone || qrPayload?.phone || '',
          major: result.visitor?.major || qrPayload?.lop || '',
          year: result.visitor?.year || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        if (result.status === 'success') {
          setVisitorCount((prev) => prev + 1)
          // Invalidate recent scans query
          queryClient.invalidateQueries({
            queryKey: getScannerControllerGetRecentScansQueryKey({ boothId })
          })
        }

        setScanResult({
          status: result.status,
          visitor: visitorData,
          message: result.message,
        })
      } else {
        throw new Error(result.message || 'Check-in thất bại')
      }
    } catch (error: any) {
      console.error('Scan error:', error)
      setScanResult({
        status: 'error',
        visitor: null,
        message: error?.response?.data?.message || error.message || 'Có lỗi xảy ra khi xử lý quét',
      })
    } finally {
      setModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setScanResult(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50">
      {/* Header */}
      <div className="border-b border-border/40 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Quét QR Code
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Theo dõi khách thăm theo thời gian thực</p>
            </div>
            <Button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white border-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Scanner Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quét mã QR</CardTitle>
                <CardDescription>
                  Hướng camera vào mã QR của khách để bắt đầu quét
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QrScanner onScan={handleScan} isProcessing={isProcessing} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <VisitorCounter count={visitorCount} />
            <RecentScans scans={recentScans} />
          </div>
        </div>
      </div>

      {/* Scan Result Modal */}
      {scanResult && (
        <ScanResultModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          status={scanResult.status}
          visitor={scanResult.visitor}
          message={scanResult.message}
          isLoading={isProcessing}
        />
      )}
    </main>
  )
}
