import { useEffect, useCallback } from 'react';
import { useMemoryOptimization } from '@/hooks/useMemoryOptimization';
import { performanceMonitor } from '@/lib/unifiedPerformance';

/**
 * Specialized memory management hook for dashboard
 * Handles memory pressure and cleanup for heavy dashboard operations
 */
export function useDashboardMemory() {
  const {
    registerCleanupTask,
    forceMemoryCheck,
    clearCaches,
    isMemoryAPISupported
  } = useMemoryOptimization({
    threshold: 75, // More aggressive for dashboard
    checkInterval: 10000,
    onMemoryPressure: () => {
      console.log('[Dashboard] Memory pressure detected, triggering cleanup');
      performanceMonitor.recordMemoryUsage();
    },
    enableLogging: process.env.NODE_ENV === 'development'
  });

  // Register dashboard-specific cleanup tasks
  useEffect(() => {
    const dashboardCleanup = () => {
      // Clear performance metrics older than 5 minutes
      if (window.performance && window.performance.getEntriesByType) {
        try {
          window.performance.clearResourceTimings();
        } catch (e) {
          console.warn('[Dashboard] Performance cleanup failed:', e);
        }
      }
      
      // Clear cached chat data older than 30 minutes
      const now = Date.now();
      const maxAge = 30 * 60 * 1000; // 30 minutes
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('flowagro_chat_cache_')) {
          try {
            const data = JSON.parse(sessionStorage.getItem(key) || '{}');
            if (data.timestamp && (now - data.timestamp) > maxAge) {
              sessionStorage.removeItem(key);
            }
          } catch (e) {
            // Invalid data, remove it
            sessionStorage.removeItem(key);
          }
        }
      });
    };

    registerCleanupTask(dashboardCleanup);
  }, [registerCleanupTask]);

  const optimizeForChatExpansion = useCallback(() => {
    if (isMemoryAPISupported) {
      forceMemoryCheck();
      // Pre-emptively clear caches before heavy chat operations
      clearCaches();
    }
  }, [forceMemoryCheck, clearCaches, isMemoryAPISupported]);

  return {
    optimizeForChatExpansion,
    forceMemoryCheck,
    isMemoryAPISupported
  };
}