import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, apiRequest } from '@/lib/react-query'

/**
 * AI API types - importing from existing API module
 */
export interface AIRequest {
  message: string
  type: 'chat' | 'rag' | 'prompt'
  context?: Record<string, any>
}

export interface AIResponse {
  message: string
  type: 'chat' | 'rag' | 'prompt'
  sources?: string[]
  error?: string
}

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export interface RAGQuery {
  query: string
  files?: FileList
}

export interface PromptTemplate {
  template: string
  variables: Record<string, string>
}

/**
 * Chat API functions
 */
async function sendChatMessage(message: string): Promise<AIResponse> {
  return apiRequest<AIResponse>('/api/chat', {
    method: 'POST',
    data: {
      message,
      type: 'chat',
    }
  })
}

async function sendRAGQuery(query: string, context?: any): Promise<AIResponse> {
  return apiRequest<AIResponse>('/api/rag', {
    method: 'POST',
    data: {
      message: query,
      type: 'rag',
      context,
    }
  })
}

async function testPrompt(template: string, variables: Record<string, string>): Promise<AIResponse> {
  return apiRequest<AIResponse>('/api/prompt', {
    method: 'POST',
    data: {
      message: template,
      type: 'prompt',
      context: { variables },
    }
  })
}

/**
 * Chat mutation hook
 */
export function useChatMutation(options?: {
  onSuccess?: (data: AIResponse, variables: string) => void
  onError?: (error: Error, variables: string) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (data, variables) => {
      // Invalidate chat-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.chat() })
      options?.onSuccess?.(data, variables)
    },
    onError: options?.onError,
    // Optimistic updates could be added here
    onMutate: async (message) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.ai.chat() })
      
      // Optionally return context for rollback
      return { message }
    },
  })
}

/**
 * RAG query mutation hook
 */
export function useRAGMutation(options?: {
  onSuccess?: (data: AIResponse, variables: { query: string; context?: any }) => void
  onError?: (error: Error, variables: { query: string; context?: any }) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ query, context }: { query: string; context?: any }) => 
      sendRAGQuery(query, context),
    onSuccess: (data, variables) => {
      // Invalidate RAG-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.rag() })
      options?.onSuccess?.(data, variables)
    },
    onError: options?.onError,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.ai.rag() })
      return variables
    },
  })
}

/**
 * Prompt testing mutation hook
 */
export function usePromptMutation(options?: {
  onSuccess?: (data: AIResponse, variables: { template: string; variables: Record<string, string> }) => void
  onError?: (error: Error, variables: { template: string; variables: Record<string, string> }) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ template, variables }: { template: string; variables: Record<string, string> }) => 
      testPrompt(template, variables),
    onSuccess: (data, variables) => {
      // Invalidate prompt-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.prompt() })
      options?.onSuccess?.(data, variables)
    },
    onError: options?.onError,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.ai.prompt() })
      return variables
    },
  })
}

/**
 * Combined AI operations hook for multiple operations
 */
export function useAIMutations() {
  const chatMutation = useChatMutation()
  const ragMutation = useRAGMutation()
  const promptMutation = usePromptMutation()

  return {
    chat: chatMutation,
    rag: ragMutation,
    prompt: promptMutation,
    
    // Utility methods
    isLoading: chatMutation.isPending || ragMutation.isPending || promptMutation.isPending,
    
    reset: () => {
      chatMutation.reset()
      ragMutation.reset()
      promptMutation.reset()
    }
  }
}