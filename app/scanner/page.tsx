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
import { useScannerControllerScanByQrData, useScannerControllerGetRecentScans, useScannerControllerGetScans, getScannerControllerGetRecentScansQueryKey } from '@/lib/api/generated/scanner/scanner'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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
  const { mutateAsync: scanQr, isPending: isProcessing } = useScannerControllerScanByQrData()

  const handleScan = async (qrCode: string) => {
    console.log('[handleScan] called, boothId:', boothId, 'qrCode:', qrCode)
    if (!boothId) {
      toast.error('Không tìm thấy ID gian hàng. Vui lòng đăng nhập lại.')
      return
    }

    try {
      // 1. Parse QR code JSON
      let qrData: any
      try {
        qrData = JSON.parse(qrCode)
      } catch (e) {
        throw new Error('Định dạng mã QR không hợp lệ. Vui lòng sử dụng mã QR từ DUT.')
      }

      // 2. Call Orval mutation
      const response = await scanQr({
        data: {
          ...qrData,
          boothId,
        }
      })

      const result = (response as any).data
      console.log('[handleScan] API result:', result)

      if (result.success || result.status === 'duplicate') {
        const visitorData: Visitor = {
          id: result.visitor?.id || '',
          studentCode: result.visitor?.studentCode || qrData.ma_so_sinh_vien || '',
          fullName: result.visitor?.fullName || qrData.ho_ten || '',
          email: result.visitor?.email || qrData.email || '',
          phone: result.visitor?.phone || qrData.phone || '',
          major: result.visitor?.major || qrData.lop || '',
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
