import type { AIRequestSchema, AIResponseSchema } from '@repo/service-contracts';
import type { z } from 'zod';

export type PromptRequest = z.infer<typeof AIRequestSchema>;
export type PromptResponse = z.infer<typeof AIResponseSchema>;

export class PromptService {
  async processPrompt(request: PromptRequest): Promise<PromptResponse> {
    // Business logic for prompt processing
    // For now, returning placeholder response
    return {
      message: "hello im ai",
      type: "prompt" as const
    };
  }
}