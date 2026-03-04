'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Search, Filter, CheckCircle, Clock } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface StudentCheckin {
  id: string
  mssv: string
  studentName: string
  major: string
  boothName: string
  checkInTime: string
  duration: number
  status: 'ongoing' | 'completed'
}

const SAMPLE_CHECKINS: StudentCheckin[] = [
  {
    id: '1',
    mssv: 'DUT20001',
    studentName: 'Nguyễn Văn A',
    major: 'Công nghệ thông tin',
    boothName: 'Google Vietnam',
    checkInTime: '09:15',
    duration: 12,
    status: 'completed',
  },
  {
    id: '2',
    mssv: 'DUT20002',
    studentName: 'Trần Thị B',
    major: 'Quản lý kinh doanh',
    boothName: 'Samsung Vietnam',
    checkInTime: '09:22',
    duration: 8,
    status: 'completed',
  },
  {
    id: '3',
    mssv: 'DUT20003',
    studentName: 'Lê Minh C',
    major: 'Kỹ thuật phần mềm',
    boothName: 'FPT Software',
    checkInTime: '09:35',
    duration: 15,
    status: 'completed',
  },
  {
    id: '4',
    mssv: 'DUT20004',
    studentName: 'Phạm Thúy D',
    major: 'Công nghệ thông tin',
    boothName: 'Viettel Solutions',
    checkInTime: '09:48',
    duration: 10,
    status: 'completed',
  },
  {
    id: '5',
    mssv: 'DUT20005',
    studentName: 'Hoàng Anh E',
    major: 'Nhân sự',
    boothName: 'Accenture Vietnam',
    checkInTime: '10:05',
    duration: 0,
    status: 'ongoing',
  },
]

export function StudentCheckinList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMajor, setFilterMajor] = useState<string | null>(null)
  const [filterBooth, setFilterBooth] = useState<string | null>(null)

  const filteredCheckins = useMemo(() => {
    return SAMPLE_CHECKINS.filter((checkin) => {
      const matchesSearch =
        checkin.mssv.toLowerCase().includes(searchTerm.toLowerCase()) ||
        checkin.studentName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesMajor = !filterMajor || checkin.major === filterMajor
      const matchesBooth = !filterBooth || checkin.boothName === filterBooth

      return matchesSearch && matchesMajor && matchesBooth
    })
  }, [searchTerm, filterMajor, filterBooth])

  const uniqueMajors = [...new Set(SAMPLE_CHECKINS.map((c) => c.major))]
  const uniqueBooths = [...new Set(SAMPLE_CHECKINS.map((c) => c.boothName))]

  const handleExport = () => {
    // Prepare CSV content
    const headers = ['MSSV', 'Tên sinh viên', 'Ngành', 'Gian hàng', 'Thời gian check-in', 'Thời gian tham gia (phút)']
    const rows = filteredCheckins.map((c) => [
      c.mssv,
      c.studentName,
      c.major,
      c.boothName,
      c.checkInTime,
      c.duration,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Download as CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `student-checkins-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Danh sách sinh viên check-in</h3>
        <Button
          size="sm"
          onClick={handleExport}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo MSSV hoặc tên sinh viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterMajor === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterMajor(null)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Tất cả ngành
          </Button>

          {uniqueMajors.map((major) => (
            <Button
              key={major}
              variant={filterMajor === major ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMajor(major)}
            >
              {major}
            </Button>
          ))}
        </div>

        {/* Booth Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterBooth === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterBooth(null)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Tất cả gian hàng
          </Button>

          {uniqueBooths.map((booth) => (
            <Button
              key={booth}
              variant={filterBooth === booth ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterBooth(booth)}
            >
              {booth}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Tổng: {filteredCheckins.length} sinh viên check-in
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">MSSV</TableHead>
              <TableHead className="font-semibold">Tên sinh viên</TableHead>
              <TableHead className="font-semibold">Ngành</TableHead>
              <TableHead className="font-semibold">Gian hàng</TableHead>
              <TableHead className="font-semibold">Thời gian</TableHead>
              <TableHead className="font-semibold">Thời gian tham gia</TableHead>
              <TableHead className="text-center font-semibold">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCheckins.length > 0 ? (
              filteredCheckins.map((checkin) => (
                <TableRow key={checkin.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-mono text-sm font-medium">{checkin.mssv}</TableCell>
                  <TableCell className="font-medium">{checkin.studentName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{checkin.major}</TableCell>
                  <TableCell className="text-sm">{checkin.boothName}</TableCell>
                  <TableCell className="text-sm font-mono">{checkin.checkInTime}</TableCell>
                  <TableCell className="text-sm">{checkin.duration} phút</TableCell>
                  <TableCell className="text-center">
                    {checkin.status === 'completed' ? (
                      <div className="flex items-center justify-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Hoàn thành</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-blue-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium">Đang thăm</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Không có kết quả phù hợp
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 font-medium">Hoàn thành</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {filteredCheckins.filter((c) => c.status === 'completed').length}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Đang thăm</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {filteredCheckins.filter((c) => c.status === 'ongoing').length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-700 font-medium">Trung bình thời gian</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">
            {Math.round(
              filteredCheckins.reduce((sum, c) => sum + c.duration, 0) / filteredCheckins.length || 0
            )}{' '}
            phút
          </p>
        </div>
      </div>
    </div>
  )
}
