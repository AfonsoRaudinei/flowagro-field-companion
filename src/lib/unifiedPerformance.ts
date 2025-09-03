import React, { useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

/**
 * Unified Performance System - FASE 5 Optimized
 * Smart metrics with device-based sampling and batch uploads
 * Minimal overhead in production
 */

// ============= INTELLIGENT METRICS SYSTEM =============

interface DevicePerformanceProfile {
  cpu: 'low' | 'medium' | 'high';
  memory: 'low' | 'medium' | 'high';
  network: 'slow' | 'fast';
  battery: 'low' | 'high';
}

interface MetricsBatch {
  timestamp: number;
  sessionId: string;
  metrics: PerformanceMetrics[];
  deviceProfile: DevicePerformanceProfile;
}

class IntelligentMetricsSystem {
  private static instance: IntelligentMetricsSystem;
  private deviceProfile: DevicePerformanceProfile;
  private metricsBatch: PerformanceMetrics[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private sessionId: string;
  private samplingRate: number = 0.01; // Default 1%
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.deviceProfile = this.detectDeviceProfile();
    this.samplingRate = this.calculateSamplingRate();
    
    // Only initialize in development or with explicit flag
    if (this.shouldInitialize()) {
      this.initializeBatchUpload();
    }
  }

  static getInstance(): IntelligentMetricsSystem {
    if (!IntelligentMetricsSystem.instance) {
      IntelligentMetricsSystem.instance = new IntelligentMetricsSystem();
    }
    return IntelligentMetricsSystem.instance;
  }

  private shouldInitialize(): boolean {
    return import.meta.env.DEV || 
           import.meta.env.VITE_ENABLE_METRICS === 'true' ||
           localStorage.getItem('flowagro-enable-metrics') === 'true';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectDeviceProfile(): DevicePerformanceProfile {
    const memory = (navigator as any).deviceMemory || 4;
    const connection = (navigator as any).connection;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    return {
      cpu: hardwareConcurrency >= 8 ? 'high' : hardwareConcurrency >= 4 ? 'medium' : 'low',
      memory: memory >= 8 ? 'high' : memory >= 4 ? 'medium' : 'low',
      network: connection?.effectiveType === '4g' || connection?.downlink > 10 ? 'fast' : 'slow',
      battery: (navigator as any).getBattery ? 'high' : 'low' // Simplified detection
    };
  }

  private calculateSamplingRate(): number {
    if (!this.shouldInitialize()) return 0;
    
    // Device-based sampling rate
    let rate = 0.01; // Base 1%
    
    // Adjust based on device profile
    if (this.deviceProfile.cpu === 'low') rate *= 0.5;
    if (this.deviceProfile.memory === 'low') rate *= 0.5;
    if (this.deviceProfile.network === 'slow') rate *= 0.3;
    
    // Higher rate in development
    if (import.meta.env.DEV) rate *= 10;
    
    return Math.min(rate, 0.1); // Cap at 10%
  }

  shouldSample(): boolean {
    return Math.random() < this.samplingRate;
  }

  addMetric(metric: PerformanceMetrics): void {
    if (!this.shouldInitialize() || !this.shouldSample()) return;
    
    this.metricsBatch.push({
      ...metric,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });

    // Batch size based on device performance
    const maxBatchSize = this.deviceProfile.memory === 'low' ? 10 : 
                        this.deviceProfile.memory === 'medium' ? 25 : 50;

    if (this.metricsBatch.length >= maxBatchSize) {
      this.flushBatch();
    }
  }

  private initializeBatchUpload(): void {
    // Batch upload interval based on network
    const uploadInterval = this.deviceProfile.network === 'slow' ? 60000 : 30000;
    
    this.batchTimeout = setInterval(() => {
      if (this.metricsBatch.length > 0) {
        this.flushBatch();
      }
    }, uploadInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushBatch(true);
    });

    // Flush on visibility change (mobile apps)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.metricsBatch.length > 0) {
        this.flushBatch(true);
      }
    });
  }

  private flushBatch(immediate: boolean = false): void {
    if (this.metricsBatch.length === 0) return;

    const batch: MetricsBatch = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metrics: [...this.metricsBatch],
      deviceProfile: this.deviceProfile
    };

    this.metricsBatch = [];

    if (import.meta.env.DEV) {
      logger.debug('Metrics batch flushed', {
        count: batch.metrics.length,
        deviceProfile: batch.deviceProfile,
        immediate
      });
    }

    // In production, this would send to analytics endpoint
    if (!import.meta.env.DEV) {
      this.sendBatchToAnalytics(batch, immediate);
    }
  }

  private async sendBatchToAnalytics(batch: MetricsBatch, immediate: boolean): Promise<void> {
    try {
      // Use sendBeacon for immediate sends (page unload)
      if (immediate && navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/metrics', JSON.stringify(batch));
        return;
      }

      // Regular fetch for scheduled uploads
      await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
        keepalive: immediate
      });
    } catch (error) {
      // Fail silently to avoid impacting user experience
      if (import.meta.env.DEV) {
        logger.error('Failed to send metrics batch', { error });
      }
    }
  }

  getDeviceProfile(): DevicePerformanceProfile {
    return { ...this.deviceProfile };
  }

  getSamplingRate(): number {
    return this.samplingRate;
  }

  destroy(): void {
    if (this.batchTimeout) {
      clearInterval(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.flushBatch(true);
  }
}

// ============= HOOKS =============

/**
 * Debounce hook for optimizing performance on rapid input changes
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

/**
 * Throttle hook for limiting function calls per time period
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - (now - lastCallRef.current));
    }
  }, [callback, delay]) as T;
}

// ============= INTERFACES =============

interface PerformanceMetrics {
  renderTime?: number;
  memoryUsage?: number;
  apiCallDuration?: number;
  cacheHitRate?: number;
  gpsLatency?: number;
  mapTileLoadTime?: number;
}

interface PerformanceConfig {
  maxRenderTime: number;
  maxMemoryThreshold: number;
  enableMetricsCollection: boolean;
  sampleRate: number; // 0.0 to 1.0
}

// ============= PERFORMANCE MONITOR =============

class UnifiedPerformanceMonitor {
  private config: PerformanceConfig = {
    maxRenderTime: 16, // 60fps target
    maxMemoryThreshold: 100, // MB
    enableMetricsCollection: import.meta.env.DEV, // Only collect in dev mode
    sampleRate: 0.01 // 1% sampling (reduced from 10%)
  };

  private metrics: Map<string, PerformanceMetrics> = new Map();
  private timers: Map<string, number> = new Map();

  /**
   * Start timing a performance-critical operation
   */
  startTimer(key: string): void {
    if (!this.shouldCollectMetrics()) return;
    this.timers.set(key, performance.now());
  }

  /**
   * End timing and record the metric
   */
  endTimer(key: string, threshold?: number): number {
    if (!this.shouldCollectMetrics()) return 0;
    
    const startTime = this.timers.get(key);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.timers.delete(key);

    // Store metric in dev mode only
    if (import.meta.env.DEV) {
      const current = this.metrics.get(key) || {};
      this.metrics.set(key, { ...current, renderTime: duration });

      // Log if exceeds threshold
      if (threshold && duration > threshold) {
        logger.warn('Performance threshold exceeded', {
          operation: key,
          duration: Math.round(duration),
          threshold
        });
      }
    }

    return duration;
  }

  /**
   * Measure function execution with automatic timing
   */
  measure<T>(key: string, fn: () => T): T {
    this.startTimer(key);
    const result = fn();
    this.endTimer(key);
    return result;
  }

  /**
   * Measure async function execution
   */
  async measureAsync<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(key);
    const result = await fn();
    this.endTimer(key);
    return result;
  }

  /**
   * Record GPS-related performance metrics
   */
  recordGPSMetrics(operation: string, latency: number, accuracy?: number): void {
    if (!this.shouldCollectMetrics()) return;

    if (import.meta.env.DEV) {
      logger.info('GPS operation performance', {
        operation,
        latency: Math.round(latency),
        accuracy,
        timestamp: Date.now()
      });

      // Track GPS performance issues
      if (latency > 5000) { // > 5 seconds
        logger.warn('Slow GPS response', {
          operation,
          latency: Math.round(latency)
        });
      }
    }
  }

  /**
   * Record map tile loading performance
   */
  recordMapTileMetrics(tilesLoaded: number, loadTime: number): void {
    if (!this.shouldCollectMetrics()) return;

    const avgLoadTime = loadTime / tilesLoaded;
    
    if (import.meta.env.DEV) {
      logger.info('Map tiles loaded', {
        tilesCount: tilesLoaded,
        totalLoadTime: Math.round(loadTime),
        averageLoadTime: Math.round(avgLoadTime),
        timestamp: Date.now()
      });

      // Track slow tile loading
      if (avgLoadTime > 1000) { // > 1 second per tile
        logger.warn('Slow map tile loading', {
          averageLoadTime: Math.round(avgLoadTime),
          tilesCount: tilesLoaded
        });
      }
    }
  }

  /**
   * Record memory usage (dev mode only)
   */
  recordMemoryUsage(context?: string): void {
    if (!this.shouldCollectMetrics() || !import.meta.env.DEV || !('memory' in performance)) return;

    const memory = (performance as any).memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    
    if (usedMB > this.config.maxMemoryThreshold) {
      logger.warn('High memory usage detected', {
        usedMemoryMB: usedMB,
        totalMemoryMB: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        context: context || 'unknown'
      });
    }

    logger.info('Memory usage', {
      usedMemoryMB: usedMB,
      context,
      timestamp: Date.now()
    });
  }

  /**
   * Record API call performance
   */
  recordAPICall(endpoint: string, duration: number, status: number, cached = false): void {
    if (!this.shouldCollectMetrics()) return;

    if (import.meta.env.DEV) {
      logger.info('API call performance', {
        endpoint,
        duration: Math.round(duration),
        status,
        cached,
        timestamp: Date.now()
      });

      // Track slow API calls
      if (duration > 3000 && !cached) { // > 3 seconds
        logger.warn('Slow API response', {
          endpoint,
          duration: Math.round(duration),
          status
        });
      }
    }
  }

  /**
   * Get current performance summary (dev mode only)
   */
  getPerformanceSummary(): Record<string, any> {
    if (!import.meta.env.DEV) return {};

    const summary: Record<string, any> = {};

    // Add memory info if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      summary.memory = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024)
      };
    }

    // Add collected metrics
    summary.metrics = Object.fromEntries(this.metrics);

    return summary;
  }

  /**
   * Clear collected metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  /**
   * Check if we should collect metrics based on sampling rate and dev mode
   */
  private shouldCollectMetrics(): boolean {
    return (
      this.config.enableMetricsCollection &&
      Math.random() < this.config.sampleRate
    );
  }

  /**
   * Update configuration
   */
  configure(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// ============= UTILITIES =============

/**
 * Shallow compare utility for React.memo
 */
export function shallowEqual<T extends Record<string, any>>(
  obj1: T, 
  obj2: T
): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Memory usage monitoring (Development only)
 */
export class MemoryMonitor {
  static logMemoryUsage(context?: string): void {
    if (!import.meta.env.DEV || !(performance as any).memory) return;
    
    const memory = (performance as any).memory;
    const used = Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100;
    const total = Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100;
    
    console.log(`[MEMORY${context ? ` ${context}` : ''}] Used: ${used}MB / Total: ${total}MB`);
  }
}

/**
 * Batch updates utility for reducing re-renders
 */
export function batchUpdates<T>(
  updates: Array<() => void>,
  callback?: () => void
): void {
  // Use React's unstable_batchedUpdates if available
  if (typeof (window as any).React?.unstable_batchedUpdates === 'function') {
    (window as any).React.unstable_batchedUpdates(() => {
      updates.forEach(update => update());
      callback?.();
    });
  } else {
    // Fallback to sequential updates
    updates.forEach(update => update());
    callback?.();
  }
}

// ============= REACT HOOKS =============

/**
 * React hook for component performance monitoring
 */
export function usePerformanceMonitoring(componentName: string) {
  const monitor = React.useRef(performanceMonitor);
  
  React.useEffect(() => {
    monitor.current.startTimer(`component_${componentName}_mount`);
    return () => {
      monitor.current.endTimer(`component_${componentName}_mount`, 100); // 100ms threshold
    };
  }, [componentName]);

  const measureRender = React.useCallback((renderKey: string) => {
    const key = `${componentName}_${renderKey}`;
    monitor.current.startTimer(key);
    
    return () => {
      monitor.current.endTimer(key, 16); // 16ms for 60fps
    };
  }, [componentName]);

  return { measureRender };
}

// ============= EXPORTS =============

// Export singleton instance
export const performanceMonitor = new UnifiedPerformanceMonitor();
export const intelligentMetrics = IntelligentMetricsSystem.getInstance();

// Export legacy aliases for compatibility
export const PerformanceMonitor = {
  start: (key: string) => performanceMonitor.startTimer(key),
  end: (key: string) => performanceMonitor.endTimer(key),
  measure: <T>(key: string, fn: () => T) => performanceMonitor.measure(key, fn),
  measureAsync: <T>(key: string, fn: () => Promise<T>) => performanceMonitor.measureAsync(key, fn)
};

// Export types
export type { PerformanceMetrics, PerformanceConfig };