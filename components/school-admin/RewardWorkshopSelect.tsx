'use client'

import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu'
import { useRewardWorkshops } from '@/hooks/useRewardMilestones'

export function RewardWorkshopSelect({ selected, onChange, requiredBooths, disabled, open }: {
  selected: string[]; onChange: (ids: string[]) => void; requiredBooths: number; disabled: boolean; open: boolean
}) {
  const { data: workshops = [], isLoading, isError, refetch } = useRewardWorkshops(open)
  return <div className="space-y-2 pt-2">
    <Label htmlFor="milestone-workshops">Workshop bắt buộc trong tổng số booth</Label>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button id="milestone-workshops" type="button" variant="outline" className="w-full justify-between" disabled={disabled || isLoading || isError}>
          {isLoading ? 'Đang tải workshop...' : selected.length ? `Đã chọn ${selected.length} workshop` : 'Chọn workshop đặc biệt'}
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-[min(28rem,calc(100vw-3rem))] overflow-y-auto">
        {workshops.length === 0 && <p className="p-3 text-sm text-muted-foreground">Chưa có workshop nào.</p>}
        {workshops.map(workshop => <DropdownMenuCheckboxItem key={workshop.id}
          checked={selected.includes(workshop.id)} onSelect={event => event.preventDefault()}
          onCheckedChange={checked => onChange(checked ? [...new Set([...selected, workshop.id])] : selected.filter(id => id !== workshop.id))}
          className="items-start whitespace-normal">
          {workshop.name}
        </DropdownMenuCheckboxItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
    {isError && <p className="text-sm text-destructive">Không tải được workshop. <button type="button" className="underline" onClick={() => void refetch()}>Thử lại</button></p>}
    <div className="flex flex-wrap gap-1">
      {selected.map(id => <Badge key={id} variant="secondary" className="max-w-full whitespace-normal">
        {workshops.find(w => w.id === id)?.name ?? (isLoading ? 'Đang tải...' : 'Workshop không còn trong danh sách')}
        <button type="button" aria-label={`Bỏ chọn ${workshops.find(w => w.id === id)?.name ?? 'workshop'}`} className="ml-2" disabled={disabled} onClick={() => onChange(selected.filter(value => value !== id))}>×</button>
      </Badge>)}
    </div>
    <p className="text-sm text-muted-foreground">
      {!selected.length ? 'Không bắt buộc workshop cụ thể.' : requiredBooths >= selected.length
        ? `Cần ${requiredBooths - selected.length} booth thường và đủ ${selected.length} workshop đã chọn. Các workshop nằm trong tổng số booth yêu cầu.`
        : 'Số workshop đã chọn vượt quá tổng số booth yêu cầu.'}
    </p>
  </div>
}
