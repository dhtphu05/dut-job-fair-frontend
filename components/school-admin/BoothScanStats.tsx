'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { customAxiosInstance } from '@/lib/axios-instance'
import { BarChart3, Users, QrCode, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UnitType } from '@/lib/types'

interface BoothStat {
  id: string
  name: string
  business: string
  location: string | null
  type?: UnitType
  totalScans: number
  uniqueStudents: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

async function fetchBoothStats(): Promise<BoothStat[]> {
  const res = await customAxiosInstance<{ data: BoothStat[] }>('/api/school-admin/booth-stats', {
    method: 'GET',
  })
  return (res as any).data ?? []
}

function typeBadge(type?: UnitType) {
  if (type === 'workshop') {
    return {
      label: 'Hội thảo',
      className: 'bg-orange-100 text-orange-700',
    }
  }

  return {
    label: 'Booth',
    className: 'bg-blue-100 text-blue-700',
  }
}

interface BoothScanStatsProps {
  filterType?: UnitType | 'all'
}

export function BoothScanStats({ filterType = 'all' }: BoothScanStatsProps) {
  const { data: boothStats = [], isLoading, isError } = useQuery({
    queryKey: ['school-admin', 'booth-stats'],
    queryFn: fetchBoothStats,
    refetchInterval: 30_000,
  })

  const filteredStats = filterType === 'all'
    ? boothStats
    : boothStats.filter((item) => item.type === filterType)

  const totalScans = filteredStats.reduce((s, b) => s + b.totalScans, 0)
  const totalStudents = filteredStats.reduce((s, b) => s + b.uniqueStudents, 0)
  const topBooth = filteredStats.length ? filteredStats.reduce((a, b) => (b.totalScans > a.totalScans ? b : a)) : null

  const chartData = [...filteredStats]
    .sort((a, b) => b.totalScans - a.totalScans)
    .map((b) => ({
      name: b.business.length > 14 ? b.business.slice(0, 14) + '…' : b.business,
      fullName: b.business,
      unitName: b.name,
      type: b.type,
      'Tổng lượt quét': b.totalScans,
      'Sinh viên unique': b.uniqueStudents,
    }))

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-72 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Không thể tải dữ liệu thống kê gian hàng
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tổng lượt quét</p>
                <p className="text-3xl font-bold">{totalScans}</p>
              </div>
              <QrCode className="h-8 w-8 text-blue-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sinh viên unique</p>
                <p className="text-3xl font-bold">{totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Đơn vị dẫn đầu</p>
                <p className="text-lg font-bold leading-tight">{topBooth?.business ?? '—'}</p>
                {topBooth && (
                  <p className="text-sm text-muted-foreground">{topBooth.totalScans} lượt</p>
                )}
              </div>
              <TrendingUp className="h-8 w-8 text-amber-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Số lượt quét theo đơn vị
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">Chưa có lượt quét nào</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#888" style={{ fontSize: '12px' }} />
                  <YAxis allowDecimals={false} stroke="#888" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value, name) => [`${value}`, name]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                  />
                  <Legend />
                  <Bar dataKey="Tổng lượt quét" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                  <Bar dataKey="Sinh viên unique" fill="#D1D5DB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Chi tiết từng gian hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Chưa có dữ liệu</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Hạng</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Đơn vị</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Loại</th>
                    <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Tổng lượt quét</th>
                    <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Sinh viên unique</th>
                    <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Tỷ lệ quét lại</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredStats]
                    .sort((a, b) => b.totalScans - a.totalScans)
                    .map((booth, i) => {
                      const repeatRate = booth.uniqueStudents > 0
                        ? ((booth.totalScans / booth.uniqueStudents - 1) * 100).toFixed(1)
                        : '0.0'
                      return (
                        <tr key={booth.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-2">
                            <Badge
                              className={
                                i === 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : i === 1
                                  ? 'bg-gray-100 text-gray-700'
                                  : i === 2
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-muted text-muted-foreground'
                              }
                            >
                              #{i + 1}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 font-medium">
                            <div className="font-semibold text-slate-900">{booth.business}</div>
                            <div className="text-xs text-muted-foreground">{booth.name}</div>
                          </td>
                          <td className="py-3 px-2">
                            <Badge className={cn('border-transparent', typeBadge(booth.type).className)}>
                              {typeBadge(booth.type).label}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-right font-semibold">{booth.totalScans}</td>
                          <td className="py-3 px-2 text-right">{booth.uniqueStudents}</td>
                          <td className="py-3 px-2 text-right text-muted-foreground">{repeatRate}%</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
