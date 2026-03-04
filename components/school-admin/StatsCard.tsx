import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  description?: string
}

const gradients = [
  'from-blue-500 to-blue-600',
  'from-teal-500 to-teal-600',
  'from-amber-500 to-amber-600',
  'from-violet-500 to-violet-600',
]

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
}: StatsCardProps) {
  // Rotate gradient based on icon hash
  const gradientIndex = Math.abs(title.charCodeAt(0)) % gradients.length
  const gradient = gradients[gradientIndex]

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-white hover:border-border/80 transition-all duration-300 hover:shadow-xl">
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
            </div>
          )}
        </div>

        <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
        <p className="text-4xl font-bold text-foreground">{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-3">{description}</p>}
      </div>
    </div>
  )
}
