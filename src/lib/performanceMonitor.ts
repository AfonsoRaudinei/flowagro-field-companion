import React from 'react';
import { logger } from './logger';

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

class PerformanceMonitor {
  private config: PerformanceConfig = {
    maxRenderTime: 16, // 60fps target
    maxMemoryThreshold: 100, // MB
    enableMetricsCollection: import.meta.env.PROD, // Only collect in production
    sampleRate: 0.1 // 10% sampling
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

    // Store metric
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

    return duration;
  }

  /**
   * Record GPS-related performance metrics
   */
  recordGPSMetrics(operation: string, latency: number, accuracy?: number): void {
    if (!this.shouldCollectMetrics()) return;

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

  /**
   * Record map tile loading performance
   */
  recordMapTileMetrics(tilesLoaded: number, loadTime: number): void {
    if (!this.shouldCollectMetrics()) return;

    const avgLoadTime = loadTime / tilesLoaded;
    
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

  /**
   * Record memory usage
   */
  recordMemoryUsage(context?: string): void {
    if (!this.shouldCollectMetrics() || !('memory' in performance)) return;

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

  /**
   * Get current performance summary
   */
  getPerformanceSummary(): Record<string, any> {
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
   * Check if we should collect metrics based on sampling rate
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

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
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

// Export types
export type { PerformanceMetrics, PerformanceConfig };