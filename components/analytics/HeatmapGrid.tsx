'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface HeatmapData {
  name: string
  value: number
}

interface HeatmapGridProps {
  data: HeatmapData[]
  title: string
  maxValue?: number
}

export function HeatmapGrid({ data, title, maxValue }: HeatmapGridProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const max = maxValue || Math.max(...sorted.map((d) => d.value), 1)
  const total = sorted.reduce((s, d) => s + d.value, 0)

  const getBarColor = (pct: number) => {
    if (pct >= 0.8) return 'bg-blue-600'
    if (pct >= 0.6) return 'bg-blue-500'
    if (pct >= 0.4) return 'bg-blue-400'
    if (pct >= 0.2) return 'bg-blue-300'
    return 'bg-blue-200'
  }

  const getTextColor = (pct: number) => {
    if (pct >= 0.4) return 'text-blue-700'
    return 'text-blue-500'
  }

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {sorted.map((item, index) => {
            const pct = item.value / max
            const sharePct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
            return (
              <div key={index} className="flex items-center gap-3 group">
                {/* Rank */}
                <span className="w-5 text-xs text-muted-foreground text-right flex-shrink-0">
                  {index + 1}
                </span>

                {/* Name */}
                <span className="w-44 text-sm font-medium truncate flex-shrink-0" title={item.name}>
                  {item.name}
                </span>

                {/* Bar */}
                <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(pct)}`}
                    style={{ width: `${Math.max(pct * 100, 2)}%` }}
                  />
                </div>

                {/* Count + share */}
                <div className="flex items-baseline gap-1 flex-shrink-0 w-20 justify-end">
                  <span className={`text-sm font-bold ${getTextColor(pct)}`}>{item.value}</span>
                  <span className="text-xs text-muted-foreground">({sharePct}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

