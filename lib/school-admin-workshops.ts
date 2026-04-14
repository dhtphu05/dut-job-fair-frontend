import axiosInstance from '@/lib/axios-instance'
import type {
  WorkshopAccountCreateInput,
  WorkshopDetailResponse,
  WorkshopManagementItem,
} from '@/lib/types'

export async function getSchoolAdminWorkshops(): Promise<WorkshopManagementItem[]> {
  const response = await axiosInstance.get('/api/school-admin/workshops')
  return response.data?.data ?? []
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
  data: import('@/lib/types').WorkshopAccountUpdateInput,
) {
  const response = await axiosInstance.patch(`/api/school-admin/workshops/${boothId}/account`, data)
  return response.data?.data
}
