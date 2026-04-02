'use client'

import { useQuery } from '@tanstack/react-query'
import { customAxiosInstance } from '@/lib/axios-instance'

export type RewardMilestoneStudentStatus =
  | 'eligible'
  | 'pending'
  | 'claimed'
  | 'expired'
  | 'cancelled'

export type RewardMilestoneStudentFilterStatus = 'all' | RewardMilestoneStudentStatus

export type RewardMilestoneStudentItem = {
  student: {
    id: string
    studentCode: string
    fullName: string
    email: string | null
    phone: string | null
    major: string | null
    department: string | null
    className: string | null
    year: number | null
    school: string | null
  }
  checkedInBooths: number
  requiredBooths: number
  remainingBooths: number
  eligible: boolean
  status: RewardMilestoneStudentStatus
  claim: null | {
    id: string
    requestCode: string
    status: Exclude<RewardMilestoneStudentStatus, 'eligible'>
    requestedAt: string | null
    expiresAt: string | null
    claimedAt: string | null
    confirmedByUserId: string | null
    confirmedBy: null | {
      id: string
      name: string
      email: string
    }
  }
}

export type RewardMilestoneStudentsResponse = {
  milestone: {
    id: string
    name: string
    requiredBooths: number
    description: string | null
    isActive: boolean
  }
  summary: {
    totalEligible: number
    totalPending: number
    totalClaimed: number
    totalExpired: number
    totalCancelled: number
  }
  filter: {
    status: RewardMilestoneStudentFilterStatus
    search: string | null
  }
  items: RewardMilestoneStudentItem[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export type RewardMilestoneStudentsParams = {
  status?: RewardMilestoneStudentFilterStatus
  page?: number
  pageSize?: number
  search?: string
}

const DEFAULT_STATUS: RewardMilestoneStudentFilterStatus = 'all'
const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

function buildQueryString(params: RewardMilestoneStudentsParams) {
  const query = new URLSearchParams()

  query.set('status', params.status ?? DEFAULT_STATUS)
  query.set('page', String(params.page ?? DEFAULT_PAGE))
  query.set('pageSize', String(params.pageSize ?? DEFAULT_PAGE_SIZE))

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  return query.toString()
}

async function fetchRewardMilestoneStudents(
  milestoneId: string,
  params: RewardMilestoneStudentsParams,
) {
  const queryString = buildQueryString(params)
  const res = await customAxiosInstance<{ data: RewardMilestoneStudentsResponse }>(
    `/api/rewards/milestones/${milestoneId}/students?${queryString}`,
    { method: 'GET' }
  )

  return (res as any).data as RewardMilestoneStudentsResponse
}

export function useRewardMilestoneStudents(
  milestoneId: string | null | undefined,
  params: RewardMilestoneStudentsParams,
) {
  const normalizedSearch = params.search?.trim() ?? ''

  return useQuery({
    queryKey: [
      'rewards',
      'milestone-students',
      milestoneId,
      params.status ?? DEFAULT_STATUS,
      params.page ?? DEFAULT_PAGE,
      params.pageSize ?? DEFAULT_PAGE_SIZE,
      normalizedSearch,
    ],
    queryFn: () => fetchRewardMilestoneStudents(milestoneId!, params),
    enabled: Boolean(milestoneId),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  })
}
