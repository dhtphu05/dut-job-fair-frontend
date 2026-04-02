'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import QrScannerLib from 'qr-scanner'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, Camera, CameraOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface QrScannerProps {
  onScan: (result: string) => Promise<void>
  isProcessing?: boolean
}

export function QrScanner({ onScan, isProcessing = false }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScannerLib | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Always keep a ref to the latest onScan so the scanner (created once on mount)
  // never holds a stale closure — fixes the case where boothId loads async.
  const onScanRef = useRef(onScan)
  useEffect(() => { onScanRef.current = onScan }, [onScan])

  // Deduplicate: same QR code within 2s counts as one scan
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 })
  // Prevent concurrent API calls
  const isHandlingRef = useRef(false)

  // Stable callback — uses ref so it never captures a stale onScan
  const handleResult = useCallback(
    async (result: QrScannerLib.ScanResult) => {
      const text = result.data
      if (!text) return

      const now = Date.now()
      if (
        text === lastScannedRef.current.code &&
        now - lastScannedRef.current.time < 2000
      ) return

      // Block re-entry while processing
      if (isHandlingRef.current) return
      isHandlingRef.current = true
      lastScannedRef.current = { code: text, time: now }

      try {
        console.log('[QrScanner] decoded text:', text)
        await onScanRef.current(text)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Scan failed')
      } finally {
        isHandlingRef.current = false
      }
    },
    [] // no deps — onScan accessed via ref
  )

  const startScanner = useCallback(async () => {
    if (!videoRef.current || isStarting || isScanning) return
    setIsStarting(true)
    setError(null)

    try {
      const scanner = new QrScannerLib(videoRef.current, handleResult, {
        // Prefer back camera (camera sau trên điện thoại)
        preferredCamera: 'environment',
        // Show highlight box on detected QR
        highlightScanRegion: true,
        highlightCodeOutline: true,
        // Scan region: center 70% of video frame
        calculateScanRegion: (video: HTMLVideoElement) => {
          const size = Math.min(video.videoWidth, video.videoHeight) * 0.7
          return {
            x: (video.videoWidth - size) / 2,
            y: (video.videoHeight - size) / 2,
            width: size,
            height: size,
          }
        },
        // Use BarcodeDetector API automatically when available (Chrome/Edge native, very fast)
        // Falls back to WebWorker + ZXing otherwise
        returnDetailedScanResult: true,
      })

      scannerRef.current = scanner
      await scanner.start()
      setIsScanning(true)
    } catch (err: unknown) {
      setError('Không thể truy cập camera. Hãy cho phép quyền camera trong trình duyệt rồi thử lại.')
      scannerRef.current = null
    } finally {
      setIsStarting(false)
    }
  }, [handleResult, isStarting, isScanning])

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      scannerRef.current.stop()
      scannerRef.current.destroy()
      scannerRef.current = null
    }
    setIsScanning(false)
  }, [])

  // Auto-start on mount
  useEffect(() => {
    startScanner()
    return () => {
      scannerRef.current?.stop()
      scannerRef.current?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Video viewfinder */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-blue-200 bg-black shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
        style={{ minHeight: 260 }}
      >
        <video
          ref={videoRef}
          className="block w-full object-cover"
          style={{ minHeight: 260, display: 'block' }}
          muted
          playsInline
        />

        <div className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-white/35 md:inset-6">
          <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-dashed border-cyan-300/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)] sm:h-52 sm:w-52" />
        </div>

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3 pointer-events-none">
            <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
            <p className="text-white text-sm font-medium">Đang xử lý…</p>
          </div>
        )}

        {/* Starting overlay */}
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3 pointer-events-none">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
            <p className="text-white text-sm">Đang khởi động camera…</p>
          </div>
        )}

        {/* Idle placeholder when not scanning */}
        {!isScanning && !isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
            <Camera className="h-12 w-12 text-white/40" />
            <p className="text-white/60 text-sm">Camera chưa bật</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {isScanning ? (
          <Button
            onClick={stopScanner}
            variant="outline"
            disabled={isProcessing}
            className="flex-1 gap-2 border-slate-300"
          >
            <CameraOff className="h-4 w-4" />
            Dừng camera
          </Button>
        ) : (
          <Button
            onClick={startScanner}
            disabled={isStarting || isProcessing}
            className="flex-1 gap-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/30 transition-transform hover:scale-[1.01] hover:from-blue-700 hover:via-cyan-600 hover:to-emerald-600"
          >
            {isStarting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Camera className="h-4 w-4" />
            }
            {isStarting ? 'Đang khởi động…' : 'Bắt đầu quét QR'}
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-center text-xs text-cyan-900">
        Đưa mã QR vào giữa khung quét và giữ máy ổn định để nhận mã nhanh hơn.
      </div>
    </div>
  )
}
