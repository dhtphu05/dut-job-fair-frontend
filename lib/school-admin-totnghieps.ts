import axiosInstance from '@/lib/axios-instance'
import * as XLSX from 'xlsx'
import type {
  CreateManagedUnitInput,
  ManagedUnitDetailResponse,
  ManagedUnitItem,
  WorkshopAccountCreateInput,
  WorkshopAccountUpdateInput,
} from '@/lib/types'

export async function getSchoolAdminTotnghieps(): Promise<ManagedUnitItem[]> {
  const response = await axiosInstance.get('/api/school-admin/totnghieps')
  return response.data?.data ?? []
}

export async function createSchoolAdminTotnghiep(data: CreateManagedUnitInput) {
  const response = await axiosInstance.post('/api/school-admin/totnghieps', data)
  return response.data
}

export async function getSchoolAdminTotnghiepDetail(boothId: string): Promise<ManagedUnitDetailResponse> {
  const response = await axiosInstance.get(`/api/school-admin/totnghieps/${boothId}`)
  const data = response.data?.data

  return {
    workshop: data?.totnghiep,
    account: data?.account,
    stats: data?.stats,
    departmentDistribution: data?.departmentDistribution ?? [],
    recentCheckins: data?.recentCheckins ?? [],
  }
}

export async function createSchoolAdminTotnghiepAccount(
  boothId: string,
  data: WorkshopAccountCreateInput,
) {
  const response = await axiosInstance.post(`/api/school-admin/totnghieps/${boothId}/account`, data)
  return response.data?.data
}

export async function updateSchoolAdminTotnghiepAccount(
  boothId: string,
  data: WorkshopAccountUpdateInput,
) {
  const response = await axiosInstance.patch(`/api/school-admin/totnghieps/${boothId}/account`, data)
  return response.data?.data
}

export const downloadSchoolAdminTotnghiepAttendanceExcel = async (boothId: string) => {
  const response = await axiosInstance.get('/api/business-admin/totnghiep-attendance/export/excel', {
    params: { boothId },
    responseType: 'blob',
  })
  const contentDisposition = response.headers['content-disposition']
  let filename = 'totnghiep-attendance.xlsx'
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
