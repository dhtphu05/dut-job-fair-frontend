/**
 * Custom hook for making API requests
 * Handles loading, error, and data states
 */

import { useState, useCallback, useEffect } from 'react'
import { apiClient, ApiError } from '@/lib/api-client'

interface UseApiOptions {
  autoFetch?: boolean
  retries?: number
}

interface UseApiState<T> {
  data: T | null
  error: ApiError | null
  loading: boolean
  success: boolean
}

export function useApi<T = unknown>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  options: UseApiOptions = {}
): UseApiState<T> & {
  fetch: (body?: unknown) => Promise<T | null>
  refetch: () => Promise<T | null>
} {
  const { autoFetch = false, retries = 1 } = options
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
    success: false,
  })

  const [retryCount, setRetryCount] = useState(0)

  const fetch = useCallback(
    async (body?: unknown) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        let response: T

        switch (method) {
          case 'POST':
            response = await apiClient.post<T>(endpoint, body)
            break
          case 'PUT':
            response = await apiClient.put<T>(endpoint, body)
            break
          case 'PATCH':
            response = await apiClient.patch<T>(endpoint, body)
            break
          case 'DELETE':
            response = await apiClient.delete<T>(endpoint)
            break
          case 'GET':
          default:
            response = await apiClient.get<T>(endpoint)
            break
        }

        setState({
          data: response,
          error: null,
          loading: false,
          success: true,
        })

        setRetryCount(0)
        return response
      } catch (error) {
        const apiError: ApiError =
          error instanceof Error
            ? {
                message: error.message,
                status: 0,
              }
            : (error as ApiError)

        // Auto retry on network errors
        if (retryCount < retries && apiError.status === 0) {
          setRetryCount((prev) => prev + 1)
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)))
          return fetch(body)
        }

        setState({
          data: null,
          error: apiError,
          loading: false,
          success: false,
        })

        return null
      }
    },
    [endpoint, method, retries, retryCount]
  )

  const refetch = useCallback(() => fetch(), [fetch])

  useEffect(() => {
    if (autoFetch && method === 'GET') {
      fetch()
    }
  }, [])

  return {
    ...state,
    fetch,
    refetch,
  }
}
