import axiosInstance from '@/lib/axios-instance'

export type GraduationBatch = {
  code: string
  label: string
  totalStudents: number
  totalCheckins: number
}

export async function getSchoolAdminGraduationBatches(): Promise<GraduationBatch[]> {
  const response = await axiosInstance.get('/api/school-admin/graduation-batches')
  return response.data?.data ?? []
}
