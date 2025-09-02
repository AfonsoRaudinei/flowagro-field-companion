import React, { useEffect, useState } from 'react';
import { useTileOptimization } from '@/hooks/useTileOptimization';
import { useMapInstance } from '@/hooks/useMapInstance';
import { performanceMonitor } from '@/lib/performanceMonitor';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wifi, WifiOff, Zap, Clock } from 'lucide-react';

interface TileLoadingOptimizerProps {
  showDebugInfo?: boolean;
  enablePreloading?: boolean;
  className?: string;
}

/**
 * Component that optimizes map tile loading and provides visual feedback
 */
export const TileLoadingOptimizer: React.FC<TileLoadingOptimizerProps> = ({
  showDebugInfo = false,
  enablePreloading = true,
  className = ''
}) => {
  const { map, isReady } = useMapInstance();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'slow'>('online');
  const [optimizationStats, setOptimizationStats] = useState({
    tilesLoaded: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
    networkSpeed: 'unknown'
  });

  const {
    optimizeTileLoading,
    preloadCriticalTiles,
    getLoadingStats,
    clearTileCache,
    config
  } = useTileOptimization({
    enableLazyLoading: true,
    bufferSize: 1.5,
    maxConcurrentLoads: 4,
    prioritizeVisibleArea: true,
    networkAdaptive: true,
    deviceAdaptive: true
  });

  // Monitor network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection;
      
      if (!navigator.onLine) {
        setNetworkStatus('offline');
      } else if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '2g' || effectiveType === 'slow-2g') {
          setNetworkStatus('slow');
        } else {
          setNetworkStatus('online');
        }
      } else {
        setNetworkStatus('online');
      }
    };

    updateNetworkStatus();

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Monitor connection changes if available
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  // Monitor tile loading progress
  useEffect(() => {
    if (!map || !isReady) return;

    let loadStartTime: number;
    let tilesLoadedCount = 0;
    let totalLoadTime = 0;

    const handleDataLoading = (e: any) => {
      if (e.dataType === 'source') {
        setIsLoading(true);
        loadStartTime = performance.now();
        performanceMonitor.startTimer('tile-loading-batch');
      }
    };

    const handleData = (e: any) => {
      if (e.dataType === 'source' && e.isSourceLoaded) {
        const loadTime = performance.now() - loadStartTime;
        totalLoadTime += loadTime;
        tilesLoadedCount++;
        
        setIsLoading(false);
        performanceMonitor.endTimer('tile-loading-batch');
        
        // Update stats
        setOptimizationStats(prev => ({
          ...prev,
          tilesLoaded: tilesLoadedCount,
          averageLoadTime: totalLoadTime / tilesLoadedCount
        }));

        // Update progress based on visible sources
        const loadingStats = getLoadingStats();
        const progress = loadingStats.queueSize > 0 
          ? ((loadingStats.loadedCount) / (loadingStats.loadedCount + loadingStats.queueSize)) * 100
          : 100;
        setLoadingProgress(progress);
      }
    };

    const handleStyleLoad = () => {
      if (enablePreloading) {
        // Preload tiles for current view
        setTimeout(() => {
          preloadCriticalTiles();
        }, 500);
      }
    };

    map.on('dataloading', handleDataLoading);
    map.on('data', handleData);
    map.on('style.load', handleStyleLoad);

    return () => {
      map.off('dataloading', handleDataLoading);
      map.off('data', handleData);
      map.off('style.load', handleStyleLoad);
    };
  }, [map, isReady, enablePreloading, preloadCriticalTiles, getLoadingStats]);

  // Initialize optimization
  useEffect(() => {
    if (isReady) {
      optimizeTileLoading();
    }
  }, [isReady, optimizeTileLoading]);

  if (!showDebugInfo && !isLoading) {
    return null;
  }

  return (
    <div className={`tile-loading-optimizer ${className}`}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-4 right-4 z-50">
          <Card className="p-3 bg-background/95 backdrop-blur-sm border-primary/20">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Carregando tiles...</span>
              {loadingProgress > 0 && (
                <div className="w-20">
                  <Progress value={loadingProgress} className="h-1" />
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Network status indicator */}
      <div className="fixed top-16 right-4 z-40">
        <Badge variant={networkStatus === 'online' ? 'default' : 'destructive'} className="gap-1">
          {networkStatus === 'offline' ? (
            <WifiOff className="h-3 w-3" />
          ) : (
            <Wifi className="h-3 w-3" />
          )}
          {networkStatus === 'offline' ? 'Offline' : networkStatus === 'slow' ? 'Rede lenta' : 'Online'}
        </Badge>
      </div>

      {/* Debug information */}
      {showDebugInfo && (
        <div className="fixed bottom-4 left-4 z-40">
          <Card className="p-4 bg-background/95 backdrop-blur-sm border-primary/20">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Otimização de Tiles</span>
              </div>
              
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between gap-4">
                  <span>Tiles carregados:</span>
                  <span>{optimizationStats.tilesLoaded}</span>
                </div>
                
                <div className="flex justify-between gap-4">
                  <span>Tempo médio:</span>
                  <span>{Math.round(optimizationStats.averageLoadTime)}ms</span>
                </div>
                
                <div className="flex justify-between gap-4">
                  <span>Max concorrentes:</span>
                  <span>{config.maxConcurrentLoads}</span>
                </div>
                
                <div className="flex justify-between gap-4">
                  <span>Buffer size:</span>
                  <span>{config.bufferSize}x</span>
                </div>
              </div>

              <div className="flex gap-1 pt-2">
                <Badge variant="outline" className="text-xs">
                  {networkStatus}
                </Badge>
                {config.networkAdaptive && (
                  <Badge variant="outline" className="text-xs">
                    Adaptativo
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};