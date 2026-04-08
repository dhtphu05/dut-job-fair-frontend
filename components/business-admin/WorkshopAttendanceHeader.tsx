'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Users } from 'lucide-react'
import type { WorkshopAttendanceUnit } from '@/lib/types'

interface WorkshopAttendanceHeaderProps {
  workshop: WorkshopAttendanceUnit
  total: number
}

export function WorkshopAttendanceHeader({ workshop, total }: WorkshopAttendanceHeaderProps) {
  const workshopLabel = workshop.displayName || workshop.business || workshop.name

  return (
    <Card className="overflow-hidden rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <CardContent className="relative p-7">
        <div className="absolute top-0 right-0 h-36 w-36 translate-x-10 -translate-y-10 rounded-full bg-blue-50 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
              <div className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
              Điểm danh hội thảo
              </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">{workshopLabel}</h2>
              <p className="text-sm font-medium text-slate-500">{workshop.name}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span>{workshop.location || 'Chưa cập nhật địa điểm'}</span>
            </div>
          </div>

          <div className="min-w-[180px] rounded-[24px] bg-slate-950 px-6 py-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Đã điểm danh</p>
                <p className="mt-2 text-4xl font-black leading-none">{total}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <Users className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
