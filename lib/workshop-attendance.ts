import axiosInstance from '@/lib/axios-instance'
import type {
  WorkshopAttendanceExportPayload,
  WorkshopAttendanceManualInput,
  WorkshopAttendanceResponse,
} from '@/lib/types'
import * as XLSX from 'xlsx'

function getDownloadFilename(contentDisposition: string | undefined, fallback: string) {
  if (!contentDisposition) return fallback

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const basicMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  return basicMatch?.[1] ?? fallback
}

async function downloadWorkshopFile(url: string, fallbackFilename: string) {
  const response = await axiosInstance.get(url, {
    responseType: 'blob',
  })

  const blob = response.data as Blob
  const filename = getDownloadFilename(
    response.headers['content-disposition'],
    fallbackFilename,
  )

  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(blobUrl)
}

export async function getWorkshopAttendance(): Promise<WorkshopAttendanceResponse> {
  const response = await axiosInstance.get('/api/business-admin/workshop-attendance')
  return response.data?.data
}

export async function downloadWorkshopAttendanceCsv() {
  await downloadWorkshopFile(
    '/api/business-admin/workshop-attendance/export',
    `workshop-attendance-${new Date().toISOString().split('T')[0]}.csv`,
  )
}

export async function downloadWorkshopAttendanceExcel() {
  const response = await axiosInstance.get('/api/business-admin/workshop-attendance/export-data')
  const payload = response.data?.data as WorkshopAttendanceExportPayload | undefined

  if (!payload) {
    throw new Error('Không nhận được dữ liệu xuất Excel')
  }

  const workbook = XLSX.utils.book_new()
  const headers = payload.columns.map((column) => column.title)
  const rows = payload.rows.map((row) =>
    payload.columns.map((column) => row[column.key] ?? ''),
  )

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  worksheet['!cols'] = payload.columns.map((column) => ({
    wch: Math.max(
      column.title.length + 4,
      ...payload.rows.map((row) => String(row[column.key] ?? '').length + 2),
    ),
  }))

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    payload.sheetName || 'Điểm danh hội thảo',
  )

  const normalizedName = payload.fileName?.replace(/\.xls$/i, '.xlsx')
    || `workshop-attendance-${new Date().toISOString().split('T')[0]}.xlsx`

  XLSX.writeFile(workbook, normalizedName)
}

export async function addWorkshopAttendanceManual(data: WorkshopAttendanceManualInput) {
  const response = await axiosInstance.post('/api/business-admin/workshop-attendance/manual', data)
  return response.data?.data
}

export async function deleteWorkshopAttendance(studentCode: string) {
  const response = await axiosInstance.delete(`/api/business-admin/workshop-attendance/${studentCode}`)
  return response.data?.data
}
