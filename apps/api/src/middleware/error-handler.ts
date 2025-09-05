import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import type { LoggingConfig } from '../config/logging.js';
import { createLogger } from './logging.js';

/**
 * Error classification types for better analytics and alerting
 */
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_API = 'external_api',
  DATABASE = 'database',
  TIMEOUT = 'timeout',
  INTERNAL = 'internal',
  BAD_REQUEST = 'bad_request'
}

/**
 * Error severity levels for CloudWatch alerting
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Enhanced error interface with classification
 */
interface ClassifiedError extends Error {
  statusCode?: number;
  code?: string;
  type?: ErrorType;
  severity?: ErrorSeverity;
  endpoint?: string;
  userId?: string;
  correlationId?: string;
  details?: Record<string, unknown>;
  isOperational?: boolean;
  retryable?: boolean;
}

/**
 * Error classification rules based on error patterns
 */
const ERROR_CLASSIFICATION_RULES = [
  {
    test: (error: FastifyError) => error.statusCode === 400 || error.validation,
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW
  },
  {
    test: (error: FastifyError) => error.statusCode === 401,
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM
  },
  {
    test: (error: FastifyError) => error.statusCode === 403,
    type: ErrorType.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM
  },
  {
    test: (error: FastifyError) => error.statusCode === 404,
    type: ErrorType.NOT_FOUND,
    severity: ErrorSeverity.LOW
  },
  {
    test: (error: FastifyError) => error.statusCode === 429,
    type: ErrorType.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM
  },
  {
    test: (error: FastifyError) => error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED',
    type: ErrorType.EXTERNAL_API,
    severity: ErrorSeverity.HIGH
  },
  {
    test: (error: FastifyError) => error.code === 'ETIMEDOUT',
    type: ErrorType.TIMEOUT,
    severity: ErrorSeverity.HIGH
  },
  {
    test: (error: FastifyError) => error.message?.toLowerCase().includes('database') || 
                                   error.message?.toLowerCase().includes('mongodb') ||
                                   error.message?.toLowerCase().includes('connection'),
    type: ErrorType.DATABASE,
    severity: ErrorSeverity.CRITICAL
  }
];

/**
 * Classify error based on patterns and characteristics
 */
function classifyError(error: FastifyError, request?: FastifyRequest): ClassifiedError {
  const classified: ClassifiedError = {
    ...error,
    type: ErrorType.INTERNAL,
    severity: ErrorSeverity.HIGH,
    endpoint: request?.url,
    correlationId: request?.correlationId,
    isOperational: false,
    retryable: false
  };

  // Apply classification rules
  for (const rule of ERROR_CLASSIFICATION_RULES) {
    if (rule.test(error)) {
      classified.type = rule.type;
      classified.severity = rule.severity;
      break;
    }
  }

  // Determine if error is operational (expected) vs programming error
  classified.isOperational = [
    ErrorType.VALIDATION,
    ErrorType.AUTHENTICATION,
    ErrorType.AUTHORIZATION,
    ErrorType.NOT_FOUND,
    ErrorType.RATE_LIMIT
  ].includes(classified.type!);

  // Determine if error is retryable
  classified.retryable = [
    ErrorType.EXTERNAL_API,
    ErrorType.DATABASE,
    ErrorType.TIMEOUT,
    ErrorType.RATE_LIMIT
  ].includes(classified.type!);

  // Set status code if not already set
  if (!classified.statusCode) {
    classified.statusCode = getStatusCodeForErrorType(classified.type!);
  }

  return classified;
}

/**
 * Get appropriate HTTP status code for error type
 */
function getStatusCodeForErrorType(type: ErrorType): number {
  switch (type) {
    case ErrorType.VALIDATION:
    case ErrorType.BAD_REQUEST:
      return 400;
    case ErrorType.AUTHENTICATION:
      return 401;
    case ErrorType.AUTHORIZATION:
      return 403;
    case ErrorType.NOT_FOUND:
      return 404;
    case ErrorType.TIMEOUT:
      return 408;
    case ErrorType.RATE_LIMIT:
      return 429;
    case ErrorType.EXTERNAL_API:
    case ErrorType.DATABASE:
    case ErrorType.INTERNAL:
    default:
      return 500;
  }
}

/**
 * Sanitize error details for logging (remove sensitive information)
 */
function sanitizeErrorDetails(error: ClassifiedError, config: LoggingConfig): ClassifiedError {
  const sanitized = { ...error };
  
  // Remove sensitive fields from error details
  if (sanitized.details) {
    const sensitivePatterns = config.sensitiveBodyFields;
    for (const [key, value] of Object.entries(sanitized.details)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitivePatterns.some(pattern => 
        lowerKey.includes(pattern.toLowerCase())
      );
      
      if (isSensitive) {
        sanitized.details[key] = '[REDACTED]';
      }
    }
  }

  // Sanitize error message if it contains sensitive information
  if (sanitized.message) {
    let message = sanitized.message;
    config.sensitiveBodyFields.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b[:\\s]*[^\\s]+`, 'gi');
      message = message.replace(regex, `${pattern}: [REDACTED]`);
    });
    sanitized.message = message;
  }

  return sanitized;
}

/**
 * Create standardized error response
 */
function createErrorResponse(error: ClassifiedError): object {
  const response: Record<string, unknown> = {
    error: error.name || 'Internal Server Error',
    message: error.message,
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString()
  };

  // Add correlation ID if available
  if (error.correlationId) {
    response.correlationId = error.correlationId;
  }

  // Add error code if available
  if (error.code) {
    response.code = error.code;
  }

  // Add retry information for retryable errors
  if (error.retryable && error.type) {
    response.retryAfter = getRetryAfterSeconds(error.type);
    response.retryable = true;
  }

  // Add validation details for validation errors
  if (error.type === ErrorType.VALIDATION && (error as any).validation) {
    response.validation = (error as any).validation;
  }

  return response;
}

/**
 * Get retry-after seconds for different error types
 */
function getRetryAfterSeconds(type: ErrorType): number {
  switch (type) {
    case ErrorType.RATE_LIMIT:
      return 60; // 1 minute
    case ErrorType.EXTERNAL_API:
    case ErrorType.TIMEOUT:
      return 5; // 5 seconds
    case ErrorType.DATABASE:
      return 30; // 30 seconds
    default:
      return 10; // 10 seconds
  }
}

/**
 * Enhanced error handler with classification and detailed logging
 */
export function createErrorHandler(config: LoggingConfig) {
  const logger = createLogger(config);
  
  return async function errorHandler(
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    // Classify the error
    const classifiedError = classifyError(error, request);
    
    // Sanitize error for logging
    const sanitizedError = sanitizeErrorDetails(classifiedError, config);
    
    // Log error with appropriate level based on severity
    const logLevel = getLogLevelForSeverity(sanitizedError.severity || ErrorSeverity.HIGH);
    const logMessage = `${sanitizedError.type} error on ${sanitizedError.endpoint}`;
    
    const errorContext = {
      type: sanitizedError.type,
      severity: sanitizedError.severity,
      statusCode: sanitizedError.statusCode,
      endpoint: sanitizedError.endpoint,
      correlationId: sanitizedError.correlationId,
      isOperational: sanitizedError.isOperational,
      retryable: sanitizedError.retryable,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      method: request.method,
      url: request.url,
      details: sanitizedError.details
    };

    switch (logLevel) {
      case 'error':
        logger.error(logMessage, sanitizedError, errorContext);
        break;
      case 'warn':
        logger.warn(logMessage, errorContext);
        break;
      default:
        logger.info(logMessage, errorContext);
    }

    // Create standardized error response
    const errorResponse = createErrorResponse(sanitizedError);
    
    // Send error response
    reply.code(sanitizedError.statusCode || 500).send(errorResponse);
    
    // Trigger alerts for critical errors
    if (sanitizedError.severity === ErrorSeverity.CRITICAL) {
      await triggerAlert(sanitizedError, request);
    }
  };
}

/**
 * Get log level based on error severity
 */
function getLogLevelForSeverity(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.MEDIUM:
      return 'warn';
    case ErrorSeverity.LOW:
    default:
      return 'info';
  }
}

/**
 * Trigger alert for critical errors (placeholder for alert integration)
 */
async function triggerAlert(error: ClassifiedError, request: FastifyRequest): Promise<void> {
  // This is where you would integrate with your alerting system
  // Examples: PagerDuty, SNS, Slack, etc.
  
  const alertData = {
    severity: 'CRITICAL',
    service: 'ai-agent-api',
    error: error.message,
    endpoint: error.endpoint,
    correlationId: error.correlationId,
    timestamp: new Date().toISOString(),
    context: {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip
    }
  };

  // Log alert for now (replace with actual alert service)
  console.error('[ALERT]', JSON.stringify(alertData));
  
  // TODO: Integrate with actual alerting service
  // await alertService.send(alertData);
}

/**
 * Create a custom error with classification
 */
export function createError(
  message: string,
  statusCode: number,
  type: ErrorType = ErrorType.INTERNAL,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  details?: Record<string, unknown>
): ClassifiedError {
  const error = new Error(message) as ClassifiedError;
  error.statusCode = statusCode;
  error.type = type;
  error.severity = severity;
  error.details = details;
  error.isOperational = true;
  
  return error;
}

/**
 * Validation error helper
 */
export function createValidationError(
  message: string,
  validationDetails?: Record<string, unknown>
): ClassifiedError {
  return createError(
    message,
    400,
    ErrorType.VALIDATION,
    ErrorSeverity.LOW,
    { validation: validationDetails }
  );
}

/**
 * Authentication error helper
 */
export function createAuthenticationError(
  message: string = 'Authentication required'
): ClassifiedError {
  return createError(
    message,
    401,
    ErrorType.AUTHENTICATION,
    ErrorSeverity.MEDIUM
  );
}

/**
 * Authorization error helper
 */
export function createAuthorizationError(
  message: string = 'Insufficient permissions'
): ClassifiedError {
  return createError(
    message,
    403,
    ErrorType.AUTHORIZATION,
    ErrorSeverity.MEDIUM
  );
}

/**
 * Not found error helper
 */
export function createNotFoundError(
  resource: string = 'Resource'
): ClassifiedError {
  return createError(
    `${resource} not found`,
    404,
    ErrorType.NOT_FOUND,
    ErrorSeverity.LOW
  );
}

/**
 * Rate limit error helper
 */
export function createRateLimitError(
  retryAfter: number = 60
): ClassifiedError {
  const error = createError(
    'Rate limit exceeded',
    429,
    ErrorType.RATE_LIMIT,
    ErrorSeverity.MEDIUM,
    { retryAfter }
  );
  error.retryable = true;
  return error;
}