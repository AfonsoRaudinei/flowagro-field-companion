import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  percentage: number;
}

interface MemoryOptimizationConfig {
  threshold?: number;
  checkInterval?: number;
  onMemoryPressure?: (stats: MemoryStats) => void;
  enableLogging?: boolean;
}

/**
 * Hook for monitoring and optimizing memory usage
 */
export function useMemoryOptimization(config: MemoryOptimizationConfig = {}) {
  const {
    threshold = 0.8,
    checkInterval = 30000,
    onMemoryPressure,
    enableLogging = process.env.NODE_ENV === 'development'
  } = config;

  const intervalRef = useRef<NodeJS.Timeout>();
  const cleanupTasksRef = useRef<Array<() => void>>([]);

  // Get memory stats if available
  const getMemoryStats = useCallback(() => {
    if (!('memory' in performance)) return null;
    
    const memory = (performance as any).memory;
    const stats: MemoryStats = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      percentage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
    };
    
    return stats;
  }, []);

  // Check memory usage
  const checkMemoryUsage = useCallback(() => {
    const stats = getMemoryStats();
    if (!stats) return;

    if (enableLogging) {
      logger.debug('Memory usage:', {
        used: `${(stats.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(stats.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(stats.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        percentage: `${(stats.percentage * 100).toFixed(1)}%`
      });
    }

    if (stats.percentage > threshold) {
      if (enableLogging) {
        logger.warn('Memory pressure detected', stats);
      }
      
      // Run cleanup tasks
      cleanupTasksRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          logger.error('Error during memory cleanup:', error);
        }
      });

      // Trigger callback
      if (onMemoryPressure) {
        onMemoryPressure(stats);
      }

      // Suggest garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }
    }
  }, [threshold, onMemoryPressure, enableLogging, getMemoryStats]);

  // Register cleanup task
  const registerCleanupTask = useCallback((cleanup: () => void) => {
    cleanupTasksRef.current.push(cleanup);
    
    // Return unregister function
    return () => {
      const index = cleanupTasksRef.current.indexOf(cleanup);
      if (index > -1) {
        cleanupTasksRef.current.splice(index, 1);
      }
    };
  }, []);

  // Force memory check
  const forceMemoryCheck = useCallback(() => {
    checkMemoryUsage();
  }, [checkMemoryUsage]);

  // Clear object pools and caches
  const clearCaches = useCallback(() => {
    // Clear any image caches
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
    });

    // Clear cached data in session storage
    try {
      const keysToClean = ['map-tiles-cache', 'image-cache', 'temp-data'];
      keysToClean.forEach(key => {
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      logger.debug('Could not clear storage cache:', error);
    }

    if (enableLogging) {
      logger.info('Memory caches cleared');
    }
  }, [enableLogging]);

  // Setup memory monitoring
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(checkMemoryUsage, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkMemoryUsage, checkInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTasksRef.current = [];
    };
  }, []);

  return {
    getMemoryStats,
    registerCleanupTask,
    forceMemoryCheck,
    clearCaches,
    isMemoryAPISupported: 'memory' in performance
  };
}