'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Building2,
  User,
  Globe,
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { formatVNDateTime } from '@/lib/utils'
import axiosInstance from '@/lib/axios-instance'

interface BusinessEntry {
  businessId: string
  businessName: string
  industry: string | null
  website: string | null
  boothName: string
  checkInTime: string
}

interface LookupResult {
  studentCode: string
  fullName: string
  totalBusinesses: number
  businesses: BusinessEntry[]
}

export function StudentBusinessLookup() {
  const [studentCode, setStudentCode] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = async () => {
    const code = studentCode.trim()
    if (!code) {
      inputRef.current?.focus()
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await axiosInstance.get<{ data: LookupResult }>(
        `/api/checkins/public/by-student-code/${encodeURIComponent(code)}`,
      )
      // Backend wraps response in { data: ... } via TransformInterceptor
      setResult((res.data as any).data ?? res.data)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Không tìm thấy sinh viên hoặc có lỗi xảy ra.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Tra cứu doanh nghiệp đã check-in</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Nhập mã số sinh viên (MSSV) để xem danh sách doanh nghiệp mà sinh viên đó đã ghé thăm.
        </p>

        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              placeholder="Nhập MSSV, ví dụ: 21IT001"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading || !studentCode.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Tìm kiếm'
            )}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Student info card */}
          <div className="flex items-center gap-4 rounded-lg border border-border/50 bg-blue-50/50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{result.fullName}</p>
              <p className="text-sm text-muted-foreground">MSSV: {result.studentCode}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-blue-600">{result.totalBusinesses}</p>
              <p className="text-xs text-muted-foreground">doanh nghiệp</p>
            </div>
          </div>

          {/* No checkins */}
          {result.totalBusinesses === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Sinh viên chưa check-in tại doanh nghiệp nào.</p>
            </div>
          )}

          {/* Business cards grid */}
          {result.businesses.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.businesses.map((biz, idx) => (
                <div
                  key={biz.businessId}
                  className="rounded-lg border border-border/50 bg-white p-4 space-y-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-green-100 shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{biz.businessName}</p>
                      <p className="text-xs text-muted-foreground truncate">{biz.boothName}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    {biz.industry && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{biz.industry}</span>
                      </div>
                    )}
                    {biz.website && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-3.5 w-3.5 shrink-0" />
                        <a
                          href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-blue-600 hover:underline"
                        >
                          {biz.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs">{formatVNDateTime(biz.checkInTime)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state before search */}
      {!result && !error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm">Nhập MSSV và nhấn Tìm kiếm để tra cứu.</p>
        </div>
      )}
    </div>
  )
}
