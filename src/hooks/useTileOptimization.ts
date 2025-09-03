import { useEffect, useCallback, useRef } from 'react';
import { useMapInstance } from './useMapInstance';
import { performanceMonitor } from '@/lib/unifiedPerformance';

interface TileOptimizationConfig {
  enableLazyLoading: boolean;
  bufferSize: number;
  maxConcurrentLoads: number;
  prioritizeVisibleArea: boolean;
  networkAdaptive: boolean;
  deviceAdaptive: boolean;
}

interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | '5g' | 'unknown';
  downlink: number;
  rtt: number;
}

/**
 * Hook for optimizing map tile loading based on device capabilities and network conditions
 */
export const useTileOptimization = (config: Partial<TileOptimizationConfig> = {}) => {
  const { map, isReady } = useMapInstance();
  const loadingQueue = useRef<Set<string>>(new Set());
  const loadedTiles = useRef<Map<string, number>>(new Map());
  
  const defaultConfig: TileOptimizationConfig = {
    enableLazyLoading: true,
    bufferSize: 1,
    maxConcurrentLoads: 4,
    prioritizeVisibleArea: true,
    networkAdaptive: true,
    deviceAdaptive: true,
    ...config
  };

  // Get network information
  const getNetworkInfo = useCallback((): NetworkInfo => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) {
      return {
        effectiveType: 'unknown',
        downlink: 10,
        rtt: 50
      };
    }

    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 10,
      rtt: connection.rtt || 50
    };
  }, []);

  // Get device capabilities
  const getDeviceCapabilities = useCallback(() => {
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const memoryGB = (navigator as any).deviceMemory || 4;
    const pixelRatio = window.devicePixelRatio || 1;
    
    return {
      cores: hardwareConcurrency,
      memory: memoryGB,
      pixelRatio,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
  }, []);

  // Calculate optimal tile loading strategy
  const calculateOptimalStrategy = useCallback(() => {
    const network = getNetworkInfo();
    const device = getDeviceCapabilities();
    
    let strategy = { ...defaultConfig };

    // Adjust based on network
    if (defaultConfig.networkAdaptive) {
      switch (network.effectiveType) {
        case '2g':
          strategy.maxConcurrentLoads = 2;
          strategy.bufferSize = 0.5;
          break;
        case '3g':
          strategy.maxConcurrentLoads = 3;
          strategy.bufferSize = 1;
          break;
        case '4g':
        case '5g':
          strategy.maxConcurrentLoads = 6;
          strategy.bufferSize = 2;
          break;
      }
    }

    // Adjust based on device
    if (defaultConfig.deviceAdaptive) {
      if (device.isMobile) {
        strategy.maxConcurrentLoads = Math.max(2, strategy.maxConcurrentLoads - 2);
      }
      
      if (device.memory < 4) {
        strategy.bufferSize = Math.max(0.5, strategy.bufferSize - 0.5);
      }
    }

    return strategy;
  }, [defaultConfig, getNetworkInfo, getDeviceCapabilities]);

  // Optimize tile loading
  const optimizeTileLoading = useCallback(() => {
    if (!map || !isReady) return;

    const strategy = calculateOptimalStrategy();
    
    // Set tile loading parameters (if method exists)
    if ((map as any).setMaxTileCacheSize) {
      (map as any).setMaxTileCacheSize(strategy.deviceAdaptive ? 200 : 500);
    }
    
    // Monitor tile loading performance
    const originalAddSource = map.addSource.bind(map);
    map.addSource = function(id: string, source: any) {
      performanceMonitor.startTimer('tile-source-' + id);
      
      const result = originalAddSource(id, source);
      
      if (source.type === 'raster' || source.type === 'raster-dem') {
        loadingQueue.current.add(id);
        
        // Clean up when source is loaded
        map.on('sourcedata', (e) => {
          if (e.sourceId === id && e.isSourceLoaded) {
            performanceMonitor.endTimer('tile-source-' + id, 1000);
            loadingQueue.current.delete(id);
            loadedTiles.current.set(id, Date.now());
          }
        });
      }
      
      return result;
    };

    return strategy;
  }, [map, isReady, calculateOptimalStrategy]);

  // Preload critical tiles
  const preloadCriticalTiles = useCallback((bounds?: [[number, number], [number, number]]) => {
    if (!map || !isReady) return;

    const strategy = calculateOptimalStrategy();
    
    if (bounds) {
      // Preload tiles for specific bounds
      map.fitBounds(bounds, { 
        padding: 100,
        animate: false,
        maxZoom: map.getZoom() + strategy.bufferSize
      });
    } else {
      // Preload tiles around current view
      const center = map.getCenter();
      const zoom = map.getZoom();
      const buffer = strategy.bufferSize;
      
      // Calculate buffer bounds
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      
      const bufferedBounds: [[number, number], [number, number]] = [
        [sw.lng - buffer, sw.lat - buffer],
        [ne.lng + buffer, ne.lat + buffer]
      ];
      
      // Trigger preload by briefly adjusting bounds
      setTimeout(() => {
        map.fitBounds(bufferedBounds, { 
          padding: 0,
          animate: false,
          maxZoom: zoom + 1
        });
        
        // Return to original view
        setTimeout(() => {
          map.setCenter(center);
          map.setZoom(zoom);
        }, 100);
      }, 50);
    }
  }, [map, isReady, calculateOptimalStrategy]);

  // Get loading statistics
  const getLoadingStats = useCallback(() => {
    return {
      queueSize: loadingQueue.current.size,
      loadedCount: loadedTiles.current.size,
      lastLoaded: Math.max(...Array.from(loadedTiles.current.values()), 0)
    };
  }, []);

  // Clear tile cache
  const clearTileCache = useCallback(() => {
    if (!map) return;
    
    loadedTiles.current.clear();
    loadingQueue.current.clear();
    
    // Force map refresh
    map.getStyle().sources && Object.keys(map.getStyle().sources).forEach(sourceId => {
      const source = map.getSource(sourceId);
      if (source && source.type === 'raster') {
        (source as any).reload?.();
      }
    });
  }, [map]);

  // Initialize optimization when map is ready
  useEffect(() => {
    if (isReady && defaultConfig.enableLazyLoading) {
      optimizeTileLoading();
    }
  }, [isReady, optimizeTileLoading, defaultConfig.enableLazyLoading]);

  return {
    optimizeTileLoading,
    preloadCriticalTiles,
    getLoadingStats,
    clearTileCache,
    config: defaultConfig
  };
};