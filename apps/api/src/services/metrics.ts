import type { LoggingConfig } from '../config/logging.js';

/**
 * Metric data point interface
 */
interface MetricDataPoint {
  timestamp: number;
  value: number;
  endpoint?: string;
  method?: string;
  statusCode?: number;
}

/**
 * Percentile calculation result
 */
interface PercentileMetrics {
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  avg: number;
  count: number;
}

/**
 * Error tracking metrics
 */
interface ErrorMetrics {
  total: number;
  rate: number; // errors per minute
  byStatusCode: Record<number, number>;
  byEndpoint: Record<string, number>;
}

/**
 * Memory-efficient circular buffer for storing metric data points
 */
class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0;
  private size = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      const index = (this.head - this.size + i + this.capacity) % this.capacity;
      const item = this.buffer[index];
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  clear(): void {
    this.head = 0;
    this.size = 0;
    this.buffer.fill(undefined);
  }

  getSize(): number {
    return this.size;
  }

  getCapacity(): number {
    return this.capacity;
  }
}

/**
 * High-performance metrics collection service optimized for CloudWatch
 */
export class MetricsService {
  private readonly config: LoggingConfig;
  private readonly latencyBuffer: CircularBuffer<MetricDataPoint>;
  private readonly errorBuffer: CircularBuffer<MetricDataPoint>;
  private readonly requestCounts: Map<string, number> = new Map();
  private readonly errorCounts: Map<string, number> = new Map();
  private lastFlushTime: number = Date.now();
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: LoggingConfig) {
    this.config = config;
    this.latencyBuffer = new CircularBuffer(config.percentileWindowSize);
    this.errorBuffer = new CircularBuffer(config.metricsBufferSize);

    if (config.enableMetrics) {
      this.startPeriodicFlush();
    }
  }

  /**
   * Record request latency metric
   */
  recordLatency(duration: number, endpoint: string, method: string, statusCode: number): void {
    if (!this.config.enableMetrics) return;

    this.latencyBuffer.push({
      timestamp: Date.now(),
      value: duration,
      endpoint,
      method,
      statusCode
    });

    // Track request counts
    const key = `${method}:${endpoint}`;
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);
  }

  /**
   * Record error metric
   */
  recordError(statusCode: number, endpoint: string, method: string): void {
    if (!this.config.enableMetrics) return;

    this.errorBuffer.push({
      timestamp: Date.now(),
      value: 1,
      endpoint,
      method,
      statusCode
    });

    // Track error counts
    const key = `${statusCode}:${endpoint}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
  }

  /**
   * Calculate percentile metrics from current buffer
   */
  calculateLatencyPercentiles(endpoint?: string): PercentileMetrics {
    const data = this.latencyBuffer.toArray()
      .filter(point => !endpoint || point.endpoint === endpoint)
      .map(point => point.value)
      .sort((a, b) => a - b);

    if (data.length === 0) {
      return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0, count: 0 };
    }

    const count = data.length;
    const sum = data.reduce((acc, val) => acc + val, 0);
    
    return {
      p50: this.getPercentile(data, 0.5),
      p95: this.getPercentile(data, 0.95),
      p99: this.getPercentile(data, 0.99),
      min: data[0],
      max: data[count - 1],
      avg: sum / count,
      count
    };
  }

  /**
   * Calculate error metrics
   */
  calculateErrorMetrics(timeWindowMs: number = 60000): ErrorMetrics {
    const now = Date.now();
    const windowStart = now - timeWindowMs;
    
    const recentErrors = this.errorBuffer.toArray()
      .filter(point => point.timestamp >= windowStart);

    const total = recentErrors.length;
    const rate = (total / timeWindowMs) * 60000; // errors per minute

    const byStatusCode: Record<number, number> = {};
    const byEndpoint: Record<string, number> = {};

    recentErrors.forEach(error => {
      if (error.statusCode) {
        byStatusCode[error.statusCode] = (byStatusCode[error.statusCode] || 0) + 1;
      }
      if (error.endpoint) {
        byEndpoint[error.endpoint] = (byEndpoint[error.endpoint] || 0) + 1;
      }
    });

    return { total, rate, byStatusCode, byEndpoint };
  }

  /**
   * Get current memory usage metrics
   */
  getMemoryMetrics(): { heapUsed: number; heapTotal: number; external: number; rss: number } {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100 // MB
    };
  }

  /**
   * Get current CPU usage metrics
   */
  getCpuMetrics(): { user: number; system: number } {
    const usage = process.cpuUsage();
    return {
      user: usage.user,
      system: usage.system
    };
  }

  /**
   * Get comprehensive metrics summary for periodic logging
   */
  getMetricsSummary(): object {
    const latencyMetrics = this.calculateLatencyPercentiles();
    const errorMetrics = this.calculateErrorMetrics();
    const memoryMetrics = this.getMemoryMetrics();
    const cpuMetrics = this.getCpuMetrics();

    return {
      timestamp: new Date().toISOString(),
      service: this.config.service,
      environment: this.config.environment,
      version: this.config.version,
      metrics: {
        latency: latencyMetrics,
        errors: errorMetrics,
        memory: memoryMetrics,
        cpu: cpuMetrics,
        bufferUtilization: {
          latencyBuffer: {
            size: this.latencyBuffer.getSize(),
            capacity: this.latencyBuffer.getCapacity(),
            utilization: (this.latencyBuffer.getSize() / this.latencyBuffer.getCapacity()) * 100
          },
          errorBuffer: {
            size: this.errorBuffer.getSize(),
            capacity: this.errorBuffer.getCapacity(),
            utilization: (this.errorBuffer.getSize() / this.errorBuffer.getCapacity()) * 100
          }
        }
      },
      tags: {
        metricType: 'periodic-summary',
        flushInterval: this.config.metricsFlushInterval
      }
    };
  }

  /**
   * Start periodic metric flushing to logs
   */
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      try {
        const summary = this.getMetricsSummary();
        console.log(JSON.stringify(summary));
        this.lastFlushTime = Date.now();
      } catch (error) {
        console.error('Error flushing metrics:', error);
      }
    }, this.config.metricsFlushInterval);

    // Ensure interval is cleaned up on process exit
    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());
  }

  /**
   * Stop periodic metric flushing and cleanup
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Get percentile value from sorted array
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    if (sortedArray.length === 1) return sortedArray[0];

    const index = (sortedArray.length - 1) * percentile;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sortedArray[lower];
    }

    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.latencyBuffer.clear();
    this.errorBuffer.clear();
    this.requestCounts.clear();
    this.errorCounts.clear();
  }

  /**
   * Get buffer statistics for monitoring
   */
  getBufferStats(): { latency: object; error: object } {
    return {
      latency: {
        size: this.latencyBuffer.getSize(),
        capacity: this.latencyBuffer.getCapacity(),
        utilization: (this.latencyBuffer.getSize() / this.latencyBuffer.getCapacity()) * 100
      },
      error: {
        size: this.errorBuffer.getSize(),
        capacity: this.errorBuffer.getCapacity(),
        utilization: (this.errorBuffer.getSize() / this.errorBuffer.getCapacity()) * 100
      }
    };
  }
}

// Singleton instance for application-wide metrics
let metricsInstance: MetricsService | null = null;

/**
 * Get or create metrics service instance
 */
export function getMetricsService(config?: LoggingConfig): MetricsService {
  if (!metricsInstance && config) {
    metricsInstance = new MetricsService(config);
  }
  if (!metricsInstance) {
    throw new Error('Metrics service not initialized. Call with config first.');
  }
  return metricsInstance;
}

/**
 * Initialize metrics service with configuration
 */
export function initializeMetricsService(config: LoggingConfig): MetricsService {
  if (metricsInstance) {
    metricsInstance.stop();
  }
  metricsInstance = new MetricsService(config);
  return metricsInstance;
}