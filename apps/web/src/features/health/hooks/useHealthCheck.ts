import { useHealthStatus } from '@/lib/queries'
import { type HealthResponse } from '@repo/service-contracts'

interface UseHealthCheckResult {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHealthCheck(
  intervalMs: number = 5000
): UseHealthCheckResult {
  // Use TanStack Query hook with auto-refresh
  const healthQuery = useHealthStatus({
    refetchInterval: intervalMs,
    enabled: true,
  })
  
  // Manual health check mutation (for manual refresh)
  // const healthCheckMutation = useHealthCheckMutation()

  return {
    health: healthQuery.data || null,
    loading: healthQuery.isLoading,
    error: healthQuery.error ? (healthQuery.error as Error).message : null,
    refetch: () => {
      // Refetch the query
      healthQuery.refetch()
      // Or trigger manual health check
      // healthCheckMutation.mutate()
    },
  };
}
