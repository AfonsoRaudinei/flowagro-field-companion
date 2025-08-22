import React from 'react';
import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  unit?: 'ms' | 'bytes' | 'count' | 'percent';
}

interface UserInteractionMetric {
  action: string;
  component: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class MetricsCollector {
  private metrics: PerformanceMetric[] = [];
  private interactions: UserInteractionMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics
  private flushInterval = 30000; // Flush every 30 seconds
  private intervalId?: NodeJS.Timeout;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupPerformanceObserver();
      this.setupUserMetrics();
      this.startAutoFlush();
    }
  }

  private setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Monitor navigation timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart, {
              type: 'navigation'
            });
            this.recordMetric('dom_ready_time', navEntry.domContentLoadedEventEnd - navEntry.fetchStart, {
              type: 'dom'
            });
            this.recordMetric('first_contentful_paint', navEntry.loadEventEnd - navEntry.fetchStart, {
              type: 'paint'
            });
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });

      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.recordMetric('long_task_duration', entry.duration, {
              type: 'longtask',
              severity: entry.duration > 100 ? 'high' : 'medium'
            }, 'ms');
            
            logger.warn('Long task detected', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
          }
        });
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Longtask not supported in all browsers
        logger.debug('Longtask observer not supported');
      }

      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric('resource_load_time', entry.duration, {
              type: 'resource',
              name: entry.name.split('/').pop() || 'unknown'
            }, 'ms');

            // Track large resources
            if (resourceEntry.transferSize && resourceEntry.transferSize > 1024 * 1024) { // > 1MB
              this.recordMetric('large_resource_size', resourceEntry.transferSize, {
                type: 'resource_size',
                name: entry.name.split('/').pop() || 'unknown'
              }, 'bytes');
            }
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

    } catch (error) {
      logger.warn('Performance observer setup failed', { error });
    }
  }

  private setupUserMetrics() {
    // Track click interactions
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const component = target.closest('[data-component]')?.getAttribute('data-component') || 
                       target.tagName.toLowerCase();
      
      this.recordInteraction('click', component, {
        targetId: target.id,
        targetClass: target.className,
        position: { x: event.clientX, y: event.clientY }
      });
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.recordInteraction('form_submit', form.id || 'form', {
        action: form.action,
        method: form.method
      });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.recordInteraction('visibility_change', 'page', {
        hidden: document.hidden
      });
    });
  }

  private startAutoFlush() {
    this.intervalId = setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);
  }

  recordMetric(
    name: string, 
    value: number, 
    tags?: Record<string, string>, 
    unit: PerformanceMetric['unit'] = 'count'
  ) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
      unit
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.splice(0, this.metrics.length - this.maxMetrics);
    }

    // Log critical metrics immediately
    if (name.includes('error') || (unit === 'ms' && value > 1000)) {
      logger.warn('Critical performance metric', metric);
    }
  }

  recordInteraction(action: string, component: string, metadata?: Record<string, any>) {
    const interaction: UserInteractionMetric = {
      action,
      component,
      timestamp: Date.now(),
      metadata
    };

    this.interactions.push(interaction);

    // Keep only recent interactions
    if (this.interactions.length > 500) {
      this.interactions.splice(0, this.interactions.length - 500);
    }
  }

  getMetrics(since?: number): PerformanceMetric[] {
    const cutoff = since || (Date.now() - 5 * 60 * 1000); // Last 5 minutes
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  getInteractions(since?: number): UserInteractionMetric[] {
    const cutoff = since || (Date.now() - 5 * 60 * 1000); // Last 5 minutes
    return this.interactions.filter(i => i.timestamp >= cutoff);
  }

  getMetricsSummary() {
    const recent = this.getMetrics();
    const summary: Record<string, any> = {};

    recent.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          unit: metric.unit
        };
      }

      summary[metric.name].count++;
      summary[metric.name].sum += metric.value;
      summary[metric.name].min = Math.min(summary[metric.name].min, metric.value);
      summary[metric.name].max = Math.max(summary[metric.name].max, metric.value);
    });

    // Calculate averages
    Object.keys(summary).forEach(key => {
      summary[key].avg = summary[key].sum / summary[key].count;
    });

    return summary;
  }

  private flushMetrics() {
    const summary = this.getMetricsSummary();
    const interactionCount = this.getInteractions().length;

    if (import.meta.env.DEV) {
      logger.debug('Performance metrics flush', {
        metricsCount: this.metrics.length,
        interactionsCount: interactionCount,
        summary: Object.keys(summary).reduce((acc, key) => {
          acc[key] = {
            count: summary[key].count,
            avg: Math.round(summary[key].avg * 100) / 100,
            unit: summary[key].unit
          };
          return acc;
        }, {} as Record<string, any>)
      });
    }

    // In production, you would send these to your analytics service
    // this.sendToAnalytics(summary, interactionCount);
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Global metrics instance
export const metrics = new MetricsCollector();

// Convenience functions
export const recordMetric = (name: string, value: number, tags?: Record<string, string>, unit?: PerformanceMetric['unit']) => {
  metrics.recordMetric(name, value, tags, unit);
};

export const recordInteraction = (action: string, component: string, metadata?: Record<string, any>) => {
  metrics.recordInteraction(action, component, metadata);
};

// React hook for component performance tracking
export const useComponentMetrics = (componentName: string) => {
  const startTime = React.useRef(Date.now());

  React.useEffect(() => {
    const mountTime = Date.now() - startTime.current;
    recordMetric(`component_mount_time`, mountTime, { component: componentName }, 'ms');

    return () => {
      const unmountTime = Date.now();
      recordMetric(`component_lifetime`, unmountTime - startTime.current, { component: componentName }, 'ms');
    };
  }, [componentName]);
};

// Memory monitoring
export const recordMemoryUsage = () => {
  if ((performance as any).memory) {
    const memory = (performance as any).memory;
    recordMetric('memory_used', memory.usedJSHeapSize, { type: 'heap' }, 'bytes');
    recordMetric('memory_total', memory.totalJSHeapSize, { type: 'heap' }, 'bytes');
    recordMetric('memory_limit', memory.jsHeapSizeLimit, { type: 'heap' }, 'bytes');
  }
};
