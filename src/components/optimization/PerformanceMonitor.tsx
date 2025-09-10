import React, { memo, useState, useEffect } from 'react';
import { performanceMonitor } from '@/lib/unifiedPerformance';
import { cn } from '@/lib/utils';

interface PerformanceStats {
  renderTime: number;
  memoryUsage: string;
  activeTimers: number;
  cacheHitRate: number;
}

interface PerformanceMonitorProps {
  className?: string;
  showOnlyOnPressure?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Development-only performance monitor component
 * Shows real-time performance metrics and memory usage
 */
export const PerformanceMonitor = memo<PerformanceMonitorProps>(({
  className,
  showOnlyOnPressure = true,
  position = 'top-right'
}) => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isVisible, setIsVisible] = useState(!showOnlyOnPressure);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const updateStats = () => {
      const memory = (performance as any).memory;
      const memoryUsage = memory 
        ? `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`
        : 'N/A';

      const activeTimers = (window as any).__activeTimers || 0;
      
      setStats({
        renderTime: performance.now(),
        memoryUsage,
        activeTimers,
        cacheHitRate: 0.85 // Mock cache hit rate
      });

      // Show monitor if memory usage is high
      if (memory && (memory.usedJSHeapSize / memory.jsHeapSizeLimit) > 0.7) {
        setIsVisible(true);
      } else if (showOnlyOnPressure) {
        setIsVisible(false);
      }
    };

    const interval = setInterval(updateStats, 2000);
    updateStats(); // Initial call

    return () => clearInterval(interval);
  }, [showOnlyOnPressure]);

  if (process.env.NODE_ENV !== 'development' || !stats || !isVisible) {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div
      className={cn(
        "fixed z-[9999] transition-all duration-300",
        positionClasses[position],
        isExpanded ? "w-64" : "w-auto",
        className
      )}
    >
      <div
        className={cn(
          "bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg",
          "text-xs text-muted-foreground",
          isExpanded ? "p-3" : "p-2"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Compact view */}
        {!isExpanded ? (
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>{stats.memoryUsage}</span>
          </div>
        ) : (
          /* Expanded view */
          <div className="space-y-2 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="font-medium">Performance</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Memory:</span>
                <span className="font-mono">{stats.memoryUsage}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Timers:</span>
                <span className="font-mono">{stats.activeTimers}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Cache:</span>
                <span className="font-mono">{(stats.cacheHitRate * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            {/* Memory pressure indicator */}
            <div className="w-full bg-muted/30 rounded-full h-1">
              <div 
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  stats.memoryUsage.includes('MB') && parseFloat(stats.memoryUsage) > 100
                    ? "bg-red-500"
                    : parseFloat(stats.memoryUsage) > 50
                    ? "bg-yellow-500"
                    : "bg-green-500"
                )}
                style={{ 
                  width: `${Math.min((parseFloat(stats.memoryUsage) / 200) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';