import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Prize } from '@/lib/types'
import { Gift, Edit2, Plus } from 'lucide-react'

interface PrizesSectionProps {
  prizes: Prize[]
  isLoading?: boolean
}

export function PrizesSection({ prizes, isLoading = false }: PrizesSectionProps) {
  const getPrizeTypeColor = (type: string) => {
    switch (type) {
      case 'early_bird':
        return 'bg-yellow-100 text-yellow-800'
      case 'lucky_draw':
        return 'bg-purple-100 text-purple-800'
      case 'booth_special':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrizeType = (type: string) => {
    switch (type) {
      case 'early_bird':
        return 'Sơ cấp'
      case 'lucky_draw':
        return 'Xổ số may mắn'
      case 'booth_special':
        return 'Đặc biệt gian hàng'
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Quản lý giải thưởng
        </CardTitle>
        <Button size="sm" className="bg-primary hover:bg-primary/90 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Thêm giải
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Đang tải giải thưởng...</p>
          </div>
        ) : prizes.length === 0 ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Chưa cấu hình giải thưởng</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prizes.map((prize) => (
              <div
                key={prize.id}
                className="border rounded-lg p-4 flex items-start justify-between hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{prize.name}</h4>
                    <Badge className={getPrizeTypeColor(prize.type)}>
                      {formatPrizeType(prize.type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{prize.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span>
                      <span className="text-muted-foreground">Số lượng:</span> {prize.quantity}
                    </span>
                    <span>
                      <span className="text-muted-foreground">Điều kiện:</span> {prize.qualificationRule}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
