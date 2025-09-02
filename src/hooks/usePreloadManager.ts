import { useEffect, useCallback, useRef, useState } from 'react';
import { useMapInstance } from './useMapInstance';
import { globalCache } from '@/lib/cache';
import { performanceMonitor } from '@/lib/performanceMonitor';

interface PreloadTask {
  id: string;
  priority: number;
  bounds?: [[number, number], [number, number]];
  layerIds: string[];
  zoom?: number;
  estimatedSize?: number;
}

interface PreloadManagerConfig {
  maxConcurrentTasks: number;
  priorityThreshold: number;
  networkAware: boolean;
  seasonalOptimization: boolean;
  userBehaviorLearning: boolean;
}

/**
 * Hook for intelligent preloading of critical layers and data
 */
export const usePreloadManager = (config: Partial<PreloadManagerConfig> = {}) => {
  const { map, isReady } = useMapInstance();
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [preloadStats, setPreloadStats] = useState({
    completed: 0,
    failed: 0,
    cached: 0,
    totalSize: 0
  });

  const taskQueue = useRef<PreloadTask[]>([]);
  const activeTasks = useRef<Set<string>>(new Set());
  const userPatterns = useRef<Map<string, number>>(new Map());
  const abortController = useRef<AbortController | null>(null);

  const defaultConfig: PreloadManagerConfig = {
    maxConcurrentTasks: 3,
    priorityThreshold: 0.7,
    networkAware: true,
    seasonalOptimization: true,
    userBehaviorLearning: true,
    ...config
  };

  // Get current season for seasonal optimization
  const getCurrentSeason = useCallback(() => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }, []);

  // Get network quality score
  const getNetworkQuality = useCallback(() => {
    const connection = (navigator as any).connection;
    if (!connection) return 1;

    const effectiveType = connection.effectiveType;
    switch (effectiveType) {
      case '4g': return 1;
      case '3g': return 0.7;
      case '2g': return 0.3;
      default: return 0.8;
    }
  }, []);

  // Learn from user behavior
  const trackUserInteraction = useCallback((layerId: string, bounds: [[number, number], [number, number]]) => {
    if (!defaultConfig.userBehaviorLearning) return;

    const key = `${layerId}_${bounds[0][0]}_${bounds[0][1]}_${bounds[1][0]}_${bounds[1][1]}`;
    const currentCount = userPatterns.current.get(key) || 0;
    userPatterns.current.set(key, currentCount + 1);

    // Store in localStorage for persistence
    localStorage.setItem('preload_patterns', JSON.stringify(Array.from(userPatterns.current.entries())));
  }, [defaultConfig.userBehaviorLearning]);

  // Load user patterns from storage
  useEffect(() => {
    if (defaultConfig.userBehaviorLearning) {
      try {
        const stored = localStorage.getItem('preload_patterns');
        if (stored) {
          const patterns = JSON.parse(stored);
          userPatterns.current = new Map(patterns);
        }
      } catch (error) {
        console.warn('Failed to load user patterns:', error);
      }
    }
  }, [defaultConfig.userBehaviorLearning]);

  // Calculate priority score for a preload task
  const calculatePriority = useCallback((task: PreloadTask) => {
    let priority = task.priority;

    // Adjust for user behavior patterns
    if (defaultConfig.userBehaviorLearning && task.bounds) {
      const key = `${task.layerIds.join('_')}_${task.bounds[0][0]}_${task.bounds[0][1]}_${task.bounds[1][0]}_${task.bounds[1][1]}`;
      const userScore = (userPatterns.current.get(key) || 0) / 100;
      priority += userScore;
    }

    // Adjust for seasonal relevance
    if (defaultConfig.seasonalOptimization) {
      const season = getCurrentSeason();
      const seasonalLayers = {
        spring: ['ndvi', 'weather', 'planting'],
        summer: ['ndvi', 'irrigation', 'growth'],
        autumn: ['harvest', 'yield', 'ndvi'],
        winter: ['planning', 'soil', 'weather']
      };

      const relevantLayers = seasonalLayers[season as keyof typeof seasonalLayers] || [];
      const seasonalBonus = task.layerIds.some(id => 
        relevantLayers.some(relevant => id.includes(relevant))
      ) ? 0.2 : 0;
      
      priority += seasonalBonus;
    }

    // Adjust for network conditions
    if (defaultConfig.networkAware) {
      const networkQuality = getNetworkQuality();
      priority *= networkQuality;
    }

    return Math.min(priority, 1);
  }, [defaultConfig, getCurrentSeason, getNetworkQuality]);

  // Execute preload task
  const executePreloadTask = useCallback(async (task: PreloadTask, signal: AbortSignal) => {
    if (!map || !isReady || signal.aborted) return;

    activeTasks.current.add(task.id);
    
    try {
      performanceMonitor.startTimer(`preload-${task.id}`);

      // Check if data is already cached
      const cacheKey = `preload_${task.id}`;
      const cached = globalCache.get(cacheKey);
      
      if (cached) {
        setPreloadStats(prev => ({ ...prev, cached: prev.cached + 1 }));
        return;
      }

      // Simulate preloading based on task type
      if (task.bounds && task.zoom) {
        // Preload map tiles for bounds
        const originalCenter = map.getCenter();
        const originalZoom = map.getZoom();

        map.fitBounds(task.bounds, {
          padding: 50,
          maxZoom: task.zoom,
          animate: false
        });

        // Wait for tiles to load
        await new Promise<void>((resolve) => {
          const checkLoaded = () => {
            if (signal.aborted) {
              resolve();
              return;
            }
            
            if (map.loaded()) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });

        // Restore original view
        map.setCenter(originalCenter);
        map.setZoom(originalZoom);
      }

      // Cache successful preload
      globalCache.set(cacheKey, true, 1000 * 60 * 30); // 30 minutes

      setPreloadStats(prev => ({ 
        ...prev, 
        completed: prev.completed + 1,
        totalSize: prev.totalSize + (task.estimatedSize || 0)
      }));

      performanceMonitor.endTimer(`preload-${task.id}`);

    } catch (error) {
      if (!signal.aborted) {
        console.warn(`Preload task ${task.id} failed:`, error);
        setPreloadStats(prev => ({ ...prev, failed: prev.failed + 1 }));
      }
    } finally {
      activeTasks.current.delete(task.id);
    }
  }, [map, isReady]);

  // Process task queue
  const processQueue = useCallback(async () => {
    if (taskQueue.current.length === 0 || activeTasks.current.size >= defaultConfig.maxConcurrentTasks) {
      return;
    }

    // Sort tasks by priority
    const sortedTasks = taskQueue.current
      .map(task => ({ ...task, calculatedPriority: calculatePriority(task) }))
      .filter(task => task.calculatedPriority >= defaultConfig.priorityThreshold)
      .sort((a, b) => b.calculatedPriority - a.calculatedPriority);

    if (sortedTasks.length === 0) {
      setIsPreloading(false);
      return;
    }

    setIsPreloading(true);

    // Execute high-priority tasks
    const tasksToExecute = sortedTasks.slice(0, defaultConfig.maxConcurrentTasks - activeTasks.current.size);
    
    if (!abortController.current) {
      abortController.current = new AbortController();
    }

    const promises = tasksToExecute.map(task => {
      // Remove from queue
      taskQueue.current = taskQueue.current.filter(t => t.id !== task.id);
      return executePreloadTask(task, abortController.current!.signal);
    });

    await Promise.allSettled(promises);

    // Update progress
    const totalTasks = sortedTasks.length;
    const completedTasks = preloadStats.completed + preloadStats.cached;
    setPreloadProgress(totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0);

    // Continue processing if there are more tasks
    if (taskQueue.current.length > 0) {
      setTimeout(processQueue, 100);
    } else {
      setIsPreloading(false);
    }
  }, [calculatePriority, defaultConfig, executePreloadTask, preloadStats]);

  // Add preload task
  const addPreloadTask = useCallback((task: Omit<PreloadTask, 'id'>) => {
    const newTask: PreloadTask = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...task
    };

    taskQueue.current.push(newTask);
    processQueue();

    return newTask.id;
  }, [processQueue]);

  // Preload critical layers for current view
  const preloadCurrentView = useCallback((layerIds: string[], bufferFactor = 1.5) => {
    if (!map || !isReady) return;

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const buffer = {
      lng: (ne.lng - sw.lng) * (bufferFactor - 1) / 2,
      lat: (ne.lat - sw.lat) * (bufferFactor - 1) / 2
    };

    const bufferedBounds: [[number, number], [number, number]] = [
      [sw.lng - buffer.lng, sw.lat - buffer.lat],
      [ne.lng + buffer.lng, ne.lat + buffer.lat]
    ];

    return addPreloadTask({
      priority: 0.8,
      bounds: bufferedBounds,
      layerIds,
      zoom: map.getZoom() + 1
    });
  }, [map, isReady, addPreloadTask]);

  // Clear all preload tasks
  const clearPreloadTasks = useCallback(() => {
    taskQueue.current = [];
    
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }

    activeTasks.current.clear();
    setIsPreloading(false);
    setPreloadProgress(0);
  }, []);

  // Track map interactions for learning
  useEffect(() => {
    if (!map || !isReady || !defaultConfig.userBehaviorLearning) return;

    const handleMoveEnd = () => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const boundsArray: [[number, number], [number, number]] = [
        [sw.lng, sw.lat],
        [ne.lng, ne.lat]
      ];

      // Track interaction with visible layers
      const style = map.getStyle();
      const visibleLayers = style.layers?.filter(layer => {
        const layout = layer.layout as any;
        return !layout || layout.visibility !== 'none';
      }).map(layer => layer.id) || [];

      visibleLayers.forEach(layerId => {
        trackUserInteraction(layerId, boundsArray);
      });
    };

    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, isReady, defaultConfig.userBehaviorLearning, trackUserInteraction]);

  return {
    addPreloadTask,
    preloadCurrentView,
    clearPreloadTasks,
    isPreloading,
    preloadProgress,
    preloadStats,
    queueLength: taskQueue.current.length,
    activeTasks: activeTasks.current.size
  };
};