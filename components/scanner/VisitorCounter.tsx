import { Users, TrendingUp } from 'lucide-react'

interface VisitorCounterProps {
  count: number
}

export function VisitorCounter({ count }: VisitorCounterProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-white hover:border-border/80 transition-all duration-300 hover:shadow-xl">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-teal-600 opacity-5 group-hover:opacity-10 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center gap-1 text-teal-600 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Live
          </div>
        </div>

        {/* Title and Count */}
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Scans</h3>
        <div className="flex items-baseline gap-2">
          <div className="text-5xl font-bold text-teal-600">{count}</div>
          <span className="text-sm text-muted-foreground">visitors</span>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/40">
          Scanned today
        </p>
      </div>
    </div>
  )
}
