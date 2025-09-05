import type { FastifyPluginAsync } from 'fastify';
import { AIRequestSchema, AIResponseSchema, ErrorResponseSchema } from '@repo/service-contracts';
import { createTimestamp } from '@repo/isomorphic-utils';
import { ChatService } from '../../services/ai/chat.service.js';

export const chatRoute: FastifyPluginAsync = async (fastify) => {
  const chatService = new ChatService();

  fastify.post('/api/chat', async (request, reply) => {
    try {
      // Validate request body
      const validatedRequest = AIRequestSchema.parse(request.body);
      
      // Process through service
      const aiResponse = await chatService.processChat(validatedRequest);

      // Validate response with Zod
      const validatedResponse = AIResponseSchema.parse(aiResponse);
      
      reply.code(200).send(validatedResponse);
    } catch (error) {
      const errorResponse = {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500,
        timestamp: createTimestamp()
      };

      const validatedError = ErrorResponseSchema.parse(errorResponse);
      reply.code(500).send(validatedError);
    }
  });
};