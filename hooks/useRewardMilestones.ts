'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customAxiosInstance } from '@/lib/axios-instance'

export type RewardMilestone = {
  id: string
  name: string
  description?: string | null
  requiredBooths: number
  requiresSpecialStamps?: boolean
  requiredWorkshopIds?: string[] | null
  sortOrder: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type RewardMilestonePayload = {
  name: string
  description?: string
  requiredBooths: number
  requiresSpecialStamps?: boolean
  requiredWorkshopIds?: string[]
  sortOrder?: number
  isActive?: boolean
}

const rewardMilestonesQueryKey = ['rewards', 'milestones']

export type RewardWorkshop = { id: string; name: string; qrCode?: string }

export function useRewardWorkshops(enabled = true) {
  return useQuery({
    queryKey: ['rewards', 'workshops'],
    enabled,
    queryFn: async () => {
      const res = await customAxiosInstance<{ data: RewardWorkshop[] }>('/api/booths?type=workshop', { method: 'GET' })
      return res.data
    },
  })
}

async function fetchRewardMilestones() {
  const res = await customAxiosInstance<{ data: RewardMilestone[] }>(
    '/api/rewards/milestones',
    { method: 'GET' }
  )
  return (res as any).data as RewardMilestone[]
}

async function createRewardMilestone(payload: RewardMilestonePayload) {
  const res = await customAxiosInstance<{ data: RewardMilestone }>(
    '/api/rewards/milestones',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
  return (res as any).data as RewardMilestone
}

async function updateRewardMilestone({
  id,
  payload,
}: {
  id: string
  payload: Partial<RewardMilestonePayload>
}) {
  const res = await customAxiosInstance<{ data: RewardMilestone }>(
    `/api/rewards/milestones/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  )
  return (res as any).data as RewardMilestone
}

export function useRewardMilestones() {
  return useQuery({
    queryKey: rewardMilestonesQueryKey,
    queryFn: fetchRewardMilestones,
    staleTime: 30_000,
  })
}

export function useCreateRewardMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRewardMilestone,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rewardMilestonesQueryKey })
    },
  })
}

export function useUpdateRewardMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateRewardMilestone,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rewardMilestonesQueryKey })
      await queryClient.invalidateQueries({ queryKey: ['rewards', 'milestone-students'] })
    },
  })
}
