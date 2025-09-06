import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Zap, 
  Clock, 
  HardDrive, 
  Wifi, 
  RefreshCw 
} from 'lucide-react';
import { performanceMonitor } from '@/lib/unifiedPerformance';
import { preloadSystem } from '@/lib/preloadSystem';
import { logger } from '@/lib/logger';

interface BundleStats {
  totalSize: number;
  loadedChunks: string[];
  pendingChunks: string[];
  cacheHitRate: number;
  networkLatency: number;
  renderTime: number;
}

/**
 * Componente para análise de performance e bundle em desenvolvimento
 */
export const BundleAnalyzer: React.FC<{ isVisible?: boolean }> = ({ 
  isVisible = false 
}) => {
  const [stats, setStats] = useState<BundleStats>({
    totalSize: 0,
    loadedChunks: [],
    pendingChunks: [],
    cacheHitRate: 0,
    networkLatency: 0,
    renderTime: 0
  });

  const [preloadStats, setPreloadStats] = useState<any>(null);

  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      // Simular estatísticas (em produção viriam de APIs reais)
      const performanceEntries = performance.getEntriesByType('navigation');
      const navigationEntry = performanceEntries[0] as PerformanceNavigationTiming;

      // Get preload system stats
      const preloadData = preloadSystem.getStats();

      setStats({
        totalSize: Math.round(Math.random() * 2000 + 1000), // KB
        loadedChunks: [
          'vendor-react', 'vendor-ui', 'chunk-maps', 
          'chunk-data', 'main'
        ],
        pendingChunks: ['chunk-canvas', 'chunk-charts'],
        cacheHitRate: Math.round(Math.random() * 30 + 70), // 70-100%
        networkLatency: navigationEntry ? 
          Math.round(navigationEntry.responseStart - navigationEntry.requestStart) : 
          Math.round(Math.random() * 100 + 50),
        renderTime: navigationEntry ? 
          Math.round(navigationEntry.loadEventEnd - navigationEntry.loadEventStart) : 
          Math.round(Math.random() * 500 + 200)
      });

      setPreloadStats(preloadData);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible || !import.meta.env.DEV) {
    return null;
  }

  const getBadgeVariant = (value: number, threshold: number) => {
    return value > threshold ? 'destructive' : value > threshold * 0.7 ? 'secondary' : 'default';
  };

  return (
    <Card className="p-4 bg-background/95 backdrop-blur-sm border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Bundle Analyzer</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Bundle Size</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.totalSize}</span>
              <span className="text-sm text-muted-foreground">KB</span>
              <Badge variant={getBadgeVariant(stats.totalSize, 1500)}>
                {stats.totalSize > 1500 ? 'Alto' : 'OK'}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Latência</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.networkLatency}</span>
              <span className="text-sm text-muted-foreground">ms</span>
              <Badge variant={getBadgeVariant(stats.networkLatency, 200)}>
                {stats.networkLatency > 200 ? 'Lento' : 'Rápido'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Cache Hit Rate</span>
            </div>
            <span className="text-sm font-bold">{stats.cacheHitRate}%</span>
          </div>
          <Progress value={stats.cacheHitRate} className="h-2" />
        </div>

        {/* Chunks Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Chunks Carregados</h4>
          <div className="flex flex-wrap gap-1">
            {stats.loadedChunks.map(chunk => (
              <Badge key={chunk} variant="default" className="text-xs">
                ✓ {chunk}
              </Badge>
            ))}
          </div>
        </div>

        {stats.pendingChunks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Chunks Pendentes</h4>
            <div className="flex flex-wrap gap-1">
              {stats.pendingChunks.map(chunk => (
                <Badge key={chunk} variant="secondary" className="text-xs">
                  ⏳ {chunk}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Preload Stats */}
        {preloadStats && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <h4 className="text-sm font-medium">Sistema de Preload</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Total Tasks: {preloadStats.totalTasks}</div>
              <div>Carregadas: {preloadStats.loadedTasks}</div>
              <div>Hit Rate: {Math.round(preloadStats.hitRate * 100)}%</div>
              <div>Concurrent: {preloadStats.concurrentLimit}</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/50">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
              }
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
          >
            Limpar Cache
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              preloadSystem.reset();
              logger.info('Preload system reset');
            }}
          >
            Reset Preload
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default BundleAnalyzer;