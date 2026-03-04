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
  const max = maxValue || Math.max(...data.map((d) => d.value))

  const getColor = (value: number) => {
    const percentage = value / max
    if (percentage < 0.2) return 'bg-blue-50 text-blue-900'
    if (percentage < 0.4) return 'bg-blue-100 text-blue-900'
    if (percentage < 0.6) return 'bg-blue-300 text-white'
    if (percentage < 0.8) return 'bg-blue-500 text-white'
    return 'bg-blue-600 text-white'
  }

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {data.map((item, index) => (
            <div
              key={index}
              className={`${getColor(item.value)} p-4 rounded-lg text-center transition-all hover:shadow-lg cursor-pointer`}
            >
              <div className="font-semibold text-sm truncate">{item.name}</div>
              <div className="text-lg font-bold">{item.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
