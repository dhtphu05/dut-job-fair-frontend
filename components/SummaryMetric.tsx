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
    <div className="bg-white p-6 rounded-2xl border border-slate-100 border-l-4 border-l-amber-400 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
            {trend && (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                trend.positive ? "bg-teal-50 text-teal-600" : "bg-red-50 text-red-600"
              )}>
                {trend.positive ? '+' : ''}{trend.value}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-400 font-medium">{description}</p>
          )}
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300">
          <Icon className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  )
}
