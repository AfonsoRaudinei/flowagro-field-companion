import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  Activity, 
  Database, 
  Zap, 
  Eye, 
  EyeOff,
  Download,
  Trash2
} from 'lucide-react';
import { SystemHealthDashboard } from './SystemHealthDashboard';
import { metrics, recordMetric } from '@/lib/metrics';
import { logger } from '@/lib/logger';
import { globalCache, satelliteCache } from '@/lib/cache';

interface DebugPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function DebugPanel({ isVisible, onToggle }: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<'health' | 'cache' | 'metrics' | 'logs'>('health');

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="bg-background/95 backdrop-blur-sm shadow-lg"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Debug Panel</h2>
            {import.meta.env.DEV && <Badge variant="secondary">Development</Badge>}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => location.reload()}>
              Reload App
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'health', label: 'System Health', icon: Activity },
            { id: 'cache', label: 'Cache Status', icon: Database },
            { id: 'metrics', label: 'Performance', icon: Zap },
            { id: 'logs', label: 'Logs', icon: Bug }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'health' && <SystemHealthDashboard />}
          {activeTab === 'cache' && <CacheStatusPanel />}
          {activeTab === 'metrics' && <MetricsPanel />}
          {activeTab === 'logs' && <LogsPanel />}
        </div>
      </div>
    </div>
  );
}

function CacheStatusPanel() {
  const globalStats = globalCache.getStats();
  const satelliteStats = satelliteCache.getStats();

  const clearCache = () => {
    globalCache.clear();
    satelliteCache.clear();
    logger.info('Cache cleared manually', { action: 'cache_clear' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cache Status</h3>
        <Button variant="outline" size="sm" onClick={clearCache}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Global Cache</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Size:</span>
              <Badge>{globalStats.size}/{globalStats.maxSize}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Valid Entries:</span>
              <Badge variant="outline">{globalStats.valid}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Expired:</span>
              <Badge variant="secondary">{globalStats.expired}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Hit Rate:</span>
              <Badge variant="default">{Math.round(globalStats.hitRate * 100)}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Satellite Cache</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Size:</span>
              <Badge>{satelliteStats.size}/{satelliteStats.maxSize}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Valid Entries:</span>
              <Badge variant="outline">{satelliteStats.valid}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Expired:</span>
              <Badge variant="secondary">{satelliteStats.expired}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Hit Rate:</span>
              <Badge variant="default">{Math.round(satelliteStats.hitRate * 100)}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricsPanel() {
  const summary = metrics.getMetricsSummary();
  const interactions = metrics.getInteractions();

  const exportMetrics = () => {
    const data = {
      summary,
      interactions: interactions.slice(0, 100), // Last 100 interactions
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance Metrics</h3>
        <Button variant="outline" size="sm" onClick={exportMetrics}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid gap-4">
        {Object.entries(summary).map(([name, data]: [string, any]) => (
          <Card key={name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{name.replace(/_/g, ' ')}</h4>
                <Badge variant="outline">{data.unit || 'count'}</Badge>
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Count</p>
                  <p className="font-mono">{data.count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg</p>
                  <p className="font-mono">{Math.round(data.avg * 100) / 100}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Min</p>
                  <p className="font-mono">{Math.round(data.min * 100) / 100}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max</p>
                  <p className="font-mono">{Math.round(data.max * 100) / 100}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Interactions ({interactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {interactions.slice(0, 20).map((interaction, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span>{interaction.action} on {interaction.component}</span>
                <span className="text-muted-foreground">
                  {new Date(interaction.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LogsPanel() {
  const [filter, setFilter] = useState('');
  const logs = logger.getLogs({ since: new Date(Date.now() - 60 * 60 * 1000) }); // Last hour
  const stats = logger.getStats();

  const filteredLogs = logs
    .filter(log => 
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      log.level.includes(filter.toLowerCase())
    )
    .slice(0, 100); // Show only 100 logs

  const exportLogs = () => {
    const blob = new Blob([logger.exportLogs('json')], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Application Logs</h3>
        <Button variant="outline" size="sm" onClick={exportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-semibold">{stats.total}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Errors</p>
          <p className="text-lg font-semibold text-red-600">{stats.byLevel.error || 0}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Warnings</p>
          <p className="text-lg font-semibold text-yellow-600">{stats.byLevel.warn || 0}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Info</p>
          <p className="text-lg font-semibold text-blue-600">{stats.byLevel.info || 0}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Recent Errors</p>
          <p className="text-lg font-semibold text-red-600">{stats.recentErrors}</p>
        </Card>
      </div>

      {/* Filter */}
      <input
        type="text"
        placeholder="Filter logs..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full px-3 py-2 border rounded-md"
      />

      {/* Logs */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredLogs.map((log, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-start gap-2">
              <Badge 
                variant={
                  log.level === 'error' || log.level === 'critical' ? 'destructive' :
                  log.level === 'warn' ? 'secondary' : 
                  'default'
                }
                className="text-xs"
              >
                {log.level}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{log.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
                {log.context && Object.keys(log.context).length > 0 && (
                  <details className="mt-1">
                    <summary className="text-xs cursor-pointer text-muted-foreground">
                      Context ({Object.keys(log.context).length} keys)
                    </summary>
                    <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto">
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}