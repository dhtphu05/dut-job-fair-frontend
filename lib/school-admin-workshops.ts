import axiosInstance from '@/lib/axios-instance'
import * as XLSX from 'xlsx'
import type {
  CreateWorkshopInput,
  WorkshopAccountCreateInput,
  WorkshopDetailResponse,
  WorkshopManagementItem,
  WorkshopAccountUpdateInput,
} from '@/lib/types'

export async function getSchoolAdminWorkshops(): Promise<WorkshopManagementItem[]> {
  const response = await axiosInstance.get('/api/school-admin/workshops')
  return response.data?.data ?? []
}

export async function createSchoolAdminWorkshop(data: CreateWorkshopInput) {
  const response = await axiosInstance.post('/api/school-admin/workshops', data)
  return response.data
}

export async function getSchoolAdminWorkshopDetail(boothId: string): Promise<WorkshopDetailResponse> {
  const response = await axiosInstance.get(`/api/school-admin/workshops/${boothId}`)
  return response.data?.data
}

export async function createSchoolAdminWorkshopAccount(
  boothId: string,
  data: WorkshopAccountCreateInput,
) {
  const response = await axiosInstance.post(`/api/school-admin/workshops/${boothId}/account`, data)
  return response.data?.data
}

export async function updateSchoolAdminWorkshopAccount(
  boothId: string,
  data: WorkshopAccountUpdateInput,
) {
  const response = await axiosInstance.patch(`/api/school-admin/workshops/${boothId}/account`, data)
  return response.data?.data
}

export const downloadSchoolAdminWorkshopAttendanceExcel = async (boothId: string) => {
  const response = await axiosInstance.get('/api/business-admin/workshop-attendance/export/excel', {
    params: { boothId },
    responseType: 'blob',
  })
  const contentDisposition = response.headers['content-disposition']
  let filename = 'workshop-attendance.xlsx'
  if (contentDisposition) {
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
    if (utf8Match?.[1]) {
      filename = decodeURIComponent(utf8Match[1])
    } else {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1]
      }
    }
  }
  if (/\.xls$/i.test(filename)) {
    filename = filename.replace(/\.xls$/i, '.xlsx')
  }
  if (!/\.xlsx$/i.test(filename)) {
    filename = `${filename}.xlsx`
  }

  const arrayBuffer = await (response.data as Blob).arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  XLSX.writeFile(workbook, filename)
}
