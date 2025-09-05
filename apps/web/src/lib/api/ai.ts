import { apiRequest } from './client';

// AI types
export interface AIRequest {
  message: string;
  type: 'chat' | 'rag' | 'prompt';
  context?: Record<string, any>;
}

export interface AIResponse {
  message: string;
  type: 'chat' | 'rag' | 'prompt';
  sources?: string[];
  error?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface RAGQuery {
  query: string;
  files?: FileList;
}

export interface PromptTemplate {
  template: string;
  variables: Record<string, string>;
}

// AI API functions
export async function sendChatMessage(message: string): Promise<AIResponse> {
  return apiRequest<AIResponse>('/api/chat', {
    message,
    type: 'chat',
  });
}

export async function sendRAGQuery(query: string, context?: any): Promise<AIResponse> {
  return apiRequest<AIResponse>('/api/rag', {
    message: query,
    type: 'rag',
    context,
  });
}

export async function testPrompt(template: string, variables: Record<string, string>): Promise<AIResponse> {
  return apiRequest<AIResponse>('/api/prompt', {
    message: template,
    type: 'prompt',
    context: { variables },
  });
}