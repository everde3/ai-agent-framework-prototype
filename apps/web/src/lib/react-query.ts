import { QueryClient } from '@tanstack/react-query';

/**
 * Query client configuration for TanStack Query
 * Provides sensible defaults for caching, error handling, and retries
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh
      staleTime: 1000 * 60 * 5, // 5 minutes
      
      // Cache time: How long data stays in cache after component unmount
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (disabled by default for better UX)
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

/**
 * Query key factory for consistent key generation
 * Helps with cache invalidation and organization
 */
export const queryKeys = {
  // Health-related queries
  health: {
    all: ['health'] as const,
    status: () => [...queryKeys.health.all, 'status'] as const,
  },
  
  // AI-related queries
  ai: {
    all: ['ai'] as const,
    chat: (conversationId?: string) => 
      conversationId 
        ? [...queryKeys.ai.all, 'chat', conversationId] as const
        : [...queryKeys.ai.all, 'chat'] as const,
    rag: (documentId?: string) => 
      documentId 
        ? [...queryKeys.ai.all, 'rag', documentId] as const
        : [...queryKeys.ai.all, 'rag'] as const,
    prompt: (promptId?: string) => 
      promptId 
        ? [...queryKeys.ai.all, 'prompt', promptId] as const
        : [...queryKeys.ai.all, 'prompt'] as const,
  },
} as const;

/**
 * Common error types for API requests
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Enhanced fetch wrapper with better error handling
 */
export async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit & { data?: any } = {}
): Promise<T> {
  const { data, ...fetchOptions } = options;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  };

  if (data && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`http://localhost:3001${endpoint}`, config);

    if (!response.ok) {
      throw new ApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    // Handle empty responses (e.g., 204 No Content)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}