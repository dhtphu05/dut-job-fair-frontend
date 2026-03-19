'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Gift, Pencil, RefreshCw, Loader2, Flag, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  RewardMilestone,
  RewardMilestonePayload,
  useCreateRewardMilestone,
  useRewardMilestones,
  useUpdateRewardMilestone,
} from '@/hooks/useRewardMilestones'

type MilestoneFormState = {
  name: string
  description: string
  requiredBooths: string
  sortOrder: string
  isActive: boolean
}

const emptyForm: MilestoneFormState = {
  name: '',
  description: '',
  requiredBooths: '3',
  sortOrder: '0',
  isActive: true,
}

function mapMilestoneToForm(milestone: RewardMilestone): MilestoneFormState {
  return {
    name: milestone.name,
    description: milestone.description ?? '',
    requiredBooths: String(milestone.requiredBooths),
    sortOrder: String(milestone.sortOrder ?? 0),
    isActive: milestone.isActive,
  }
}

function buildPayload(form: MilestoneFormState): RewardMilestonePayload {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    requiredBooths: Number(form.requiredBooths),
    sortOrder: Number(form.sortOrder || 0),
    isActive: form.isActive,
  }
}

function validateForm(form: MilestoneFormState) {
  if (!form.name.trim()) return 'Vui lòng nhập tên mốc quà'

  const requiredBooths = Number(form.requiredBooths)
  if (!Number.isInteger(requiredBooths) || requiredBooths < 1) {
    return 'Số booth yêu cầu phải là số nguyên lớn hơn hoặc bằng 1'
  }

  const sortOrder = Number(form.sortOrder)
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return 'Thứ tự hiển thị phải là số nguyên lớn hơn hoặc bằng 0'
  }

  return null
}

function MilestoneDialog({
  open,
  onOpenChange,
  title,
  description,
  form,
  onFormChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  form: MilestoneFormState
  onFormChange: (patch: Partial<MilestoneFormState>) => void
  onSubmit: () => Promise<void>
  isSubmitting: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="milestone-name">Tên mốc quà</Label>
            <Input
              id="milestone-name"
              value={form.name}
              onChange={(e) => onFormChange({ name: e.target.value })}
              placeholder="Ví dụ: Móc khóa DUT Job Fair"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="milestone-description">Mô tả</Label>
            <Textarea
              id="milestone-description"
              value={form.description}
              onChange={(e) => onFormChange({ description: e.target.value })}
              placeholder="Mô tả ngắn về phần quà và điều kiện nhận"
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="milestone-required">Số booth yêu cầu</Label>
            <Input
              id="milestone-required"
              type="number"
              min={1}
              value={form.requiredBooths}
              onChange={(e) => onFormChange({ requiredBooths: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="milestone-sort-order">Thứ tự hiển thị</Label>
            <Input
              id="milestone-sort-order"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => onFormChange({ sortOrder: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
            <div>
              <p className="font-medium">Kích hoạt mốc quà</p>
              <p className="text-sm text-muted-foreground">
                Tắt đi nếu muốn ẩn khỏi flow sinh viên nhưng vẫn giữ dữ liệu.
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => onFormChange({ isActive: checked })}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={() => void onSubmit()} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu mốc quà'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RewardMilestonesPanel() {
  const { data: milestones = [], isLoading, isError, refetch, isFetching } = useRewardMilestones()
  const createMutation = useCreateRewardMilestone()
  const updateMutation = useUpdateRewardMilestone()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RewardMilestone | null>(null)
  const [createForm, setCreateForm] = useState<MilestoneFormState>(emptyForm)
  const [editForm, setEditForm] = useState<MilestoneFormState>(emptyForm)

  const stats = useMemo(() => {
    const active = milestones.filter((item) => item.isActive).length
    const inactive = milestones.length - active
    const next = [...milestones]
      .filter((item) => item.isActive)
      .sort((a, b) => a.requiredBooths - b.requiredBooths)[0]

    return {
      total: milestones.length,
      active,
      inactive,
      nextRequired: next?.requiredBooths ?? null,
    }
  }, [milestones])

  const submitCreate = async () => {
    const error = validateForm(createForm)
    if (error) {
      toast.error(error)
      return
    }

    try {
      await createMutation.mutateAsync(buildPayload(createForm))
      toast.success('Đã tạo mốc quà mới')
      setCreateOpen(false)
      setCreateForm(emptyForm)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể tạo mốc quà')
    }
  }

  const submitEdit = async () => {
    if (!editTarget) return

    const error = validateForm(editForm)
    if (error) {
      toast.error(error)
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: editTarget.id,
        payload: buildPayload(editForm),
      })
      toast.success('Đã cập nhật mốc quà')
      setEditTarget(null)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể cập nhật mốc quà')
    }
  }

  const toggleActive = async (milestone: RewardMilestone, checked: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id: milestone.id,
        payload: { isActive: checked },
      })
      toast.success(checked ? 'Đã bật mốc quà' : 'Đã tắt mốc quà')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể cập nhật trạng thái')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Tổng mốc quà</p>
            <p className="mt-2 text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Đang tắt</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{stats.inactive}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Mốc kế tiếp</p>
            <p className="mt-2 text-3xl font-bold">{stats.nextRequired ? `${stats.nextRequired} booth` : '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-blue-600" />
              Cấu hình mốc quà
            </CardTitle>
            <CardDescription>
              Tạo và điều chỉnh các mốc check-in để sinh viên đủ điều kiện nhận quà.
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button
              onClick={() => {
                setCreateForm(emptyForm)
                setCreateOpen(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm mốc quà
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              Không thể tải danh sách mốc quà. Vui lòng thử lại.
            </div>
          )}

          {!isLoading && !isError && milestones.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Chưa có mốc quà nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tạo mốc đầu tiên để frontend sinh viên bắt đầu hiển thị tiến trình đổi quà.
              </p>
              <Button
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tạo mốc quà
              </Button>
            </div>
          )}

          {!isLoading && !isError && milestones.length > 0 && (
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="rounded-2xl border border-border/70 bg-gradient-to-r from-white to-slate-50 p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          Mốc {milestone.sortOrder}
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                          {milestone.requiredBooths} booth
                        </Badge>
                        <Badge
                          className={
                            milestone.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-100'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                          }
                        >
                          {milestone.isActive ? 'Đang hoạt động' : 'Đang tắt'}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold">{milestone.name}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {milestone.description || 'Chưa có mô tả cho mốc quà này.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Flag className="h-4 w-4" />
                          <span>Yêu cầu: <span className="font-semibold text-foreground">{milestone.requiredBooths} booth</span></span>
                        </div>
                        <div className="text-muted-foreground">
                          Thứ tự hiển thị: <span className="font-semibold text-foreground">{milestone.sortOrder}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-56">
                      <div className="flex items-center justify-between rounded-xl border border-border/70 bg-white px-4 py-3">
                        <div>
                          <p className="font-medium">Hiển thị cho sinh viên</p>
                          <p className="text-xs text-muted-foreground">
                            Tắt nếu muốn ẩn mốc này khỏi public progress.
                          </p>
                        </div>
                        <Switch
                          checked={milestone.isActive}
                          onCheckedChange={(checked) => void toggleActive(milestone, checked)}
                          disabled={updateMutation.isPending}
                        />
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditTarget(milestone)
                          setEditForm(mapMilestoneToForm(milestone))
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MilestoneDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Tạo mốc quà mới"
        description="Thiết lập một milestone mới cho flow đổi quà của sinh viên."
        form={createForm}
        onFormChange={(patch) => setCreateForm((prev) => ({ ...prev, ...patch }))}
        onSubmit={submitCreate}
        isSubmitting={createMutation.isPending}
      />

      <MilestoneDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
        title="Chỉnh sửa mốc quà"
        description="Cập nhật tên, điều kiện và trạng thái hiển thị của mốc quà."
        form={editForm}
        onFormChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
        onSubmit={submitEdit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  )
}
