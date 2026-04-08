'use client'

import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'

interface WorkshopExportActionsProps {
  isPending?: boolean
  onOpenManualAdd?: () => void
  onDownloadCsv: () => void
  onDownloadExcel: () => void
}

export function WorkshopExportActions({
  isPending = false,
  onOpenManualAdd,
  onDownloadCsv,
  onDownloadExcel,
}: WorkshopExportActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={onDownloadExcel}
        disabled={isPending}
        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 font-bold"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
        <span>Tải Excel</span>
      </Button>
      <Button
        variant="outline"
        onClick={onDownloadCsv}
        disabled={isPending}
        className="rounded-xl px-4 font-bold"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        <span>Tải CSV</span>
      </Button>
      {onOpenManualAdd && (
        <Button
          variant="outline"
          onClick={onOpenManualAdd}
          disabled={isPending}
          className="rounded-xl px-4 font-bold"
        >
          <span>Thêm thủ công</span>
        </Button>
      )}
    </div>
  )
}
