import type { FastifyPluginAsync } from 'fastify';
import { healthRoute } from './health.js';
import { aiRoutes } from './ai/index.js';

export const routes: FastifyPluginAsync = async (fastify) => {
  // Register health route
  await fastify.register(healthRoute);
  
  // Register AI routes
  await fastify.register(aiRoutes);
};