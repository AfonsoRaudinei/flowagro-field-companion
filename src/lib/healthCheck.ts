import { supabase } from '@/integrations/supabase/client';
import { globalCache, satelliteCache } from './cache';
import { logger } from './logger';
import { recordMetric } from './metrics';

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface HealthCheckResult {
  service: string;
  status: HealthStatus;
  responseTime: number;
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  overall: HealthStatus;
  services: HealthCheckResult[];
  summary: {
    healthy: number;
    warning: number;
    critical: number;
    total: number;
  };
}

class HealthMonitor {
  private checkInterval = 60000; // Check every minute
  private intervalId?: NodeJS.Timeout;
  private lastResults: HealthCheckResult[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.startPeriodicChecks();
    }
  }

  private startPeriodicChecks() {
    // Run initial check
    this.runHealthChecks();

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.runHealthChecks();
    }, this.checkInterval);
  }

  async runHealthChecks(): Promise<SystemHealth> {
    logger.debug('Running health checks');
    
    const checks = [
      this.checkDatabase(),
      this.checkAuthentication(),
      this.checkCache(),
      this.checkLocalStorage(),
      this.checkNetworkConnectivity(),
      this.checkPerformance(),
      this.checkMemory()
    ];

    const results = await Promise.allSettled(checks);
    
    const services: HealthCheckResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          service: `unknown_${index}`,
          status: 'critical',
          responseTime: 0,
          message: `Health check failed: ${result.reason}`,
          timestamp: Date.now()
        };
      }
    });

    this.lastResults = services;

    // Calculate overall health
    const summary = {
      healthy: services.filter(s => s.status === 'healthy').length,
      warning: services.filter(s => s.status === 'warning').length,
      critical: services.filter(s => s.status === 'critical').length,
      total: services.length
    };

    const overall: HealthStatus = summary.critical > 0 ? 'critical' :
                                 summary.warning > 0 ? 'warning' :
                                 summary.healthy === summary.total ? 'healthy' : 'unknown';

    const systemHealth: SystemHealth = {
      overall,
      services,
      summary
    };

    // Record metrics
    recordMetric('system_health_score', (summary.healthy / summary.total) * 100, {}, 'percent');
    recordMetric('health_check_services_total', summary.total);
    recordMetric('health_check_services_critical', summary.critical);

    // Log critical issues
    if (overall === 'critical') {
      logger.error('System health critical', { 
        systemHealth,
        criticalServices: services.filter(s => s.status === 'critical').map(s => s.service)
      });
    } else if (overall === 'warning') {
      logger.warn('System health warning', {
        warningServices: services.filter(s => s.status === 'warning').map(s => s.service)
      });
    }

    return systemHealth;
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('producers')
        .select('count')
        .limit(1)
        .single();

      const responseTime = Date.now() - startTime;
      recordMetric('health_check_database_time', responseTime, {}, 'ms');

      if (error) {
        return {
          service: 'database',
          status: 'critical',
          responseTime,
          message: `Database error: ${error.message}`,
          timestamp: Date.now(),
          metadata: { error: error.code }
        };
      }

      const status: HealthStatus = responseTime > 2000 ? 'warning' : 'healthy';
      
      return {
        service: 'database',
        status,
        responseTime,
        message: status === 'healthy' ? 'Database responsive' : 'Database slow response',
        timestamp: Date.now()
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'database',
        status: 'critical',
        responseTime,
        message: `Database connection failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  private async checkAuthentication(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.auth.getSession();
      const responseTime = Date.now() - startTime;
      
      recordMetric('health_check_auth_time', responseTime, {}, 'ms');

      if (error) {
        return {
          service: 'authentication',
          status: 'warning',
          responseTime,
          message: `Auth error: ${error.message}`,
          timestamp: Date.now()
        };
      }

      return {
        service: 'authentication',
        status: 'healthy',
        responseTime,
        message: 'Authentication service operational',
        timestamp: Date.now(),
        metadata: { 
          hasSession: !!data.session,
          userId: data.session?.user?.id 
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'authentication',
        status: 'critical',
        responseTime,
        message: `Authentication service failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  private async checkCache(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test cache operations
      const testKey = 'health_check_test';
      const testValue = { timestamp: Date.now() };
      
      globalCache.set(testKey, testValue, 1000);
      const retrieved = globalCache.get(testKey);
      
      const responseTime = Date.now() - startTime;
      recordMetric('health_check_cache_time', responseTime, {}, 'ms');

      if (!retrieved || (retrieved as any).timestamp !== testValue.timestamp) {
        return {
          service: 'cache',
          status: 'warning',
          responseTime,
          message: 'Cache read/write test failed',
          timestamp: Date.now()
        };
      }

      const globalStats = globalCache.getStats();
      const satelliteStats = satelliteCache.getStats();

      return {
        service: 'cache',
        status: 'healthy',
        responseTime,
        message: 'Cache system operational',
        timestamp: Date.now(),
        metadata: {
          globalCache: globalStats,
          satelliteCache: satelliteStats
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'cache',
        status: 'critical',
        responseTime,
        message: `Cache system failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  private async checkLocalStorage(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const testKey = 'health_check_localStorage';
      const testValue = Date.now().toString();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      const responseTime = Date.now() - startTime;
      recordMetric('health_check_localstorage_time', responseTime, {}, 'ms');

      if (retrieved !== testValue) {
        return {
          service: 'localStorage',
          status: 'warning',
          responseTime,
          message: 'LocalStorage read/write failed',
          timestamp: Date.now()
        };
      }

      return {
        service: 'localStorage',
        status: 'healthy',
        responseTime,
        message: 'LocalStorage operational',
        timestamp: Date.now()
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'localStorage',
        status: 'warning',
        responseTime,
        message: `LocalStorage unavailable: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  private async checkNetworkConnectivity(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!navigator.onLine) {
        return {
          service: 'network',
          status: 'critical',
          responseTime: 0,
          message: 'Browser reports offline',
          timestamp: Date.now()
        };
      }

      // Simple connectivity test
      const response = await fetch('https://api.github.com', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      const responseTime = Date.now() - startTime;
      recordMetric('health_check_network_time', responseTime, {}, 'ms');

      const status: HealthStatus = responseTime > 5000 ? 'warning' : 'healthy';

      return {
        service: 'network',
        status,
        responseTime,
        message: status === 'healthy' ? 'Network connectivity good' : 'Network connectivity slow',
        timestamp: Date.now(),
        metadata: {
          connectionType: (navigator as any).connection?.effectiveType,
          downlink: (navigator as any).connection?.downlink
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'network',
        status: 'warning',
        responseTime,
        message: `Network connectivity test failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  private async checkPerformance(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const responseTime = Date.now() - startTime;

      if (!navigation) {
        return {
          service: 'performance',
          status: 'unknown',
          responseTime,
          message: 'Performance data unavailable',
          timestamp: Date.now()
        };
      }

      const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      const domReadyTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;

      recordMetric('health_check_performance_time', responseTime, {}, 'ms');
      recordMetric('page_load_time_health', pageLoadTime, {}, 'ms');

      const status: HealthStatus = pageLoadTime > 5000 ? 'warning' : 'healthy';

      return {
        service: 'performance',
        status,
        responseTime,
        message: `Page load: ${Math.round(pageLoadTime)}ms`,
        timestamp: Date.now(),
        metadata: {
          pageLoadTime: Math.round(pageLoadTime),
          domReadyTime: Math.round(domReadyTime),
          networkLatency: Math.round(navigation.responseStart - navigation.fetchStart)
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'performance',
        status: 'warning',
        responseTime,
        message: `Performance check failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  private async checkMemory(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!(performance as any).memory) {
        return {
          service: 'memory',
          status: 'unknown',
          responseTime: 0,
          message: 'Memory API not available',
          timestamp: Date.now()
        };
      }

      const memory = (performance as any).memory;
      const responseTime = Date.now() - startTime;
      
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
      
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

      recordMetric('health_check_memory_time', responseTime, {}, 'ms');
      recordMetric('memory_usage_percent', usagePercent, {}, 'percent');

      const status: HealthStatus = usagePercent > 80 ? 'critical' :
                                  usagePercent > 60 ? 'warning' : 'healthy';

      return {
        service: 'memory',
        status,
        responseTime,
        message: `Memory usage: ${usedMB}MB (${Math.round(usagePercent)}%)`,
        timestamp: Date.now(),
        metadata: {
          usedMB,
          totalMB,
          limitMB,
          usagePercent: Math.round(usagePercent)
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'memory',
        status: 'warning',
        responseTime,
        message: `Memory check failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  getLastResults(): HealthCheckResult[] {
    return [...this.lastResults];
  }

  getServiceHealth(serviceName: string): HealthCheckResult | undefined {
    return this.lastResults.find(result => result.service === serviceName);
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Global health monitor instance
export const healthMonitor = new HealthMonitor();

// Convenience functions
export const getSystemHealth = () => healthMonitor.runHealthChecks();
export const getLastHealthResults = () => healthMonitor.getLastResults();
export const getServiceHealth = (serviceName: string) => healthMonitor.getServiceHealth(serviceName);