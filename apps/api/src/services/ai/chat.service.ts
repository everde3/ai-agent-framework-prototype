import type { AIRequestSchema, AIResponseSchema } from '@repo/service-contracts';
import type { z } from 'zod';

export type ChatRequest = z.infer<typeof AIRequestSchema>;
export type ChatResponse = z.infer<typeof AIResponseSchema>;

export class ChatService {
  async processChat(request: ChatRequest): Promise<ChatResponse> {
    // Business logic for chat processing
    // For now, returning placeholder response
    return {
      message: "hello im ai",
      type: "chat" as const
    };
  }
}