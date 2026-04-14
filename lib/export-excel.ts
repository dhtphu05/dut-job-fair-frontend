/**
 * export-excel.ts
 * School-Admin: Export full event report to a multi-sheet Excel workbook.
 */

import * as XLSX from 'xlsx'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExportStats {
  totalVisitors: number
  totalBooths: number
  totalScans: number
}

export interface HourlyRow   { hour: number;  count: number }
export interface MajorRow    { major: string; count: number }
export interface DeptRow     { department: string; count: number }
export interface YearRow     { year: number;  count: number }
export interface DailyRow    { date: string;  count: number; uniqueStudents: number }

export interface BoothStatRow {
  id: string
  name: string
  business: string
  location?: string | null
  totalScans: number
  uniqueStudents: number
}

export interface CheckinRow {
  id: string
  checkInTime: string
  durationMinutes: number | null
  status: string
  student: {
    studentCode: string
    fullName: string
    major: string | null
    department: string | null
    className: string | null
    year: number | null
  }
  booth: {
    id: string
    name: string
    business: string | null
  }
}

export interface ExportPayload {
  stats: ExportStats
  hourlyDist: HourlyRow[]
  majorDist: MajorRow[]
  deptDist: DeptRow[]
  yearDist: YearRow[]
  dailyDist: DailyRow[]
  boothStats: BoothStatRow[]
  checkins: CheckinRow[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Column-width auto-fit helper */
function autoWidth(ws: XLSX.WorkSheet, data: unknown[][]): void {
  if (!data.length) return
  const colCount = Math.max(...data.map((r) => (r as unknown[]).length))
  const widths: number[] = Array(colCount).fill(10)
  data.forEach((row) => {
    ;(row as unknown[]).forEach((cell, ci) => {
      const len = String(cell ?? '').length
      if (len > widths[ci]) widths[ci] = Math.min(len + 2, 60)
    })
  })
  ws['!cols'] = widths.map((w) => ({ wch: w }))
}

/** Make a bold header style */
const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '1E40AF' } },  // blue-800
  alignment: { horizontal: 'center' },
}

function styledSheet(headers: string[], rows: unknown[][]): XLSX.WorkSheet {
  const data = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(data)

  // Apply header style to first row
  headers.forEach((_, ci) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: ci })
    if (!ws[cellRef]) ws[cellRef] = { v: headers[ci] }
    ws[cellRef].s = HEADER_STYLE
  })

  autoWidth(ws, data)
  return ws
}

const VN_OFFSET_MS = 7 * 60 * 60 * 1000

function toVNDate(iso: string): Date {
  const utc = iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z'
  return new Date(new Date(utc).getTime() + VN_OFFSET_MS)
}

function fmtDate(iso: string): string {
  try {
    const d = toVNDate(iso)
    const day = d.getUTCDate().toString().padStart(2, '0')
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0')
    const year = d.getUTCFullYear()
    const h = d.getUTCHours().toString().padStart(2, '0')
    const m = d.getUTCMinutes().toString().padStart(2, '0')
    const s = d.getUTCSeconds().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${h}:${m}:${s}`
  } catch {
    return iso
  }
}

function dayLabel(iso: string): string {
  try {
    const d = toVNDate(iso)
    const day = d.getUTCDate().toString().padStart(2, '0')
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0')
    const year = d.getUTCFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return iso
  }
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function exportSchoolAdminExcel(payload: ExportPayload, filename?: string): void {
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Tổng quan ─────────────────────────────────────────────────────
  const overviewRows: unknown[][] = [
    ['Chỉ số', 'Giá trị'],
    ['Sự kiện',        'DUT Job Fair 2026'],
    ['Ngày xuất báo cáo', fmtDate(new Date().toISOString())],
    ['', ''],
    ['Sinh viên tham quan (unique)', payload.stats.totalVisitors],
    ['Tổng lượt quét (check-in)',   payload.stats.totalScans],
    ['Số gian hàng',                 payload.stats.totalBooths],
    ['Trung bình lượt/gian hàng',
      payload.stats.totalBooths
        ? +(payload.stats.totalScans / payload.stats.totalBooths).toFixed(1)
        : 0],
  ]
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows)
  wsOverview['!cols'] = [{ wch: 36 }, { wch: 28 }]
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan')

  // ── Sheet 2: Phân bố theo giờ ──────────────────────────────────────────────
  const wsHourly = styledSheet(
    ['Giờ', 'Lượt quét'],
    payload.hourlyDist.map((h) => ({ hour: (h.hour + 7) % 24, count: h.count }))
      .sort((a, b) => a.hour - b.hour)
      .map((h) => [`${h.hour.toString().padStart(2, '0')}:00`, h.count]),
  )
  XLSX.utils.book_append_sheet(wb, wsHourly, 'Theo giờ')

  // ── Sheet 3: Phân bố theo ngành ────────────────────────────────────────────
  const wsMajor = styledSheet(
    ['Ngành', 'Số sinh viên'],
    payload.majorDist.map((m) => [m.major, m.count]),
  )
  XLSX.utils.book_append_sheet(wb, wsMajor, 'Theo ngành')

  // ── Sheet 4: Phân bố theo khoa ─────────────────────────────────────────────
  const wsDept = styledSheet(
    ['Khoa', 'Số sinh viên'],
    payload.deptDist.map((d) => [d.department, d.count]),
  )
  XLSX.utils.book_append_sheet(wb, wsDept, 'Theo khoa')

  // ── Sheet 5: Phân bố theo năm học ──────────────────────────────────────────
  const wsYear = styledSheet(
    ['Năm học', 'Số sinh viên'],
    payload.yearDist.map((y) => [`Năm ${y.year}`, y.count]),
  )
  XLSX.utils.book_append_sheet(wb, wsYear, 'Theo năm học')

  // ── Sheet 6: So sánh ngày ──────────────────────────────────────────────────
  const wsDaily = styledSheet(
    ['Ngày', 'Tổng lượt quét', 'Sinh viên unique'],
    payload.dailyDist.map((d) => [dayLabel(d.date), d.count, d.uniqueStudents]),
  )
  XLSX.utils.book_append_sheet(wb, wsDaily, 'So sánh ngày')

  // ── Sheet 7: Gian hàng ─────────────────────────────────────────────────────
  const wsBooth = styledSheet(
    ['Tên gian hàng', 'Công ty', 'Vị trí', 'Tổng lượt quét', 'Sinh viên unique'],
    payload.boothStats.map((b) => [b.name, b.business, b.location ?? '', b.totalScans, b.uniqueStudents]),
  )
  XLSX.utils.book_append_sheet(wb, wsBooth, 'Gian hàng')

  // ── Sheet 8: Danh sách check-in ────────────────────────────────────────────
  const wsCheckins = styledSheet(
    ['#', 'MSSV', 'Họ tên', 'Khoa', 'Lớp', 'Ngành', 'Năm', 'Gian hàng', 'Công ty', 'Thời gian check-in', 'Thời gian (phút)', 'Trạng thái'],
    payload.checkins.map((c, i) => [
      i + 1,
      c.student.studentCode,
      c.student.fullName,
      c.student.department ?? '',
      c.student.className ?? '',
      c.student.major ?? '',
      c.student.year ?? '',
      c.booth.name,
      c.booth.business ?? '',
      fmtDate(c.checkInTime),
      c.durationMinutes ?? '',
      c.status === 'completed' ? 'Hoàn thành' : 'Đang thăm',
    ]),
  )
  XLSX.utils.book_append_sheet(wb, wsCheckins, 'Danh sách check-in')

  // ── Write & Download ───────────────────────────────────────────────────────
  const date = new Date().toISOString().split('T')[0]
  const name = filename ?? `DUT-JobFair-2026-BaoCao-${date}.xlsx`
  XLSX.writeFile(wb, name)
}
