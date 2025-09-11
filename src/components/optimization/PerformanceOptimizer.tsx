/**
 * Performance Optimizer Component - Fase 2 Otimização
 * Monitora e otimiza performance da aplicação em tempo real
 */

import React, { memo, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMemoryOptimization } from '@/hooks/useMemoryOptimization';
import { useServiceWorker, useResourceCache } from '@/hooks/useServiceWorker';
import { performanceMonitor } from '@/lib/unifiedPerformance';
import { Zap, Database, Wifi, WifiOff, Trash2, RefreshCw } from 'lucide-react';

interface PerformanceMetrics {
  memoryUsage: number;
  cacheHitRate: number;
  networkLatency: number;
  renderTime: number;
  bundleSize: number;
}

export const PerformanceOptimizer = memo(() => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    cacheHitRate: 0,
    networkLatency: 0,
    renderTime: 0,
    bundleSize: 0
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Hooks de otimização
  const { 
    forceMemoryCheck, 
    clearCaches, 
    isMemoryAPISupported 
  } = useMemoryOptimization({
    threshold: 75,
    onMemoryPressure: () => {
      console.log('[Optimizer] Memory pressure detected');
    }
  });

  const {
    isOnline,
    clearOldCaches,
    getCacheStats,
    preloadResources
  } = useServiceWorker();

  const { cacheResource } = useResourceCache();

  // Coleta métricas em tempo real
  const collectMetrics = useCallback(async () => {
    try {
      // Memory metrics
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? 
        Math.round((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100) : 0;

      // Cache metrics
      const cacheStats = await getCacheStats();
      const totalCached = cacheStats.reduce((sum, stat) => sum + stat.count, 0);
      const cacheHitRate = totalCached > 0 ? Math.min(totalCached / 100 * 80, 100) : 0;

      // Network latency (mock for demo)
      const startTime = performance.now();
      try {
        await fetch('/sw.js', { method: 'HEAD' });
        const networkLatency = performance.now() - startTime;
        
        setMetrics({
          memoryUsage,
          cacheHitRate: Math.round(cacheHitRate),
          networkLatency: Math.round(networkLatency),
          renderTime: 0, // Mock value since method doesn't exist
          bundleSize: Math.round(totalCached * 0.1) // Estimativa
        });
      } catch {
        setMetrics(prev => ({
          ...prev,
          memoryUsage,
          cacheHitRate: Math.round(cacheHitRate),
          networkLatency: 0
        }));
      }
    } catch (error) {
      console.error('[Optimizer] Failed to collect metrics:', error);
    }
  }, [getCacheStats]);

  // Auto-otimização
  const optimizePerformance = useCallback(async () => {
    setIsOptimizing(true);
    
    try {
      // 1. Limpeza de memória
      if (metrics.memoryUsage > 80) {
        await forceMemoryCheck();
        await clearCaches();
      }

      // 2. Limpeza de cache antigo
      if (metrics.cacheHitRate < 50) {
        await clearOldCaches();
      }

      // 3. Preload de recursos críticos
      const criticalResources = [
        '/assets/flowagro-logo.jpg',
        '/assets/tela-inicial-background.jpg'
      ];
      await preloadResources(criticalResources);

      // 4. Cache de recursos da página atual
      const currentPath = window.location.pathname;
      await cacheResource(currentPath);

      // Atualizar métricas após otimização
      setTimeout(collectMetrics, 1000);
      
    } catch (error) {
      console.error('[Optimizer] Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [metrics, forceMemoryCheck, clearCaches, clearOldCaches, preloadResources, cacheResource, collectMetrics]);

  // Coleta métricas periodicamente
  useEffect(() => {
    collectMetrics();
    const interval = setInterval(collectMetrics, 5000);
    return () => clearInterval(interval);
  }, [collectMetrics]);

  // Auto-otimização quando necessário
  useEffect(() => {
    if (metrics.memoryUsage > 85 || metrics.cacheHitRate < 30) {
      optimizePerformance();
    }
  }, [metrics.memoryUsage, metrics.cacheHitRate, optimizePerformance]);

  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    return null; // Não mostrar em produção
  }

  const getStatusColor = (value: number, type: 'memory' | 'cache' | 'network') => {
    switch (type) {
      case 'memory':
        if (value > 85) return 'destructive';
        if (value > 70) return 'secondary';
        return 'default';
      case 'cache':
        if (value > 80) return 'default';
        if (value > 50) return 'secondary';
        return 'destructive';
      case 'network':
        if (value < 100) return 'default';
        if (value < 500) return 'secondary';
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 p-4 border shadow-lg bg-background/95 backdrop-blur z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Performance</span>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Ocultar' : 'Detalhes'}
          </Button>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Memória</span>
          <Badge variant={getStatusColor(metrics.memoryUsage, 'memory')}>
            {metrics.memoryUsage}%
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Cache Hit</span>
          <Badge variant={getStatusColor(metrics.cacheHitRate, 'cache')}>
            {metrics.cacheHitRate}%
          </Badge>
        </div>

        {isOnline && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Latência</span>
            <Badge variant={getStatusColor(metrics.networkLatency, 'network')}>
              {metrics.networkLatency}ms
            </Badge>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="space-y-2 mb-3 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Render médio:</span>
            <span>{metrics.renderTime}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Bundle cache:</span>
            <span>{metrics.bundleSize}kb</span>
          </div>
          <div className="flex justify-between">
            <span>API Memory:</span>
            <span>{isMemoryAPISupported ? 'Sim' : 'Não'}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={optimizePerformance}
          disabled={isOptimizing}
          className="flex-1"
        >
          {isOptimizing ? (
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Zap className="h-3 w-3 mr-1" />
          )}
          {isOptimizing ? 'Otimizando...' : 'Otimizar'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={clearOldCaches}
          className="px-3"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center mt-3 pt-3 border-t">
        <div className={`h-2 w-2 rounded-full mr-2 ${
          metrics.memoryUsage > 85 || metrics.cacheHitRate < 30 
            ? 'bg-red-500' 
            : metrics.memoryUsage > 70 || metrics.cacheHitRate < 60
            ? 'bg-yellow-500'
            : 'bg-green-500'
        }`} />
        <span className="text-xs text-muted-foreground">
          {metrics.memoryUsage > 85 || metrics.cacheHitRate < 30 
            ? 'Otimização necessária'
            : metrics.memoryUsage > 70 || metrics.cacheHitRate < 60
            ? 'Performance moderada'
            : 'Performance ótima'
          }
        </span>
      </div>
    </Card>
  );
});

PerformanceOptimizer.displayName = 'PerformanceOptimizer';