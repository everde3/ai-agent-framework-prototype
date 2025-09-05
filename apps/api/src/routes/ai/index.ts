import type { FastifyPluginAsync } from 'fastify';
import { chatRoute } from './chat.js';
import { ragRoute } from './rag.js';
import { promptRoute } from './prompt.js';

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
  // Register AI routes
  await fastify.register(chatRoute);
  await fastify.register(ragRoute);
  await fastify.register(promptRoute);
};