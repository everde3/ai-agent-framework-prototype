import { z } from 'zod';

/**
 * Logging configuration schema for CloudWatch-optimized structured logging
 */
export const LoggingConfigSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  service: z.string().default('ai-agent-api'),
  version: z.string().default('0.1.0'),
  enableMetrics: z.boolean().default(true),
  enableCorrelationId: z.boolean().default(true),
  enableRequestLogging: z.boolean().default(true),
  enableResponseLogging: z.boolean().default(true),
  enableErrorStackTraces: z.boolean().default(true),
  
  // Metric collection settings
  metricsFlushInterval: z.number().default(60000), // 60 seconds
  metricsBufferSize: z.number().default(1000),
  percentileWindowSize: z.number().default(10000),
  
  // Request/Response sanitization
  sensitiveHeaders: z.array(z.string()).default([
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-session-id'
  ]),
  sensitiveBodyFields: z.array(z.string()).default([
    'password',
    'token',
    'secret',
    'key',
    'credentials',
    'auth'
  ]),
  
  // Performance settings
  maxRequestBodySize: z.number().default(1024), // KB for logging
  maxResponseBodySize: z.number().default(1024), // KB for logging
  maxStackTraceLines: z.number().default(50),
  
  // Error sampling for high-volume scenarios
  errorSamplingRate: z.number().min(0).max(1).default(1.0), // 100% by default
  
  // CloudWatch specific settings
  logGroupName: z.string().optional(),
  logStreamPrefix: z.string().default('api-'),
  
  // Duration buckets for performance analysis
  durationBuckets: z.array(z.object({
    min: z.number(),
    max: z.number(),
    label: z.string()
  })).default([
    { min: 0, max: 50, label: '0-50ms' },
    { min: 50, max: 100, label: '50-100ms' },
    { min: 100, max: 200, label: '100-200ms' },
    { min: 200, max: 500, label: '200-500ms' },
    { min: 500, max: 1000, label: '500ms-1s' },
    { min: 1000, max: 5000, label: '1s-5s' },
    { min: 5000, max: Infinity, label: '5s+' }
  ])
});

export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;

/**
 * Create logging configuration from environment variables
 */
export function createLoggingConfig(): LoggingConfig {
  const config = {
    environment: process.env.NODE_ENV || 'development',
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    service: process.env.SERVICE_NAME || 'ai-agent-api',
    version: process.env.npm_package_version || '0.1.0',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    enableCorrelationId: process.env.ENABLE_CORRELATION_ID !== 'false',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
    enableResponseLogging: process.env.ENABLE_RESPONSE_LOGGING !== 'false',
    enableErrorStackTraces: process.env.ENABLE_ERROR_STACK_TRACES !== 'false',
    
    metricsFlushInterval: parseInt(process.env.METRICS_FLUSH_INTERVAL || '60000'),
    metricsBufferSize: parseInt(process.env.METRICS_BUFFER_SIZE || '1000'),
    percentileWindowSize: parseInt(process.env.PERCENTILE_WINDOW_SIZE || '10000'),
    
    maxRequestBodySize: parseInt(process.env.MAX_REQUEST_BODY_SIZE || '1024'),
    maxResponseBodySize: parseInt(process.env.MAX_RESPONSE_BODY_SIZE || '1024'),
    maxStackTraceLines: parseInt(process.env.MAX_STACK_TRACE_LINES || '50'),
    
    errorSamplingRate: parseFloat(process.env.ERROR_SAMPLING_RATE || '1.0'),
    
    logGroupName: process.env.CLOUDWATCH_LOG_GROUP,
    logStreamPrefix: process.env.LOG_STREAM_PREFIX || 'api-'
  };

  return LoggingConfigSchema.parse(config);
}

/**
 * Log levels with numeric values for comparison
 */
export const LOG_LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
} as const;

/**
 * Check if a log level should be logged based on current configuration
 */
export function shouldLog(level: keyof typeof LOG_LEVELS, config: LoggingConfig): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
}

/**
 * Get duration bucket label for a given duration in milliseconds
 */
export function getDurationBucket(duration: number, config: LoggingConfig): string {
  const bucket = config.durationBuckets.find(b => duration >= b.min && duration < b.max);
  return bucket?.label || 'unknown';
}

/**
 * Default configuration instance
 */
export const defaultLoggingConfig = createLoggingConfig();