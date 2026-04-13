import axiosInstance from './axios-instance'
import type { BusinessAccountCreateInput, BusinessManagementItem } from './types'

export async function getSchoolAdminBusinessAccounts(): Promise<BusinessManagementItem[]> {
  const response = await axiosInstance.get('/api/school-admin/business-accounts')
  return response.data?.data ?? response.data ?? []
}

export async function createSchoolAdminBusinessAccount(
  data: BusinessAccountCreateInput,
): Promise<any> {
  const response = await axiosInstance.post('/api/school-admin/business-accounts', data)
  return response.data
}

export async function deleteSchoolAdminBusinessAccount(userId: string): Promise<any> {
  const response = await axiosInstance.delete(`/api/school-admin/business-accounts/${userId}`)
  return response.data
}
