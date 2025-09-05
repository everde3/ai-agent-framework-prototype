import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import { type HealthResponse, HealthResponseSchema } from '@repo/service-contracts'

/**
 * Using shared health types from packages
 */
export type HealthStatus = HealthResponse

/**
 * Fetch health status from API with validation
 */
async function fetchHealthStatus(): Promise<HealthStatus> {
  const response = await fetch('/api/health')
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  
  // Validate response with Zod schema
  return HealthResponseSchema.parse(data)
}

/**
 * Hook to query health status with auto-refresh
 */
export function useHealthStatus(options?: {
  refetchInterval?: number
  enabled?: boolean
}) {
  const { refetchInterval = 30000, enabled = true } = options || {}

  return useQuery({
    queryKey: queryKeys.health.status(),
    queryFn: fetchHealthStatus,
    refetchInterval: enabled ? refetchInterval : false,
    refetchIntervalInBackground: false,
    enabled,
    // Keep data fresh
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    // Retry policy for health checks
    retry: (failureCount) => {
      // Health checks should retry more aggressively
      return failureCount < 5
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
  })
}

/**
 * Hook to manually trigger health check
 */
export function useHealthCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: fetchHealthStatus,
    onSuccess: (data) => {
      // Update the health status cache with fresh data
      queryClient.setQueryData(queryKeys.health.status(), data)
    },
    onError: (error) => {
      console.error('Manual health check failed:', error)
    }
  })
}