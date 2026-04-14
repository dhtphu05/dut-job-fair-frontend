import axiosInstance from '@/lib/axios-instance'
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
  let filename = 'workshop-attendance.xls'
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
    if (filenameMatch && filenameMatch.length === 2) {
      filename = filenameMatch[1]
    }
  }

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.parentNode?.removeChild(link)
  window.URL.revokeObjectURL(url)
}
