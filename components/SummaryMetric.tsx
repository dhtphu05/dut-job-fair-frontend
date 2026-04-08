'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SummaryMetricProps {
  label: string
  value: string | number
  icon: LucideIcon
  isLoading?: boolean
  description?: string
  trend?: {
    value: string
    positive: boolean
  }
}

export function SummaryMetric({
  label,
  value,
  icon: Icon,
  isLoading = false,
  description,
  trend,
}: SummaryMetricProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-white p-6 rounded-[28px] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 group border-l-[6px] border-l-amber-400">
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-50 group-hover:bg-blue-50 transition-colors duration-500" />
      
      <div className="relative flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-none mb-1 opacity-80">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[32px] font-black text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors duration-300">
              {value}
            </h3>
            {trend && (
              <div className={cn(
                "flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-full",
                trend.positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </div>
            )}
          </div>
          {description && (
            <p className="text-[12px] text-slate-400 font-medium tracking-tight mt-1 line-clamp-1">{description}</p>
          )}
        </div>

        <div className={cn(
          "shrink-0 w-16 h-16 rounded-[22px] flex items-center justify-center transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3 shadow-sm",
          "bg-slate-50 group-hover:bg-white border border-slate-100 group-hover:shadow-lg group-hover:shadow-blue-500/10"
        )}>
          <Icon className="h-8 w-8 text-blue-600 group-hover:animate-pulse" />
        </div>
      </div>
    </div>
  )
}
