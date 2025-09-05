import type { FastifyPluginAsync } from 'fastify';
import { HealthResponseSchema, ErrorResponseSchema } from '@repo/service-contracts';
import { createTimestamp } from '@repo/isomorphic-utils';

// Store server start time for uptime calculation
const startTime = Date.now();

export const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    try {
      const uptimeSeconds = (Date.now() - startTime) / 1000;
      
      const healthResponse = {
        status: 'healthy' as const,
        timestamp: createTimestamp(),
        uptime: uptimeSeconds,
        version: process.env.npm_package_version || '0.1.0'
      };

      // Validate response with Zod
      const validatedResponse = HealthResponseSchema.parse(healthResponse);
      
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