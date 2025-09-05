import type { FastifyPluginAsync } from 'fastify';
import cors from '@fastify/cors';

export const corsMiddleware: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  });
};