import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ScanRecord } from '@/lib/types'
import { Clock, User, GraduationCap } from 'lucide-react'
import { formatVNTime } from '@/lib/utils'

interface RecentScansProps {
  scans: ScanRecord[]
}

export function RecentScans({ scans }: RecentScansProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'duplicate':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Quét gần đây
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Chưa có quét nào</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3 pr-4">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <p className="font-medium truncate text-sm">
                        {scan.visitor?.fullName || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">
                        {(scan.visitor as any)?.studentCode || ''}{(scan.visitor as any)?.major ? ` – ${(scan.visitor as any).major}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatVNTime(scan.timestamp)}
                    </p>
                  </div>
                  <Badge className={`flex-shrink-0 ${getStatusColor(scan.status)}`}>
                    {scan.status}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
