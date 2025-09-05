import { z } from 'zod';

/**
 * AI Agent creation input DTO
 */
export const CreateAIAgentInputDto = z.object({
  name: z.string().min(2, 'Agent name must be at least 2 characters'),
  description: z.string().optional(),
  prompt: z.string().min(10, 'Agent prompt must be at least 10 characters'),
  model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3']).optional().default('gpt-4'),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  isActive: z.boolean().optional().default(true),
});

/**
 * AI Agent response DTO
 */
export const AIAgentDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  prompt: z.string(),
  model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
  temperature: z.number(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * AI Agent update input DTO
 */
export const UpdateAIAgentInputDto = CreateAIAgentInputDto.partial();

/**
 * AI Chat message DTO
 */
export const ChatMessageDto = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string().datetime(),
});

/**
 * AI Chat session DTO
 */
export const ChatSessionDto = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().optional(),
  messages: z.array(ChatMessageDto),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Send chat message input DTO
 */
export const SendChatMessageInputDto = z.object({
  content: z.string().min(1, 'Message content is required'),
  sessionId: z.string().uuid().optional(),
});

export type CreateAIAgentInputDto = z.infer<typeof CreateAIAgentInputDto>;
export type AIAgentDto = z.infer<typeof AIAgentDto>;
export type UpdateAIAgentInputDto = z.infer<typeof UpdateAIAgentInputDto>;
export type ChatMessageDto = z.infer<typeof ChatMessageDto>;
export type ChatSessionDto = z.infer<typeof ChatSessionDto>;
export type SendChatMessageInputDto = z.infer<typeof SendChatMessageInputDto>;