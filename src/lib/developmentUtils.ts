import React from 'react';
import { logger } from '@/lib/logger';

/**
 * Development utilities with ENV conditionals
 * Only active in development mode to reduce production bundle size
 */

// ============= DEBUG LOGGING =============

export const devLog = {
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      logger.info(`[DEV] ${message}`, data);
    }
  },
  
  warn: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      logger.warn(`[DEV] ${message}`, data);
    }
  },
  
  error: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      logger.error(`[DEV] ${message}`, data);
    }
  },
  
  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      logger.debug(`[DEV] ${message}`, data);
    }
  },
  
  performance: (operation: string, duration: number, threshold: number = 100) => {
    if (import.meta.env.DEV && duration > threshold) {
      logger.warn(`[DEV PERF] ${operation} took ${Math.round(duration)}ms (threshold: ${threshold}ms)`);
    }
  }
};

// ============= DEVELOPMENT COMPONENTS =============

/**
 * HOC that only renders children in development mode
 */
export function DevOnly({ children }: { children: React.ReactNode }) {
  if (!import.meta.env.DEV) {
    return null;
  }
  
  return React.createElement(React.Fragment, null, children);
}

/**
 * Debug panel component - only in development
 */
export function DebugInfo({ data, title = "Debug Info" }: { 
  data: any; 
  title?: string; 
}) {
  if (!import.meta.env.DEV) {
    return null;
  }
  
  return React.createElement('div', {
    className: "fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-sm z-50"
  }, [
    React.createElement('h4', { 
      key: 'title',
      className: "font-bold mb-2" 
    }, title),
    React.createElement('pre', {
      key: 'content', 
      className: "whitespace-pre-wrap overflow-auto max-h-48"
    }, JSON.stringify(data, null, 2))
  ]);
}

/**
 * Performance monitor display - only in development
 */
export function PerformanceMonitor({ 
  metrics 
}: { 
  metrics: Record<string, { duration: number; count: number }> 
}) {
  if (!import.meta.env.DEV) {
    return null;
  }
  
  const sortedMetrics = Object.entries(metrics)
    .sort(([, a], [, b]) => b.duration - a.duration)
    .slice(0, 10); // Show top 10
  
  return React.createElement('div', {
    className: "fixed top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50"
  }, [
    React.createElement('h4', {
      key: 'title',
      className: "font-bold mb-2"
    }, "Performance Metrics"),
    ...sortedMetrics.map(([key, { duration, count }]) => 
      React.createElement('div', {
        key,
        className: "flex justify-between gap-2"
      }, [
        React.createElement('span', {
          key: 'key',
          className: "truncate"
        }, `${key}:`),
        React.createElement('span', {
          key: 'value'
        }, `${Math.round(duration)}ms (${count}x)`)
      ])
    )
  ]);
}

// ============= DEVELOPMENT UTILITIES =============

/**
 * Conditional feature flags for development
 */
export const devFeatures = {
  enableDiagnostics: import.meta.env.DEV,
  enablePerformanceMonitoring: import.meta.env.DEV,
  enableDebugPanel: import.meta.env.DEV,
  enableVerboseLogging: import.meta.env.DEV,
  enableMetricsCollection: import.meta.env.DEV,
  
  // Feature toggles based on ENV vars
  enableExperimentalFeatures: import.meta.env.DEV && import.meta.env.VITE_ENABLE_EXPERIMENTAL === 'true',
  enableMapDebugging: import.meta.env.DEV && import.meta.env.VITE_ENABLE_MAP_DEBUG === 'true'
};

/**
 * Development-only state inspector
 */
export function useDevStateInspector<T>(state: T, label: string) {
  if (import.meta.env.DEV) {
    React.useEffect(() => {
      devLog.debug(`State changed: ${label}`, state);
    }, [state, label]);
  }
}

/**
 * Development-only render counter
 */
export function useRenderCounter(componentName: string) {
  if (import.meta.env.DEV) {
    const renderCount = React.useRef(0);
    renderCount.current += 1;
    
    React.useEffect(() => {
      devLog.debug(`${componentName} rendered ${renderCount.current} times`);
    });
    
    return renderCount.current;
  }
  
  return 0;
}

/**
 * Development-only memory monitor
 */
export function useMemoryMonitor(intervalMs: number = 5000) {
  if (!import.meta.env.DEV) return { heapUsed: 0, heapTotal: 0 };
  
  const [memoryInfo, setMemoryInfo] = React.useState({ heapUsed: 0, heapTotal: 0 });
  
  React.useEffect(() => {
    if (!('memory' in performance)) return;
    
    const updateMemoryInfo = () => {
      const memory = (performance as any).memory;
      setMemoryInfo({
        heapUsed: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        heapTotal: Math.round(memory.totalJSHeapSize / 1024 / 1024)
      });
    };
    
    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, intervalMs);
    
    return () => clearInterval(interval);
  }, [intervalMs]);
  
  return memoryInfo;
}

// ============= PRODUCTION OPTIMIZATIONS =============

/**
 * Strip debug code in production builds
 */
export const productionOptimize = <T>(devCode: T, prodCode?: T): T | undefined => {
  return import.meta.env.DEV ? devCode : prodCode;
};

/**
 * Conditional import - only in development
 */
export const devImport = async <T>(importFn: () => Promise<T>): Promise<T | null> => {
  if (import.meta.env.DEV) {
    try {
      return await importFn();
    } catch (error) {
      devLog.error('Failed to import dev module', { error });
      return null;
    }
  }
  return null;
};