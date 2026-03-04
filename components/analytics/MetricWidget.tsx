'use client'

import { LucideIcon } from 'lucide-react'

interface MetricWidgetProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'teal' | 'amber' | 'violet' | 'emerald'
  change?: { value: number; isPositive: boolean }
  trend?: { label: string; value: number }[]
}

const colorMap = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', gradient: 'from-blue-500 to-blue-600' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-600', gradient: 'from-teal-500 to-teal-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', gradient: 'from-amber-500 to-amber-600' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-600', gradient: 'from-violet-500 to-violet-600' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', gradient: 'from-emerald-500 to-emerald-600' },
}

export function MetricWidget({ label, value, icon: Icon, color, change, trend }: MetricWidgetProps) {
  const colors = colorMap[color]

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-white hover:border-border/80 transition-all duration-300 hover:shadow-lg p-6">
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-5 transition-opacity duration-300`} />

      {/* Content */}
      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
          {change && (
            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${change.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {change.isPositive ? '↑' : '↓'} {change.value}%
            </div>
          )}
        </div>

        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        <p className="text-3xl font-bold text-foreground">{value}</p>

        {trend && (
          <div className="pt-3 border-t border-border/40 space-y-1">
            {trend.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
