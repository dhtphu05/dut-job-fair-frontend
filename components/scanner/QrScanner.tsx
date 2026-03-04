'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface QrScannerProps {
  onScan: (result: string) => Promise<void>
  isProcessing?: boolean
}

export function QrScanner({ onScan, isProcessing = false }: QrScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      containerRef.current.id,
      {
        fps: 30,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
      },
      /* verbose= */ false
    )

    scannerRef.current = scanner

    const onScanSuccess = async (result: string) => {
      try {
        await onScan(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Scan failed')
      }
    }

    const onScanError = (error: string) => {
      // Ignore scanning errors - they happen constantly during scanning
      // Only show actual processing errors
    }

    scanner.render(onScanSuccess, onScanError)
    setIsScanning(true)
    setError(null)

    return () => {
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        scanner.clear().catch((err) => console.log('Clear error:', err))
      }
    }
  }, [onScan])

  const handleStop = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.clear()
        setIsScanning(false)
      } catch (err) {
        console.error('Failed to stop scanner:', err)
      }
    }
  }

  const handleRestart = async () => {
    if (!isScanning && scannerRef.current && containerRef.current) {
      try {
        await scannerRef.current.render(
          async (result) => {
            try {
              await onScan(result)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Scan failed')
            }
          },
          () => {}
        )
        setIsScanning(true)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to restart scanner')
      }
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        id="qr-scanner"
        ref={containerRef}
        className="w-full bg-muted rounded-lg overflow-hidden border-2 border-border"
      />

      <div className="flex gap-2">
        {isScanning ? (
          <Button
            onClick={handleStop}
            variant="outline"
            disabled={isProcessing}
            className="flex-1"
          >
            Dừng quét
          </Button>
        ) : (
          <Button
            onClick={handleRestart}
            variant="outline"
            disabled={isProcessing}
            className="flex-1"
          >
            Khởi động lại
          </Button>
        )}

        {isProcessing && (
          <div className="flex-1 flex items-center justify-center bg-muted rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground text-center p-4 bg-muted rounded-lg">
        <p>Hướng camera vào mã QR để quét</p>
        <p className="text-xs mt-2">Đảm bảo ánh sáng đủ để quét tốt hơn</p>
      </div>
    </div>
  )
}
