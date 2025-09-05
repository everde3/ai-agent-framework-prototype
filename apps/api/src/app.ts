import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { ErrorResponseSchema } from '@repo/service-contracts';
import { createTimestamp } from '@repo/isomorphic-utils';
import { corsMiddleware } from './middleware/cors.js';
import { routes } from './routes/index.js';
import { createLoggingConfig } from './config/logging.js';
import { initializeMetricsService } from './services/metrics.js';
import { registerLoggingMiddleware } from './middleware/logging.js';
import { createErrorHandler } from './middleware/error-handler.js';

export async function buildApp(): Promise<FastifyInstance> {
  // Initialize logging configuration
  const loggingConfig = createLoggingConfig();
  
  // Initialize metrics service
  const metricsService = initializeMetricsService(loggingConfig);
  
  const fastify = Fastify({
    // Disable default logger since we'll use our structured logging
    logger: false,
    // Enable request timing for metrics
    disableRequestLogging: false
  });

  // Register enhanced logging middleware first (before other middleware)
  await registerLoggingMiddleware(fastify, loggingConfig);

  // Register CORS middleware
  await fastify.register(corsMiddleware);

  // Register all routes
  await fastify.register(routes);

  // Enhanced error handler with classification
  const errorHandler = createErrorHandler(loggingConfig);
  fastify.setErrorHandler(errorHandler);

  // Graceful shutdown handling
  const gracefulShutdown = () => {
    console.log('Shutting down gracefully...');
    metricsService.stop();
    fastify.close().then(() => {
      console.log('Server closed successfully');
      process.exit(0);
    }).catch((err) => {
      console.error('Error during shutdown:', err);
      process.exit(1);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  return fastify;
}