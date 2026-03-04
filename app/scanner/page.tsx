'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QrScanner } from '@/components/scanner/QrScanner'
import { ScanResultModal } from '@/components/scanner/ScanResultModal'
import { RecentScans } from '@/components/scanner/RecentScans'
import { VisitorCounter } from '@/components/scanner/VisitorCounter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { ScanRecord, Visitor } from '@/lib/types'
import { SCANNER_ENDPOINTS } from '@/lib/constants'
import { apiClient } from '@/lib/api-client'

// Mock data for demonstration
const MOCK_RECENT_SCANS: ScanRecord[] = [
  {
    id: '1',
    visitorId: '101',
    boothId: 'booth-1',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    status: 'success',
    visitor: {
      id: '101',
      studentCode: 'DUT001',
      fullName: 'Nguyễn Văn A',
      email: 'nguyena@dut.edu.vn',
      phone: '0912345678',
      major: 'Information Technology',
      year: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    booth: {
      id: 'booth-1',
      name: 'Booth A',
      company: 'Tech Company ABC',
      position: 'Position 1',
      visitorCount: 45,
      staffName: 'John Doe',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: '2',
    visitorId: '102',
    boothId: 'booth-2',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    status: 'success',
    visitor: {
      id: '102',
      studentCode: 'DUT002',
      fullName: 'Trần Thị B',
      email: 'tranb@dut.edu.vn',
      phone: '0987654321',
      major: 'Business Administration',
      year: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    booth: {
      id: 'booth-2',
      name: 'Booth B',
      company: 'Finance Corp',
      position: 'Position 2',
      visitorCount: 32,
      staffName: 'Jane Smith',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
]

export default function ScannerPage() {
  const router = useRouter()
  const [visitorCount, setVisitorCount] = useState(0)
  const [recentScans, setRecentScans] = useState<ScanRecord[]>(MOCK_RECENT_SCANS)
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'duplicate' | 'error'
    visitor: Visitor | null
    message: string
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  // No authentication required for demo

  const handleScan = async (qrCode: string) => {
    setIsProcessing(true)

    try {
      // Parse QR code (format: visitorCode|boothId)
      const [visitorCode, boothId] = qrCode.split('|')

      if (!visitorCode || !boothId) {
        setScanResult({
          status: 'error',
          visitor: null,
          message: 'Invalid QR code format',
        })
        setModalOpen(true)
        return
      }

      // In production, call your backend API
      // const response = await apiClient.post(SCANNER_ENDPOINTS.SCAN, {
      //   visitorCode,
      //   boothId,
      // })

      // For now, simulate scan with mock data
      const mockVisitor: Visitor = {
        id: Math.random().toString(),
        studentCode: visitorCode,
        fullName: 'Test Student',
        email: 'test@dut.edu.vn',
        phone: '0912345678',
        major: 'IT',
        year: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const newScan: ScanRecord = {
        id: Math.random().toString(),
        visitorId: mockVisitor.id,
        boothId,
        timestamp: new Date().toISOString(),
        status: 'success',
        visitor: mockVisitor,
      }

      setVisitorCount((prev) => prev + 1)
      setRecentScans((prev) => [newScan, ...prev.slice(0, 9)])

      setScanResult({
        status: 'success',
        visitor: mockVisitor,
        message: `Visitor scanned successfully at booth ${boothId}`,
      })
    } catch (error) {
      setScanResult({
        status: 'error',
        visitor: null,
        message: error instanceof Error ? error.message : 'Failed to process scan',
      })
    } finally {
      setIsProcessing(false)
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
