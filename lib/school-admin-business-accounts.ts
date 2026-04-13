import { customAxiosInstance } from './axios-instance'
import type { BusinessAccountCreateInput, BusinessManagementItem } from './types'

export async function getSchoolAdminBusinessAccounts(): Promise<BusinessManagementItem[]> {
  const response = await customAxiosInstance<any>('/api/school-admin/business-accounts', {
    method: 'GET',
  })
  return ((response as any).data ?? []) as BusinessManagementItem[]
}

export async function createSchoolAdminBusinessAccount(
  data: BusinessAccountCreateInput,
): Promise<any> {
  const response = await customAxiosInstance<any>('/api/school-admin/business-accounts', {
    method: 'POST',
    data,
  })
  return (response as any).data
}

export async function deleteSchoolAdminBusinessAccount(userId: string): Promise<any> {
  const response = await customAxiosInstance<any>(`/api/school-admin/business-accounts/${userId}`, {
    method: 'DELETE',
  })
  return (response as any).data
}
