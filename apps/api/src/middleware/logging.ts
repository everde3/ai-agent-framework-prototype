import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import type { LoggingConfig } from '../config/logging.js';
import { getDurationBucket, shouldLog, LOG_LEVELS } from '../config/logging.js';
import { getMetricsService } from '../services/metrics.js';
import { randomUUID } from 'crypto';

/**
 * Extend FastifyRequest type to include our custom properties
 */
declare module 'fastify' {
  interface FastifyRequest {
    correlationId?: string;
    _generatedCorrelationId?: string;
  }
}

/**
 * Correlation ID key for request context
 */
const CORRELATION_ID_HEADER = 'x-correlation-id';
const CORRELATION_ID_REQUEST_KEY = 'correlationId';

/**
 * Structured log entry interface optimized for CloudWatch
 */
interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  environment: string;
  correlationId?: string;
  request?: {
    method: string;
    url: string;
    userAgent?: string;
    ip: string;
    headers?: Record<string, unknown>;
    body?: unknown;
    query?: Record<string, unknown>;
    params?: Record<string, unknown>;
  };
  response?: {
    statusCode: number;
    headers?: Record<string, unknown>;
    body?: unknown;
  };
  metrics?: {
    duration: number;
    durationMs: number;
    durationBucket: string;
    memoryUsage?: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    cpuUsage?: {
      user: number;
      system: number;
    };
  };
  error?: {
    message: string;
    stack?: string;
    code?: string;
    details?: Record<string, unknown>;
    type?: string;
  };
  tags: {
    endpoint?: string;
    feature?: string;
    critical?: boolean;
    metricType?: string;
  };
}

/**
 * Sanitize sensitive data from objects
 */
function sanitizeObject(obj: unknown, sensitiveFields: string[]): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sensitiveFields));
  }

  const sanitized: Record<string, unknown> = {};
  const objRecord = obj as Record<string, unknown>;

  for (const [key, value] of Object.entries(objRecord)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize headers by removing sensitive information
 */
function sanitizeHeaders(headers: Record<string, unknown>, sensitiveHeaders: string[]): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveHeaders.includes(lowerKey);
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Truncate large strings or objects for logging
 */
function truncateForLogging(data: unknown, maxSize: number): unknown {
  if (typeof data === 'string') {
    return data.length > maxSize ? data.substring(0, maxSize) + '... [TRUNCATED]' : data;
  }
  
  if (data && typeof data === 'object') {
    const jsonString = JSON.stringify(data);
    if (jsonString.length > maxSize) {
      return JSON.stringify(data).substring(0, maxSize) + '... [TRUNCATED]';
    }
  }
  
  return data;
}

/**
 * Extract endpoint name from URL for tagging
 */
function extractEndpoint(url: string): string {
  // Remove query parameters and normalize path
  const path = url.split('?')[0];
  
  // Extract meaningful endpoint identifier
  if (path.includes('/health')) return 'health';
  if (path.includes('/ai/chat')) return 'ai-chat';
  if (path.includes('/ai/rag')) return 'ai-rag';
  if (path.includes('/ai/prompt')) return 'ai-prompt';
  if (path.includes('/ai')) return 'ai-general';
  
  return path.replace(/^\/+/, '').replace(/\/+/g, '-') || 'root';
}

/**
 * Determine if endpoint is critical for alerting
 */
function isCriticalEndpoint(endpoint: string): boolean {
  return ['ai-chat', 'ai-rag', 'ai-prompt'].includes(endpoint);
}

/**
 * Create structured log entry
 */
function createLogEntry(
  level: string,
  config: LoggingConfig,
  request?: FastifyRequest,
  reply?: FastifyReply,
  error?: Error,
  metrics?: LogEntry['metrics']
): LogEntry {
  const timestamp = new Date().toISOString();
  const correlationId = request?.correlationId;
  const endpoint = request ? extractEndpoint(request.url) : undefined;
  
  const entry: LogEntry = {
    timestamp,
    level,
    service: config.service,
    environment: config.environment,
    correlationId,
    tags: {
      endpoint,
      feature: endpoint?.startsWith('ai-') ? 'ai' : 'system',
      critical: endpoint ? isCriticalEndpoint(endpoint) : false,
      metricType: 'request-response'
    }
  };

  // Add request data
  if (request && config.enableRequestLogging) {
    const sanitizedHeaders = sanitizeHeaders(
      request.headers as Record<string, unknown>,
      config.sensitiveHeaders
    );
    
    const sanitizedBody = request.body 
      ? sanitizeObject(request.body, config.sensitiveBodyFields)
      : undefined;

    entry.request = {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip || request.connection?.remoteAddress || 'unknown',
      headers: sanitizedHeaders,
      body: truncateForLogging(sanitizedBody, config.maxRequestBodySize * 1024),
      query: request.query as Record<string, unknown>,
      params: request.params as Record<string, unknown>
    };
  }

  // Add response data
  if (reply && config.enableResponseLogging) {
    const responseHeaders = reply.getHeaders();
    const sanitizedResponseHeaders = sanitizeHeaders(
      responseHeaders as Record<string, unknown>,
      config.sensitiveHeaders
    );

    entry.response = {
      statusCode: reply.statusCode,
      headers: sanitizedResponseHeaders,
      // Response body is typically not logged for performance reasons
      // but can be enabled for debugging specific scenarios
    };
  }

  // Add metrics data
  if (metrics) {
    entry.metrics = metrics;
  }

  // Add error data
  if (error) {
    const stackLines = error.stack?.split('\n').slice(0, config.maxStackTraceLines) || [];
    
    entry.error = {
      message: error.message,
      stack: config.enableErrorStackTraces ? stackLines.join('\n') : undefined,
      code: (error as any).code || (error as any).statusCode?.toString(),
      type: error.constructor.name,
      details: {
        name: error.name,
        ...(error as any).details
      }
    };
  }

  return entry;
}

/**
 * Log structured entry to console (CloudWatch will capture this)
 */
function logEntry(entry: LogEntry): void {
  try {
    console.log(JSON.stringify(entry));
  } catch (error) {
    // Fallback to basic logging if JSON serialization fails
    console.log(`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.error?.message || 'Log entry'}`);
  }
}

/**
 * Enhanced logging middleware with CloudWatch optimization
 */
export function createLoggingMiddleware(config: LoggingConfig) {
  const metricsService = getMetricsService(config);

  return async function loggingMiddleware(fastify: FastifyInstance) {
    // Add correlation ID to all requests
    fastify.addHook('onRequest', async (request) => {
      if (config.enableCorrelationId) {
        const existingId = request.headers[CORRELATION_ID_HEADER] as string;
        const correlationId = existingId || randomUUID();
        
        request.correlationId = correlationId;
        
        // Add correlation ID to response headers
        if (!existingId) {
          // Store for response header injection
          request._generatedCorrelationId = correlationId;
        }
      }
    });

    // Log request start
    fastify.addHook('onRequest', async (request) => {
      if (shouldLog('info', config)) {
        const entry = createLogEntry('info', config, request);
        entry.tags.metricType = 'request-start';
        logEntry(entry);
      }
    });

    // Log response and collect metrics
    fastify.addHook('onResponse', async (request, reply) => {
      const duration = reply.elapsedTime || 0;
      const endpoint = extractEndpoint(request.url);
      
      // Record metrics
      metricsService.recordLatency(duration, endpoint, request.method, reply.statusCode);
      
      if (reply.statusCode >= 400) {
        metricsService.recordError(reply.statusCode, endpoint, request.method);
      }

      // Add correlation ID to response headers
      if (config.enableCorrelationId && request._generatedCorrelationId) {
        reply.header(CORRELATION_ID_HEADER, request._generatedCorrelationId);
      }

      // Log successful responses
      if (shouldLog('info', config) && reply.statusCode < 400) {
        const metrics: LogEntry['metrics'] = {
          duration,
          durationMs: Math.round(duration),
          durationBucket: getDurationBucket(duration, config),
          memoryUsage: metricsService.getMemoryMetrics(),
          cpuUsage: metricsService.getCpuMetrics()
        };

        const entry = createLogEntry('info', config, request, reply, undefined, metrics);
        entry.tags.metricType = 'request-success';
        logEntry(entry);
      }
    });

    // Enhanced error logging
    fastify.setErrorHandler(async (error, request, reply) => {
      const duration = reply.elapsedTime || 0;
      const endpoint = extractEndpoint(request.url);
      const statusCode = error.statusCode || 500;
      
      // Record error metrics
      metricsService.recordError(statusCode, endpoint, request.method);
      
      // Determine if we should log this error based on sampling rate
      const shouldSample = Math.random() <= config.errorSamplingRate;
      
      if (shouldSample && shouldLog('error', config)) {
        const metrics: LogEntry['metrics'] = {
          duration,
          durationMs: Math.round(duration),
          durationBucket: getDurationBucket(duration, config),
          memoryUsage: metricsService.getMemoryMetrics(),
          cpuUsage: metricsService.getCpuMetrics()
        };

        const entry = createLogEntry('error', config, request, reply, error, metrics);
        entry.tags.metricType = 'request-error';
        entry.tags.critical = isCriticalEndpoint(endpoint);
        logEntry(entry);
      }

      // Add correlation ID to error response headers
      if (config.enableCorrelationId && request._generatedCorrelationId) {
        reply.header(CORRELATION_ID_HEADER, request._generatedCorrelationId);
      }

      // Return standardized error response
      const errorResponse = {
        error: error.name || 'Internal Server Error',
        message: error.message,
        statusCode: statusCode,
        timestamp: new Date().toISOString(),
        correlationId: request.correlationId
      };

      reply.code(statusCode).send(errorResponse);
    });

    // Add health check for logging system
    fastify.get('/health/logging', async (request, reply) => {
      try {
        const bufferStats = metricsService.getBufferStats();
        const summary = metricsService.getMetricsSummary();
        
        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          logging: {
            enabled: config.enableMetrics,
            level: config.level,
            bufferStats,
            lastFlush: summary
          }
        };

        reply.code(200).send(health);
      } catch (error) {
        reply.code(500).send({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  };
}

/**
 * Middleware registration helper
 */
export async function registerLoggingMiddleware(fastify: FastifyInstance, config: LoggingConfig): Promise<void> {
  const middleware = createLoggingMiddleware(config);
  await fastify.register(middleware);
}

/**
 * Create a manual logger for application code
 */
export function createLogger(config: LoggingConfig) {
  return {
    trace: (message: string, data?: Record<string, unknown>) => {
      if (shouldLog('trace', config)) {
        const entry = createLogEntry('trace', config);
        entry.tags.metricType = 'application-log';
        (entry as any).message = message;
        (entry as any).data = data;
        logEntry(entry);
      }
    },
    
    debug: (message: string, data?: Record<string, unknown>) => {
      if (shouldLog('debug', config)) {
        const entry = createLogEntry('debug', config);
        entry.tags.metricType = 'application-log';
        (entry as any).message = message;
        (entry as any).data = data;
        logEntry(entry);
      }
    },
    
    info: (message: string, data?: Record<string, unknown>) => {
      if (shouldLog('info', config)) {
        const entry = createLogEntry('info', config);
        entry.tags.metricType = 'application-log';
        (entry as any).message = message;
        (entry as any).data = data;
        logEntry(entry);
      }
    },
    
    warn: (message: string, data?: Record<string, unknown>) => {
      if (shouldLog('warn', config)) {
        const entry = createLogEntry('warn', config);
        entry.tags.metricType = 'application-log';
        (entry as any).message = message;
        (entry as any).data = data;
        logEntry(entry);
      }
    },
    
    error: (message: string, error?: Error, data?: Record<string, unknown>) => {
      if (shouldLog('error', config)) {
        const entry = createLogEntry('error', config, undefined, undefined, error);
        entry.tags.metricType = 'application-log';
        (entry as any).message = message;
        (entry as any).data = data;
        logEntry(entry);
      }
    }
  };
}